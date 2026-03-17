import { handleApiError } from "@/lib/api-handler"
import { NextRequest, NextResponse } from "next/server"
import { ApiResponse } from "@/lib/api-response"
import { ApiError } from "@/lib/api-error"
import { HTTP_STATUS } from "@/lib/http-status"
import { verifyAuth } from "@/lib/verify-auth"
import prisma from "@/lib/prisma"

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ categoryId: string }> }
){
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

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: {
                id: (await params).categoryId,
            }
        })

        if (!existingCategory) {
            throw new ApiError(
                HTTP_STATUS.NOT_FOUND, "Category not found."
            )
        }

        // Update category name
        const updatedCategory = await prisma.category.update({
            where: {
                id: (await params).categoryId
            },
            data: {
                name: categoryName
            }
        })

        return NextResponse.json(
            new ApiResponse(
                "Category updated successfully",
                updatedCategory
            ),{
                status: HTTP_STATUS.OK
            }
        )
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ categoryId: string }> }
){
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== "ADMIN") {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED, "Unauthorized access. Admins only."
            )
        }

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: {
                id: (await params).categoryId,
            }
        })

        if (!existingCategory) {
            throw new ApiError(
                HTTP_STATUS.NOT_FOUND, "Category not found."
            )
        }

        // Delete category
        const deletedCategory = await prisma.category.delete({
            where: {
                id: (await params).categoryId
            }
        })

        return NextResponse.json(
            new ApiResponse(
                "Category deleted successfully",
                deletedCategory
            ),{
                status: HTTP_STATUS.OK
            }
        )
    } catch (error) {
        return handleApiError(error);
    }
}