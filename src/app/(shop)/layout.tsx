import Footer from "@/components/layout/footer/footer";
import Navbar from "@/components/layout/navigation/navbar";

export default function ShopLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
