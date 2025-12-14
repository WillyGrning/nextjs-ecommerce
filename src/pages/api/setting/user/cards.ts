import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../../lib/supabase";

/**
 * /api/setting/user/cards
 * GET    → list cards
 * POST   → add card
 * PATCH  → set default
 * DELETE → delete card
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {

    const userId =
      req.method === "GET" || req.method === "DELETE"
        ? req.query.user_id
        : req.body.user_id;

    if (userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // =========================
    // GET – list cards
    // =========================
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("payment_cards")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.status(200).json({ cards: data });
    }

    // =========================
    // POST – add card
    // =========================
    if (req.method === "POST") {
      const {
        card_number,
        cardholder_name,
        expiry_month,
        expiry_year,
        is_default,
      } = req.body;

      if (
        !card_number ||
        !cardholder_name ||
        !expiry_month ||
        !expiry_year
      ) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      const cleanNumber = String(card_number);
      const last4 = cleanNumber.slice(-4);

      const cardBrand = detectCardBrand(cleanNumber);

      // if setting default → unset others
      if (is_default) {
        await supabase
          .from("payment_cards")
          .update({ is_default: false })
          .eq("user_id", userId);
      }

      const { error } = await supabase
        .from("payment_cards")
        .insert({
          user_id: userId,
          last4,
          card_brand: cardBrand,
          expiry_month,
          expiry_year,
          is_default: Boolean(is_default),
          cardholder_name,
        });

      if (error) throw error;

      return res.status(201).json({ success: true });
    }

    // =========================
    // PATCH – set default card
    // =========================
    if (req.method === "PATCH") {
      const { card_id } = req.body;
      if (!card_id) {
        return res.status(400).json({ error: "card_id required" });
      }

      await supabase
        .from("payment_cards")
        .update({ is_default: false })
        .eq("user_id", userId);

      const { error } = await supabase
        .from("payment_cards")
        .update({ is_default: true })
        .eq("id", card_id)
        .eq("user_id", userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    // =========================
    // DELETE – remove card
    // =========================
    if (req.method === "DELETE") {
      const { card_id } = req.query;
      if (!card_id) {
        return res.status(400).json({ error: "card_id required" });
      }

      const cardId = Array.isArray(card_id) ? card_id[0] : card_id;

        if (!cardId) {
        return res.status(400).json({ error: "card_id required" });
        }

      const { error } = await supabase
        .from("payment_cards")
        .delete()
        .eq("id", cardId)
        .eq("user_id", userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("CARDS API ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Simple card brand detection
 */
function detectCardBrand(number: string): string {
  if (/^4/.test(number)) return "Visa";
  if (/^5[1-5]/.test(number)) return "Mastercard";
  if (/^3[47]/.test(number)) return "Amex";
  return "Unknown";
}
