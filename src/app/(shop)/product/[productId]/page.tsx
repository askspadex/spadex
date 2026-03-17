'use client';
import Product from "@/components/shop/product";
import { useParams } from "next/navigation"

export default function ProductPage() {

    const params = useParams();
    const productId = params.productId as string;

    return (
        <>
            <Product productId={productId} />
        </>
    )
}