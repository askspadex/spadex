import { handleApiError } from "@/lib/api-handler";
import { verifyAuth } from "@/lib/verify-auth";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Users only."
      );
    }

    const { productId } = await params;

    if (!productId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid product ID"
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        quantity: true,

        category: {
          select: {
            name: true
          }
        },

        images: {
          select: {
            url: true
          }
        },

        cost: {
          take: 1,
          select: {
            basePrice: true,
            discount: true,
            tax: true,
            shipping: true
          }
        },

        details: {
          take: 1,
          select: {
            model: true,
            countryOfOrigin: true,
            warrantyPeriod: true,
            department: true,
            genericName: true
          }
        },

        reviews: {
          orderBy: {
            createdAt: "desc"
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true
          }
        },

        _count: {
          select: {
            reviews: true
          }
        }
      }
    });

    if (!product) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Product not found"
      );
    }

    const cost = product.cost[0];

    const basePrice = cost ? cost.basePrice / 100 : 0;
    const discount = cost ? cost.discount : 0;

    const discountAmount = basePrice * (discount / 100);
    const priceAfterDiscount = basePrice - discountAmount;

    const finalPrice = 
      priceAfterDiscount;

    const totalReviews = product._count.reviews;

    const avgRating =
      totalReviews === 0
        ? 0
        : product.reviews.reduce((acc, r) => acc + r.rating, 0) /
          totalReviews;

    const response = {
      id: product.id,
      name: product.name,
      description: product.description,

      category: product.category.name,

      images: product.images.map((img) => img.url),

      inStock: product.quantity > 0,

      pricing: {
        basePrice,
        discountPercent: discount,
        taxPercent: cost?.tax ?? 0,
        shipping: cost ? cost.shipping / 100 : 0,
        finalPrice
      },

      details: product.details[0] ?? null,

      reviewSummary: {
        averageRating: avgRating,
        totalReviews
      },

      reviews: product.reviews
    };

    return NextResponse.json(
      new ApiResponse(
        "Product details fetched successfully",
        response
      ),
      {
        status: HTTP_STATUS.OK
      }
    );

  } catch (error) {
    return handleApiError(error);
  }
}