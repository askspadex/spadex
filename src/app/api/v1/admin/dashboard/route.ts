import { ApiError } from "@/lib/api-error";
import { handleApiError } from "@/lib/api-handler";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verify-auth";
import { NextRequest, NextResponse } from "next/server";
import { PaymentStatus, DeliveryStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "ADMIN") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Admins only."
      );
    }

    const [totalUsers, totalOrders, totalProducts, validOrders] =
      await Promise.all([
        prisma.user.count(),
        prisma.order.count(),
        prisma.product.count(),

        prisma.order.findMany({
          where: {
            status: {
              notIn: [DeliveryStatus.CANCELLED, DeliveryStatus.RETURNED],
            },
            payments: {
              some: {
                status: PaymentStatus.COMPLETED,
              },
            },
          },
          select: {
            total: true,
          },
        }),
      ]);

    const totalRevenue = validOrders
      .reduce((acc, order) => acc + order.total, 0)
      .toFixed(2);

    const dashboardData = {
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
    };

    return NextResponse.json(
      new ApiResponse("Dashboard fetched successfully", dashboardData),
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    return handleApiError(error);
  }
}