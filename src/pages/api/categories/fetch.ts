import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch all categories with product count
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select(`
        *,
        products:products(count)
      `)
      .order("name", { ascending: true });

    if (categoriesError) {
      console.error("Categories error:", categoriesError);
      throw categoriesError;
    }

    // Transform the data to include product_count
    const categoriesWithCount = categories?.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      icon: cat.icon,
      product_count: cat.products?.[0]?.count || 0,

    }));

    return res.status(200).json({ categories: categoriesWithCount || [] });
  } catch (err) {
    console.error("Fetch categories error:", err);
    return res.status(500).json({
      error: "Failed to fetch categories",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}