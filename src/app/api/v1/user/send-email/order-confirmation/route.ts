import { handleApiError } from "@/lib/api-handler";
import { verifyAuth } from "@/lib/verify-auth";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { HTTP_STATUS } from "@/lib/http-status";
import { Resend } from "resend";
import React from "react";
import prisma from "@/lib/prisma";
import { OrderCompletionEmail, OrderItem } from "@/emails/order-completion-email";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access."
      );
    }

    const { orderId } = await req.json();

    if (!orderId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Order id is required."
      );
    }

    // Fetch order with relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: {
          include: {
            product: {
              include: {
                images: true,
                cost: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Order not found."
      );
    }

    const username = order.user.name ?? "Valued Customer";
    const email = order.user.email;

    // Map items
    const items: OrderItem[] = order.orderItems.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      price: item.priceAtPurchase,
      image: item.product.images?.[0]?.url ?? null,
    }));

    // Calculate subtotal
    let subtotal = order.orderItems.reduce(
      (sum, item) => sum + item.priceAtPurchase * item.quantity,
      0
    );

    const tax = subtotal * 0.02;
    const shipping = 0;
    subtotal = subtotal - tax;
    const total = subtotal + tax + shipping;

    const orderDate = order.createdAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const estimatedDelivery = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const deliveryAddress = "Your selected delivery address"; // optional if you store it in order later

    const { data, error } = await resend.emails.send({
      from: "SpadeX <orders@projectivex.com>",
      to: [email],
      subject: `Order Confirmed 💎 — #${order.id.slice(0, 10).toUpperCase()}`,
      react: React.createElement(OrderCompletionEmail, {
        username,
        email,
        orderId: order.id,
        orderDate,
        estimatedDelivery,
        items,
        subtotal,
        tax,
        shipping,
        total,
        deliveryAddress,
      }),
    });

    if (error) {
      console.error("Resend error:", error);

      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Failed to send order confirmation email."
      );
    }

    return NextResponse.json(
      new ApiResponse("Order confirmation email sent successfully", {
        emailId: data?.id ?? null,
      }),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    return handleApiError(error);
  }
}