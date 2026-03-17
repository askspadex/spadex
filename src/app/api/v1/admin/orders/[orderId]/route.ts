import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verify-auth";
import { ApiError } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";

export async function GET(
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

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        user: {
            select: {
                name: true,
                email: true,
                image: true,
                createdAt: true,
            }
        },
        orderItems: { 
          include: {
            product: {
              include: {
                images: true,
              }
            },
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Order not found"
      );
    }

    return NextResponse.json(
      new ApiResponse("Order fetched successfully", order),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    return handleApiError(error);
  }
}