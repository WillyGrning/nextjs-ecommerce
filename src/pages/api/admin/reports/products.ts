import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { createClient } from "@supabase/supabase-js";
import { OrderItem } from "@/types/order";
import { Product, ProductReport } from "@/types/product";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { dateFrom, dateTo, category } = req.query;

    // Get all products
    let productsQuery = supabase.from("products").select("*");

    if (category) {
      productsQuery = productsQuery.eq("category", category as string);
    }

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) throw productsError;

    // Get order items with date filter
    let orderItemsQuery = supabase
      .from("order_items")
      .select(
        `
        product_id,
        quantity,
        price_at_time,
        orders!inner (
          created_at,
          status
        )
      `
      )
      .eq("orders.status", "completed");

    if (dateFrom) {
      orderItemsQuery = orderItemsQuery.gte(
        "orders.created_at",
        dateFrom as string
      );
    }
    if (dateTo) {
      orderItemsQuery = orderItemsQuery.lte(
        "orders.created_at",
        dateTo as string
      );
    }

    const { data: orderItems, error: itemsError } = await orderItemsQuery;

    if (itemsError) throw itemsError;

    // Calculate sold and revenue per product
    const productStats: { [key: string]: { sold: number; revenue: number } } =
      {};

    (orderItems as OrderItem[])?.forEach((item) => {
      const productId = item.product_id;
      if (!productStats[productId]) {
        productStats[productId] = { sold: 0, revenue: 0 };
      }
      productStats[productId].sold += item.quantity;
      productStats[productId].revenue += item.quantity * item.price_at_time;
    });

    // Transform data
    const productsReport: ProductReport[] =
      (products as Product[])?.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category || "Uncategorized",
        stock: product.stock,
        sold: productStats[product.id]?.sold || 0,
        revenue: productStats[product.id]?.revenue || 0,
        status: product.status,
      })) || [];

    // Sort by revenue descending
    productsReport.sort((a, b) => b.revenue - a.revenue);

    return res.status(200).json({
      data: productsReport,
    });
  } catch (error: unknown) {
    console.error("Error fetching products report:", error);

    return res.status(500).json({
      message: "Failed to fetch products report",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
