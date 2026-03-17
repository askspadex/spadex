import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import { verifyAuth } from "@/lib/verify-auth";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);

        if (!auth || auth.role !== "USER") {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                "Unauthorized access. Users only."
            );
        }

        /* ---------------- PARSE BODY ---------------- */
        const body = await req.json();
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "orderId, razorpayOrderId, razorpayPaymentId and razorpaySignature are all required"
            );
        }

        /* ---------------- VERIFY PAYMENT RECORD EXISTS ---------------- */
        // Ensure the payment belongs to this user and is in CREATED state
        const payment = await prisma.payment.findUnique({
            where: {
                razorpayOrderId,   // unique in schema
            },
            include: {
                order: true,
            },
        });

        if (!payment) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Payment record not found");
        }

        if (payment.userId !== auth.userId) {
            throw new ApiError(
                HTTP_STATUS.FORBIDDEN,
                "You are not authorized to verify this payment"
            );
        }

        if (payment.orderId !== orderId) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "orderId does not match the payment record"
            );
        }

        // Idempotency — already verified (webhook may have beaten us)
        if (payment.status === "COMPLETED") {
            return NextResponse.json(
                new ApiResponse("Payment already verified", {
                    orderId: payment.orderId,
                    paymentId: payment.razorpayPaymentId,
                    status: payment.status,
                }),
                { status: HTTP_STATUS.OK }
            );
        }

        if (payment.status === "FAILED") {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "This payment has already been marked as failed"
            );
        }

        /* ---------------- VERIFY RAZORPAY SIGNATURE ---------------- */
        // Razorpay signs: razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        const isValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature, "hex"),
            Buffer.from(razorpaySignature, "hex")
        );

        if (!isValid) {
            // Mark payment as FAILED so it can't be retried with a forged signature
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: "FAILED" },
            });

            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "Payment signature verification failed. Possible tampered request."
            );
        }

        /* ---------------- UPDATE DB IN TRANSACTION ---------------- */
        await prisma.$transaction(async (tx) => {
            // 1. Mark payment COMPLETED and store Razorpay ids
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: "COMPLETED",
                    razorpayPaymentId,
                    razorpaySignature,
                },
            });

            // 2. Move order status → PROCESSING
            const order = await tx.order.update({
                where: { id: orderId },
                data: { status: "ORDERED" },
                include: {
                    orderItems: true
                }
            });

            // 3. Move every order item → PROCESSING
            await tx.orderItem.updateMany({
                where: { orderId },
                data: { deliveryStatus: "ORDERED" },
            });

            // 4. Decrement stock for every product
            for (const item of order.orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                });
            }
        });

        return NextResponse.json(
            new ApiResponse("Payment verified successfully", {
                orderId,
                paymentId: razorpayPaymentId,
                status: "COMPLETED",
            }),
            { status: HTTP_STATUS.OK }
        );

    } catch (error) {
        return handleApiError(error);
    }
}