import { handleApiError } from "@/lib/api-handler"
import { NextRequest, NextResponse } from "next/server"
import { ApiResponse } from "@/lib/api-response"
import { ApiError } from "@/lib/api-error"
import { HTTP_STATUS } from "@/lib/http-status"
import { verifyAuth } from "@/lib/verify-auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== "ADMIN") {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED, "Unauthorized access. Admins only."
            )
        }

        const categories = await prisma.category.findMany({
            orderBy: {
                createdAt: "desc"
            }
        })

        return NextResponse.json(
            new ApiResponse(
                "Categories fetched successfully",
                categories
            ), {
            status: HTTP_STATUS.OK
        }
        )
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== "ADMIN") {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED, "Unauthorized access. Admins only."
            )
        }

        const body = await req.json();
        const { categoryName } = body;

        if (!categoryName || typeof categoryName !== "string") {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST, "Invalid category name."
            )
        }

        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
            where: {
                name: categoryName
            }
        })

        if (existingCategory) {
            throw new ApiError(
                HTTP_STATUS.CONFLICT, "Category already exists."
            )
        }

        // Create new category
        const newCategory = await prisma.category.create({
            data: {
                name: categoryName
            }
        })

        return NextResponse.json(
            new ApiResponse(
                "Category created successfully",
                newCategory
            ), {
            status: HTTP_STATUS.CREATED
        }
        )
    } catch (error) {
        return handleApiError(error);
    }
}
