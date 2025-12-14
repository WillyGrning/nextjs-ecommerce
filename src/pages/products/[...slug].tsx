import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Database } from "@/types/supabase";
import ProductPage from "@/pages/views/productDetail";

type Product = Database["public"]["Tables"]["products"]["Row"];

export default function ProductDynamic() {
  const router = useRouter();
  const { slug } = router.query;

  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!slug) return; // tunggu router ready
    const id = Array.isArray(slug) ? slug[0] : slug;

    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data: Product) => {
          console.log("Fetched product:", data);
          setProduct(data);
        })
      .catch((err) => console.error(err));
  }, [slug]);

  if (!slug || !product) return <div>Loading...</div>;

  return (
    <ProductPage product={product} />
  );
}
