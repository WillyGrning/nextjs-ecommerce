// pages/api/reviews/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { user_id, order_id, product_id, rating, review } = req.body;

    // =========================
    // 1️⃣ VALIDATION
    // =========================
    if (!user_id || !order_id || !product_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid rating value" });
    }

    if (review && review.length > 1000) {
      return res.status(400).json({ message: "Review too long" });
    }

    // =========================
    // 2️⃣ CHECK ORDER OWNERSHIP
    // =========================
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user_id !== user_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.status !== "completed") {
      return res.status(400).json({ message: "Order not completed yet" });
    }

    // =========================
    // 3️⃣ CHECK PRODUCT IN ORDER
    // =========================
    const { data: orderItem } = await supabase
      .from("order_items")
      .select("id")
      .eq("order_id", order_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (!orderItem) {
      return res.status(400).json({ message: "Product not found in order" });
    }

    // =========================
    // 4️⃣ PREVENT DUPLICATE REVIEW
    // =========================
    const { data: existingReview } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("user_id", user_id)
      .eq("order_id", order_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (existingReview) {
      return res.status(409).json({ message: "Review already submitted" });
    }

    // =========================
    // 5️⃣ INSERT REVIEW
    // =========================
    const { error: insertError } = await supabase.from("product_reviews").insert({
      user_id,
      order_id,
      product_id,
      rating,
      review,
    });

    if (insertError) throw insertError;

    return res.status(201).json({ message: "Review submitted successfully" });
  } catch (err) {
    console.error("REVIEW API ERROR:", err);
    return res.status(500).json({ message: "Failed to submit review" });
  }
}
