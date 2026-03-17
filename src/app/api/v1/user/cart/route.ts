import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { HTTP_STATUS } from "@/lib/http-status";
import { verifyAuth } from "@/lib/verify-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "USER") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Users only."
      );
    }

    const cart = await prisma.cart.findFirst({
      where: { userId: auth.userId },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                images: {
                  select: { url: true }
                },
                cost: {
                  select: {
                    basePrice: true,
                    discount: true,
                    shipping: true
                  }
                }
              }
            }
          }
        }
      }
    });

    let overallTotal = 0;
    const cartWithTotals = cart?.cartItems.map(item => {
      const { basePrice, discount, shipping } = item.product.cost[0];
      const discountedPrice = basePrice - (basePrice * discount) / 100;
      const totalPrice = discountedPrice * item.quantity + shipping;
      overallTotal += totalPrice;
      return {
        ...item,
        totalPrice
      };
    });

    return NextResponse.json(
      new ApiResponse("Cart fetched successfully", cartWithTotals),
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

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

    const { productId, quantity } = body;

    if (!productId || !quantity) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "ProductId and quantity required"
      );
    }

    const cart = await prisma.cart.upsert({
      where: {
        userId: auth.userId
      },
      update: {},
      create: {
        userId: auth.userId
      }
    });

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId
      }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity
        }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity
        }
      });
    }

    return NextResponse.json(
      new ApiResponse("Item added to cart", null),
      { status: HTTP_STATUS.CREATED }
    );

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "USER") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Users only."
      );
    }

    const cart = await prisma.cart.findFirst({
      where: { userId: auth.userId }
    });

    if (!cart) {
      return NextResponse.json(
        new ApiResponse("Cart already empty", null),
        { status: HTTP_STATUS.OK }
      );
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return NextResponse.json(
      new ApiResponse("Cart cleared successfully", null),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    return handleApiError(error);
  }
}