'use client'
import { useParams } from "next/navigation";
import Category from "@/components/shop/category";

export default function CategoryPage() {

    const params = useParams();
    const categoryName = params.categoryName as string;

    return (
        <>
            <Category categoryName={categoryName} />        
        </>
    )
}