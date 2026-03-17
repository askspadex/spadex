import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verify-auth";
import { ApiError } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import { DeliveryStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "ADMIN") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Admins only."
      );
    }

    const { orderId } = await params;

    if (!orderId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid order id"
      );
    }

    const body = await req.json();

    const status: DeliveryStatus = body.status;

    if (!status) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Status is required"
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Order not found"
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status
      }
    });

    return NextResponse.json(
      new ApiResponse("Order status updated successfully", updatedOrder),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    return handleApiError(error);
  }
}