import { handleApiError } from "@/lib/api-handler";
import { verifyAuth } from "@/lib/verify-auth";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { Prisma, DeliveryStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);

        if (!auth) {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                "Unauthorized access. Users only."
            );
        }

        const { searchParams } = new URL(req.url);

        const pageParam = searchParams.get("page");
        const limitParam = searchParams.get("limit");

        const page = pageParam ? parseInt(pageParam) : 1;
        const limit = limitParam ? parseInt(limitParam) : 10;

        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = {
            userId: auth.userId,

            // EXCLUDE PAYMENT_PENDING ORDERS
            status: {
                not: DeliveryStatus.PAYMENT_PENDING,
            },
        };

        const [orders, totalOrders] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    status: true,
                    total: true,
                    createdAt: true,

                    orderItems: {
                        select: {
                            id: true,
                            productName: true,
                            quantity: true,
                            priceAtPurchase: true,
                            deliveryStatus: true,
                            deliveryDate: true,

                            product: {
                                select: {
                                    images: {
                                        take: 1,
                                        select: {
                                            url: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),

            prisma.order.count({ where }),
        ]);

        const formattedOrders = orders.map((order) => {
            return {
                id: order.id,
                status: order.status,
                total: order.total,
                createdAt: order.createdAt,

                items: order.orderItems.map((item) => ({
                    id: item.id,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.priceAtPurchase,
                    deliveryStatus: item.deliveryStatus,
                    deliveryDate: item.deliveryDate,

                    image: item.product.images[0]?.url ?? null,
                })),
            };
        });

        const totalPages = Math.ceil(totalOrders / limit);

        return NextResponse.json(
            new ApiResponse("Orders fetched successfully", {
                orders: formattedOrders,
                pagination: {
                    page,
                    limit,
                    totalOrders,
                    totalPages,
                },
            }),
            {
                status: HTTP_STATUS.OK,
            }
        );
    } catch (error) {
        return handleApiError(error);
    }
}