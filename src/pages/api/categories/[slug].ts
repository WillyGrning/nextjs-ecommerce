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
    const { slug } = req.query;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ error: "Category slug is required" });
    }

    // Fetch category by slug WITH products in one query
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select(`
        id,
        name,
        slug,
        description,
        image,
        icon,
        products (
          id,
          name,
          price,
          image,
          stock,
          discount,
          rating
        )
      `)
      .eq("slug", slug)
      .single();

    if (categoryError) {
      console.error("Category error:", categoryError);
      
      if (categoryError.code === "PGRST116") {
        return res.status(404).json({ error: "Category not found" });
      }
      
      throw categoryError;
    }

    // Separate category info and products
    const { products, ...categoryInfo } = category;

    return res.status(200).json({
      category: categoryInfo,
      products: products || [],
    });
  } catch (err) {
    console.error("Fetch category error:", err);
    return res.status(500).json({
      error: "Failed to fetch category",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}