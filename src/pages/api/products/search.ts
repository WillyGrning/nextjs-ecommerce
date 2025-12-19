import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ===============================
   Handler
================================ */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  switch (req.method) {
    case "GET":
      return handleGetProducts(req, res);

    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

/* ===============================
   GET /api/products/search
================================ */
async function handleGetProducts(req: NextApiRequest, res: NextApiResponse) {
  const {
    page = "1",
    limit = "10",
    search = "",
    status = "",
    category = "",
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Number(limit) || 10, 50);

  const from = (pageNumber - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select("id, name, price, category, stock, image, status, description", {
      count: "exact",
    });

  // Filter by search
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Filter by status
  if (status) {
    query = query.eq("status", status);
  }

  // Filter by category (bonus!)
  if (category) {
    query = query.eq("category", category);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("Fetch products error:", error);
    return res.status(500).json({
      message: "Failed to fetch products",
    });
  }

  return res.status(200).json({
    data,
    meta: {
      total: count ?? 0,
      page: pageNumber,
      limit: pageSize,
    },
  });
}