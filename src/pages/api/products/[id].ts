import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../lib/supabase";
import { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Product | { error: string }>
) {
  let id = req.query.id;
  if (Array.isArray(id)) id = id[0]; // ambil id pertama kalau array

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid ID" });
  }
  
  const { data, error } = await supabase
    .from("products")
    .select("*")  
    .eq("id", id)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json(data);
}
