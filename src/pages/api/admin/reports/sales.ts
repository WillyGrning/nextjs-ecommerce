import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { createClient } from "@supabase/supabase-js";

/* =========================
   Supabase Client
========================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* =========================
   RAW TYPES (REAL FROM DB)
========================= */
interface UserRaw {
  fullname: string;
}

interface OrderRaw {
  id: string;
  created_at: string;
  status: string;
  users: UserRaw;
}

interface ProductRaw {
  name: string;
  category: string;
}

interface SalesDataRaw {
  id: string;
  quantity: number;
  price_at_time: number;
  orders: OrderRaw;
  products: ProductRaw;
}

/* =========================
   RESPONSE TYPE
========================= */
export interface SalesReportItem {
  id: string;
  order_date: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_revenue: number;
  customer_name: string;
  status: string;
}

/* =========================
   Handler
========================= */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /* ---------- Auth ---------- */
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { dateFrom, dateTo, category } = req.query;

    /* ---------- Query ---------- */
    let query = supabase
      .from("order_items")
      .select(
        `
        id,
        quantity,
        price_at_time,
        orders!inner (
          id,
          created_at,
          status,
          users!inner (
            fullname
          )
        ),
        products!inner (
          name,
          category
        )
      `
      );

    if (dateFrom) {
      query = query.gte("orders.created_at", String(dateFrom));
    }

    if (dateTo) {
      query = query.lte("orders.created_at", String(dateTo));
    }

    if (category) {
      query = query.eq("products.category", String(category));
    }

    const { data, error } = await query.order("created_at", {
      foreignTable: "orders",
      ascending: false,
    });

    if (error) throw error;
    if (!data) {
      return res.status(200).json({ data: [] });
    }

    /* ---------- Mapping ---------- */
    const salesReport: SalesReportItem[] = (data as unknown as SalesDataRaw[]).map(
      (item) => ({
        id: item.id,
        order_date: item.orders.created_at,
        product_name: item.products.name,
        quantity: item.quantity,
        unit_price: item.price_at_time,
        total_revenue: item.quantity * item.price_at_time,
        customer_name: item.orders.users.fullname,
        status: item.orders.status,
      })
    );

    return res.status(200).json({ data: salesReport });
  } catch (error) {
    console.error("Error fetching sales report:", error);

    return res.status(500).json({
      message: "Failed to fetch sales report",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
