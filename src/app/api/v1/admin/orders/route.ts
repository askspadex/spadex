import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verify-auth";
import { ApiError } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import { Prisma, DeliveryStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "ADMIN") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Admins only."
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "10");
    const statusParam = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (statusParam) {
      where.status = statusParam as DeliveryStatus;
    }

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.order.count({
        where,
      }),
    ]);

    return NextResponse.json(
      new ApiResponse("Orders fetched successfully", {
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }),
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    return handleApiError(error);
  }
}