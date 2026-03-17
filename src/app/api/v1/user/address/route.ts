import { handleApiError } from "@/lib/api-handler";
import { verifyAuth } from "@/lib/verify-auth";
import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HTTP_STATUS } from "@/lib/http-status";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);

        if (!auth || auth.role !== "USER") {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                "Unauthorized access. Users only."
            )
        }

        const body = await req.json();

        const { firstName, lastName, company, street1, street2, city, state, postalCode, country, phoneNumber } = body;

        if (!firstName || !lastName || !street1 || !city || !state || !postalCode || !country || !phoneNumber) {
            throw new Error(
                "Missing required address fields."
            )
        }

        const address = await prisma.address.create({
            data: {
                firstName,
                lastName,
                company,
                street1,
                street2,
                city,
                state,
                postalCode,
                country,
                phoneNumber,
                userId: auth.userId
            }
        })

        return NextResponse.json(
            new ApiResponse(
                "Address created successfully",
                address
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

        if (!auth || auth.role !== "USER") {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                "Unauthorized access. Users only."
            )
        }

        const addresses = await prisma.address.findMany({
            where: {
                userId: auth.userId
            }
        })

        if (addresses.length === 0) {
            return NextResponse.json(
                new ApiResponse(
                    "No addresses found for this user.",
                    []
                ), {
                status: HTTP_STATUS.OK
            }
            )
        }

        return NextResponse.json(
            new ApiResponse(
                "Addresses retrieved successfully",
                addresses
            ), {
            status: HTTP_STATUS.OK
        }
        )
    } catch (error) {
        return handleApiError(error);
    }
}

