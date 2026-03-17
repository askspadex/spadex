import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { HTTP_STATUS } from "@/lib/http-status";
import { verifyAuth } from "@/lib/verify-auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "ADMIN") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Admins only."
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

    if (!name || !categoryId || !basePrice) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Missing required product fields"
      );
    }

    const product = await prisma.$transaction(async (tx) => {
      // Create Product
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          quantity,
          categoryId,
        },
      });

      // Create Cost
      await tx.productCost.create({
        data: {
          basePrice: basePrice * 100,
          discount,
          tax,
          shipping: shipping * 100,
          productId: newProduct.id,
        },
      });

      // Create Images
      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url: string) => ({
            url,
            productId: newProduct.id,
          })),
        });
      }

      // Create Product Details
      await tx.productDetail.create({
        data: {
          model,
          countryOfOrigin,
          warrantyPeriod,
          department,
          genericName,
          productId: newProduct.id,
        },
      });

      return newProduct;
    });

    return NextResponse.json(
      new ApiResponse(
        "Product created successfully",
        product
      ), {
      status: HTTP_STATUS.CREATED
    }
    )
  } catch (error) {
    return handleApiError(error);
  }
}

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

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const categoryId = searchParams.get("categoryId");

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 && limit <= 50 ? limit : 10;

    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.ProductWhereInput = categoryId
      ? { categoryId }
      : {};

    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          category: true,
          images: {
            select: {
              url: true,
            },
          },
          cost: {
            select: {
              basePrice: true,
              discount: true,
              tax: true,
              shipping: true,
            },
          },
          details: true
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithPrice = products.map((product) => {
      const cost = product.cost[0];

      if (!cost) {
        return {
          ...product,
          quantity: product.quantity,
        };
      }

      // Calculations
      const basePrice = cost.basePrice / 100;
      const shipping = cost.shipping / 100;

      const discount = cost.discount;
      const tax = cost.tax;

      const discountAmount = basePrice * (discount / 100);
      const afterDiscountPrice = basePrice - discountAmount;

      const taxAmount = afterDiscountPrice * (tax / 100);

      const finalPrice = afterDiscountPrice + taxAmount + shipping;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        quantity: product.quantity,
        category: product.category,
        images: product.images,
        details: product.details,
        createdAt: product.createdAt,
        pricing: {
          basePrice : basePrice,
          discountPercent: discount,
          taxPercent: tax,
          shipping: shipping,
          discountAmount,
          taxAmount,
          finalPrice: finalPrice,
        },

        stockStatus:
          product.quantity === 0
            ? "OUT_OF_STOCK"
            : product.quantity < 10
            ? "LOW_STOCK"
            : "IN_STOCK",
      };
    });

    const totalPages = Math.ceil(totalProducts / safeLimit);

    return NextResponse.json(
      new ApiResponse("Products fetched successfully", {
        products: productsWithPrice,
        pagination: {
          page: safePage,
          limit: safeLimit,
          totalProducts,
          totalPages,
        },
      }),
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    return handleApiError(error);
  }
}