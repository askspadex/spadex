import { handleApiError } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import { verifyAuth } from "@/lib/verify-auth";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { Prisma } from "@prisma/client";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ addressId: string }> }
) {
    try {
        const auth = await verifyAuth(req);

        if (!auth || auth.role !== "USER") {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                "Unauthorized access. Users only."
            );
        }

        const { addressId } = await params;

        if (!addressId) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "Invalid address ID."
            );
        }

        const body = await req.json();

        if (Object.keys(body).length === 0) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "No fields provided for update."
            );
        }

        const updatedAddress = await prisma.address.update({
            where: {
                id: addressId,
                userId: auth.userId
            },
            data: body as Prisma.AddressUpdateInput
        });

        return NextResponse.json(
            new ApiResponse
                (
                    "Address updated successfully",
                    updatedAddress
                ), {
            status: HTTP_STATUS.OK
        }
        )
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth || auth.role !== "USER") {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized access. Users only."
      );
    }

    const { addressId } = await params;

    if (!addressId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid address ID."
      );
    }

    const deletedAddress = await prisma.address.delete({
      where: {
        id: addressId,
        userId: auth.userId
      }
    });

    return NextResponse.json(
      new ApiResponse(
        "Address deleted successfully",
        deletedAddress
      ),
      {
        status: HTTP_STATUS.OK
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}