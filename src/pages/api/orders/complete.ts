import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { order_id, user_id } = req.body as {
      order_id: string;
      user_id: string;
    };

    if (!order_id || !user_id) {
      return res.status(400).json({ message: "order_id and user_id required" });
    }

    // 🔒 pastikan order milik user & status masih DELIVERED
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", order_id)
      .eq("user_id", user_id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        message: "Order can only be completed after delivery",
      });
    }

    // ✅ update status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("COMPLETE ORDER ERROR:", err);
    return res.status(500).json({ message: "Failed to complete order" });
  }
}
