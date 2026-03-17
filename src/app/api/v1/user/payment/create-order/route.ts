import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import { verifyAuth } from "@/lib/verify-auth";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);

        if (!auth || auth.role !== "USER") {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                "Unauthorized access. Users only."
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
        });

        if (!user) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
        }

        const body = await req.json();
        const { addressId } = body;

        if (!addressId) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "AddressId is required");
        }

        const address = await prisma.address.findUnique({
            where: {
                id: addressId,
                userId: auth.userId,
            },
        });

        if (!address) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Address not found");
        }

        /* ---------------- FETCH CART WITH ITEMS ---------------- */
        const cart = await prisma.cart.findUnique({
            where: { userId: auth.userId },
            include: {
                cartItems: {
                    include: {
                        product: {
                            include: {
                                cost: true, // ProductCost[]
                            },
                        },
                    },
                },
            },
        });

        if (!cart) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart not found");
        }

        if (cart.cartItems.length === 0) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Cart is empty");
        }

        /* ---------------- VALIDATE STOCK & COSTS ---------------- */
        for (const item of cart.cartItems) {
            if (item.product.cost.length === 0) {
                throw new ApiError(
                    HTTP_STATUS.BAD_REQUEST,
                    `Product "${item.product.name}" has no pricing information`
                );
            }

            if (item.product.quantity < item.quantity) {
                throw new ApiError(
                    HTTP_STATUS.BAD_REQUEST,
                    `Insufficient stock for "${item.product.name}". Available: ${item.product.quantity}`
                );
            }
        }

        /* ---------------- CALCULATE TOTAL ---------------- */
        // Formula per item: ((basePrice * (1 - discount/100)) + tax + shipping) * quantity
        // basePrice and shipping are in paise (Int), discount and tax are floats (percentage)
        let totalPaise = 0;

        const orderItemsData = cart.cartItems.map((item) => {
            const cost = item.product.cost[0]; // use the latest/first cost record

            const discountAmount = cost.basePrice * (cost.discount / 100);
            const priceAfterDiscount = cost.basePrice - discountAmount;
            const taxAmount = priceAfterDiscount * (cost.tax / 100);
            const finalUnitPrice = priceAfterDiscount + taxAmount + cost.shipping;
            const lineTotal = finalUnitPrice * item.quantity;

            totalPaise += lineTotal;

            // deliveryDate: 7 days from now
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 7);

            return {
                productId: item.productId,
                priceAtPurchase: finalUnitPrice / 100, // store in rupees
                productName: item.product.name,
                quantity: item.quantity,
                deliveryDate,
            };
        });

        const totalRupees = totalPaise / 100;

        /* ---------------- CREATE ORDER IN DB (transaction) ---------------- */
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // Use a transaction so DB order + Razorpay are atomic on the DB side
        const newOrder = await prisma.$transaction(async (tx) => {
            // 1. Create the Order
            const order = await tx.order.create({
                data: {
                    userId: auth.userId,
                    total: totalRupees,
                    status: "PAYMENT_PENDING",
                    orderItems: {
                        create: orderItemsData,
                    },
                },
                include: { orderItems: true },
            });

            // 2. Clear the cart
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return order;
        });

        /* ---------------- CREATE RAZORPAY ORDER ---------------- */
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalPaise),           // must be integer paise
            currency: "INR",
            receipt: `receipt_${Date.now()}_${auth.userId.slice(0, 6)}`,
            notes: {
                userId: auth.userId,
                orderId: newOrder.id,
            },
        });

        /* ---------------- SAVE PAYMENT RECORD ---------------- */
        await prisma.payment.create({
            data: {
                userId: auth.userId,
                orderId: newOrder.id,
                razorpayOrderId: razorpayOrder.id,
                amount: Math.round(totalPaise),
                currency: "INR",
                status: "CREATED",
            },
        });

        return NextResponse.json(
            new ApiResponse("Checkout created", {
                orderId: newOrder.id,
                razorpayOrderId: razorpayOrder.id,
                amount: Math.round(totalPaise),       // paise, for Razorpay SDK
                amountInRupees: totalRupees,           // human-readable
                currency: "INR",
                key: process.env.RAZORPAY_KEY_ID,
            }),
            { status: HTTP_STATUS.CREATED }
        );
    } catch (error) {
        return handleApiError(error);
    }
}