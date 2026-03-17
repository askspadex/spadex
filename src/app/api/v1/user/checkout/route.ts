import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { HTTP_STATUS } from "@/lib/http-status";
import { verifyAuth } from "@/lib/verify-auth";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "USER") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Users only."
      );
    }

    const body = await req.json();
    const { addressId } = body;

    if (!addressId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "AddressId is required"
      );
    }

    const cart = await prisma.cart.findFirst({
      where: { userId: auth.userId },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                cost: true
              }
            }
          }
        }
      }
    });

    if (!cart || cart.cartItems.length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Cart is empty"
      );
    }

    // Calculate total
    let total = 0;

    const items = cart.cartItems.map((item) => {
      const cost = item.product.cost[0];

      const discounted =
        cost.basePrice - (cost.basePrice * cost.discount) / 100;

      const itemTotal =
        discounted * item.quantity + cost.shipping;

      total += itemTotal;

      return {
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: discounted
      };
    });

    // Create Order
    const order = await prisma.order.create({
      data: {
        userId: auth.userId,
        total,
      }
    });

    // Create OrderItems
    await prisma.orderItem.createMany({
      data: items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        priceAtPurchase: item.price,
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }))
    });

    // Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: order.id
    });

    // Save payment
    await prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: Math.round(total * 100),
        currency: "INR"
      }
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return NextResponse.json(
      new ApiResponse(
        "Checkout created",
        {
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID
        }
      ),
      { status: HTTP_STATUS.CREATED }
    );

  } catch (error) {
    return handleApiError(error);
  }
}