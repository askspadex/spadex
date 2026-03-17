import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { HTTP_STATUS } from "@/lib/http-status";
import { verifyAuth } from "@/lib/verify-auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cartItemId: string }> }
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "USER") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Users only."
      );
    }

    const { cartItemId } = await params;

    const body = await req.json();
    const { quantity } = body;

    if (!quantity || quantity <= 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid quantity"
      );
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId }
    });

    if (!cartItem) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Cart item not found"
      );
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    });

    return NextResponse.json(
      new ApiResponse("Cart item updated", updatedCartItem),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cartItemId: string }> }
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "USER") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Users only."
      );
    }

    const { cartItemId } = await params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId }
    });

    if (!cartItem) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Cart item not found"
      );
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    return NextResponse.json(
      new ApiResponse("Item removed from cart", null),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    return handleApiError(error);
  }
}