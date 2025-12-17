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
   RAW TYPES
========================= */
interface UserRaw {
  id: string;
  fullname: string;
  email: string;
}

interface OrderRaw {
  user_id: string | null;
  total: number;
  created_at: string;
  status: string;
}

/* =========================
   RESPONSE TYPE
========================= */
interface CustomerReportItem {
  id: string;
  name: string;
  email: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

/* =========================
   Handler
========================= */
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
    const { dateFrom, dateTo } = req.query;

    /* ---------- Users ---------- */
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, fullname, email");

    if (usersError) throw usersError;
    if (!users) return res.status(200).json({ data: [] });

    /* ---------- Orders ---------- */
    let ordersQuery = supabase
      .from("orders")
      .select("user_id, total, created_at, status");
    //   .eq("status", "completed");

    if (dateFrom) {
      ordersQuery = ordersQuery.gte("created_at", String(dateFrom));
    }

    if (dateTo) {
      ordersQuery = ordersQuery.lte("created_at", String(dateTo));
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    /* ---------- Stats ---------- */
    const customerStats: Record<
      string,
      {
        total_orders: number;
        total_spent: number;
        last_order_date: string;
      }
    > = {};

    (orders as OrderRaw[] | null)?.forEach((order) => {
      if (!order.user_id) return;

      if (!customerStats[order.user_id]) {
        customerStats[order.user_id] = {
          total_orders: 0,
          total_spent: 0,
          last_order_date: order.created_at,
        };
      }

      const stats = customerStats[order.user_id];
      stats.total_orders += 1;
      stats.total_spent += Number(order.total);

      if (new Date(order.created_at) > new Date(stats.last_order_date)) {
        stats.last_order_date = order.created_at;
      }
    });

    /* ---------- Transform ---------- */
    const customersReport: CustomerReportItem[] = (users as UserRaw[])
      .filter((user) => customerStats[user.id])
      .map((user) => ({
        id: user.id,
        name: user.fullname,
        email: user.email,
        total_orders: customerStats[user.id].total_orders,
        total_spent: customerStats[user.id].total_spent,
        last_order_date: customerStats[user.id].last_order_date,
      }))
      .sort((a, b) => b.total_spent - a.total_spent);

    return res.status(200).json({ data: customersReport });
  } catch (error: unknown) {
    console.error("Error fetching customers report:", error);

    return res.status(500).json({
      message: "Failed to fetch customers report",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
