import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import MobileBottomNav from "@/components/storefront/MobileBottomNav";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pb-16 md:pb-0 overflow-x-hidden">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

