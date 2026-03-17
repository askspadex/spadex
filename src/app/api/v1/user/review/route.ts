import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import { verifyAuth } from "@/lib/verify-auth";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

export async function POST(req: NextRequest){
    try {
        const auth = await verifyAuth(req);

        if (!auth || auth.role !== "USER") {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                "Unauthorized access. Users only."
            );
        }

        const body = await req.json();

        const { productId, rating, comment } = body;

        if (!productId || !rating || !comment) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "Product ID, rating and comment required"
            );
        }

        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            throw new ApiError(
                HTTP_STATUS.NOT_FOUND,
                "Product not found"
            );
        }

        const existingReview = await prisma.review.findFirst({
            where: {
                productId,
                userId: auth.userId
            }
        });

        if (existingReview) {
            throw new ApiError(
                HTTP_STATUS.CONFLICT,
                "Review already exists"
            );
        }

        const review = await prisma.review.create({
            data: {
                productId,
                rating,
                comment,
                userId: auth.userId
            }
        });

        return NextResponse.json(
            new ApiResponse("Review created successfully", review),
            { status: HTTP_STATUS.CREATED }
        );
    } catch (error) {
        return handleApiError(error);
    }
}