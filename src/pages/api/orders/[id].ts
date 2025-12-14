import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const { user_id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Order ID is required" });
    }

    if (!user_id || typeof user_id !== "string") {
      return res.status(400).json({ message: "user_id is required" });
    }

    // Fetch single order with related data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items!order_items_order_id_fkey (
          id,
          product_id,
          quantity,
          price_at_time,
          products!order_items_product_id_fkey (
            id,
            name,
            image
          )
        ),
        order_shipping!order_shipping_order_id_fkey (
          full_name,
          email,
          phone_number,
          home_address,
          city,
          state,
          zip_code,
          country,
          shipping_method,
          shipping_cost
        )
      `)
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (orderError) {
      console.error("Supabase error:", orderError);
      
      if (orderError.code === "PGRST116") {
        return res.status(404).json({ message: "Order not found" });
      }
      
      throw orderError;
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      order,
    });
  } catch (err) {
    console.error("FETCH ORDER DETAIL ERROR:", err);
    return res.status(500).json({
      message: "Failed to fetch order details",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}