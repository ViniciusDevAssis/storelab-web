import { ProductDetail } from "@/components/products/product-detail";
export const metadata = { title: "Produto" };
export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductDetail key={productId} productId={productId} />;
}
