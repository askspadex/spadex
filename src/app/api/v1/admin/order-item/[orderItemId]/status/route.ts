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
    { params }: { params: Promise<{ orderItemId: string }> }
) {
    try {
        const auth = await verifyAuth(req);

        if (!auth || auth.role !== "ADMIN") {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                "Unauthorized access. Admins only."
            );
        }

        const { orderItemId } = await params;

        if (!orderItemId) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "Invalid order item id"
            );
        }

        const body = await req.json();

        const deliveryStatus: DeliveryStatus = body.deliveryStatus;

        const orderItem = await prisma.orderItem.findUnique({
            where: { id: orderItemId }
        });

        if (!orderItem) {
            throw new ApiError(
                HTTP_STATUS.NOT_FOUND,
                "Order item not found"
            );
        }

        const deliveryDate = body.deliveryDate
            ? new Date(body.deliveryDate)
            : undefined;

        const updatedOrderItem = await prisma.orderItem.update({
            where: { id: orderItemId },
            data: {
                deliveryStatus,
                deliveryDate
            }
        });

        return NextResponse.json(
            new ApiResponse(
                "Order item delivery updated successfully",
                updatedOrderItem
            ),
            { status: HTTP_STATUS.OK }
        );

    } catch (error) {
        return handleApiError(error);
    }
}