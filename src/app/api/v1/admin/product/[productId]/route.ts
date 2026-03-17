import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { HTTP_STATUS } from "@/lib/http-status";
import { verifyAuth } from "@/lib/verify-auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "ADMIN") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Admins only."
      );
    }

    const { productId } = await params;

    if (!productId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid product ID."
      );
    }

    const body = await req.json();

    const {
      name,
      description,
      quantity,
      categoryId,
      images,
      basePrice,
      discount,
      tax,
      shipping,
      model,
      countryOfOrigin,
      warrantyPeriod,
      department,
      genericName,
    } = body;

    if (categoryId !== undefined) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!categoryExists) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          "Category does not exist"
        );
      }
    }

    const product = await prisma.$transaction(async (tx) => {

      const productData: {
        name?: string
        description?: string
        quantity?: number
        categoryId?: string
      } = {};

      if (name !== undefined) productData.name = name;
      if (description !== undefined) productData.description = description;
      if (quantity !== undefined) productData.quantity = quantity;
      if (categoryId !== undefined) productData.categoryId = categoryId;

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: productData,
      });

      if (
        basePrice !== undefined ||
        discount !== undefined ||
        tax !== undefined ||
        shipping !== undefined
      ) {
        const costData: {
          basePrice?: number
          discount?: number
          tax?: number
          shipping?: number
        } = {};

        if (basePrice !== undefined) costData.basePrice = basePrice * 100;
        if (discount !== undefined) costData.discount = discount;
        if (tax !== undefined) costData.tax = tax;
        if (shipping !== undefined) costData.shipping = shipping * 100;

        await tx.productCost.updateMany({
          where: { productId },
          data: costData,
        });
      }

      if (
        model !== undefined ||
        countryOfOrigin !== undefined ||
        warrantyPeriod !== undefined ||
        department !== undefined ||
        genericName !== undefined
      ) {
        const detailData: {
          model?: string
          countryOfOrigin?: string
          warrantyPeriod?: string
          department?: string
          genericName?: string
        } = {};

        if (model !== undefined) detailData.model = model;
        if (countryOfOrigin !== undefined) detailData.countryOfOrigin = countryOfOrigin;
        if (warrantyPeriod !== undefined) detailData.warrantyPeriod = warrantyPeriod;
        if (department !== undefined) detailData.department = department;
        if (genericName !== undefined) detailData.genericName = genericName;

        await tx.productDetail.updateMany({
          where: { productId },
          data: detailData,
        });
      }

      if (images && images.length > 0) {
        await tx.productImage.deleteMany({
          where: { productId },
        });

        await tx.productImage.createMany({
          data: images.map((url: string) => ({
            url,
            productId,
          })),
        });
      }

      return updatedProduct;
    });

    return NextResponse.json(
      new ApiResponse("Product updated successfully", product),
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "ADMIN") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Admins only."
      );
    }

    const { productId } = await params;

    if (!productId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid product ID."
      );
    }

    await prisma.$transaction(async (tx) => {

      await tx.productImage.deleteMany({
        where: { productId },
      });

      await tx.productCost.deleteMany({
        where: { productId },
      });

      await tx.productDetail.deleteMany({
        where: { productId },
      });

      await tx.review.deleteMany({
        where: { productId },
      });

      await tx.cartItem.deleteMany({
        where: { productId },
      });

      await tx.orderItem.deleteMany({
        where: { productId },
      });

      await tx.product.delete({
        where: { id: productId },
      });

    });

    return NextResponse.json(
      new ApiResponse("Product deleted successfully", null),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    return handleApiError(error);
  }
}