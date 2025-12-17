import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { createClient } from "@supabase/supabase-js";

interface OrderItem {
  product_id: string; // UUID atau string
  quantity: number;
  price: number; // optional, kalau perlu
}

// Tipe untuk order
interface Order {
  id: string;
  total: number;
  order_items?: OrderItem[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

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

    // Build base query
    let ordersQuery = supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("status", "completed");

    if (dateFrom) {
      ordersQuery = ordersQuery.gte("created_at", dateFrom as string);
    }
    if (dateTo) {
      ordersQuery = ordersQuery.lte("created_at", dateTo as string);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) throw ordersError;

    // Get unique customers
    const { data: customers, error: customersError } = await supabase
      .from("users")
      .select("id");

    if (customersError) throw customersError;

    // Calculate stats
    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
    const totalOrders = orders?.length || 0;
    const totalItemsSold =
    orders?.reduce((sum, order: Order) => {
        return sum + (order.order_items?.reduce((itemSum: number, item: OrderItem) => itemSum + item.quantity, 0) || 0);
    }, 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCustomers = customers?.length || 0;

    // Get top product
    const productSales: { [key: string]: number } = {};
    orders?.forEach((order) => {
      order.order_items?.forEach((item: OrderItem) => {
        const productId = item.product_id;
        productSales[productId] = (productSales[productId] || 0) + item.quantity;
      });
    });

    const topProductId = Object.keys(productSales).reduce((a, b) => 
      productSales[a] > productSales[b] ? a : b, 
      Object.keys(productSales)[0]
    );

    let topProduct = "-";
    if (topProductId) {
      const { data: product } = await supabase
        .from("products")
        .select("name")
        .eq("id", topProductId)
        .single();
      topProduct = product?.name || "-";
    }

    return res.status(200).json({
      data: {
        totalRevenue,
        totalItemsSold,
        averageOrderValue,
        totalOrders,
        totalCustomers,
        topProduct,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({
      message: "Failed to fetch statistics",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}