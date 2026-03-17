import { handleApiError } from "@/lib/api-handler";
import { verifyAuth } from "@/lib/verify-auth";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { Prisma } from "@prisma/client";

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
    const categoryName = searchParams.get("categoryName");
    const search = searchParams.get("search");

    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 12;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    // ---------- CATEGORY FILTER ----------
    if (categoryName) {
      const category = await prisma.category.findUnique({
        where: {
          name: categoryName,
        },
        select: {
          id: true,
        },
      });

      if (!category) {
        throw new ApiError(
          HTTP_STATUS.NOT_FOUND,
          "Category does not exist"
        );
      }

      where.categoryId = category.id;
    }

    // ---------- SEARCH FILTER ----------
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          quantity: true,

          category: {
            select: {
              name: true,
            },
          },

          images: {
            take: 1,
            select: {
              url: true,
            },
          },

          cost: {
            take: 1,
            select: {
              basePrice: true,
              discount: true,
              tax: true,
              shipping: true,
            },
          },

          _count: {
            select: {
              reviews: true,
            },
          },

          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const formattedProducts = products.map((product) => {
      const cost = product.cost[0];

      const basePrice = cost ? cost.basePrice / 100 : 0;
      const discount = cost ? cost.discount : 0;

      const discountAmount = basePrice * (discount / 100);
      const finalPrice = basePrice - discountAmount;

      const totalReviews = product._count.reviews;

      const avgRating =
        totalReviews === 0
          ? 0
          : product.reviews.reduce((acc, r) => acc + r.rating, 0) /
            totalReviews;

      return {
        id: product.id,
        name: product.name,
        description: product.description,

        category: product.category.name,

        image: product.images[0]?.url ?? null,

        basePrice,
        discount,
        finalPrice,

        rating: avgRating,
        reviewCount: totalReviews,

        inStock: product.quantity > 0,
      };
    });

    const totalPages = Math.ceil(totalProducts / limit);

    return NextResponse.json(
      new ApiResponse("Products fetched successfully", {
        products: formattedProducts,
        pagination: {
          page,
          limit,
          totalProducts,
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