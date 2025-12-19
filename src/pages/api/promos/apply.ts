import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = session.user.id;
  const { code, subtotal } = req.body;

  if (!code || typeof subtotal !== "number") {
    return res.status(400).json({ message: "Invalid payload" });
  }

  // 1️⃣ Ambil promo
  const { data: promo, error: promoError } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (promoError || !promo) {
    return res.status(404).json({ message: "Kode promo tidak ditemukan" });
  }

  // 2️⃣ Cek expired
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return res.status(400).json({ message: "Kode promo sudah kadaluarsa" });
  }

  // 3️⃣ Cek minimum order
  if (subtotal < promo.min_order_amount) {
    return res.status(400).json({
      message: `Pesanan minimum ${formatCurrency(promo.min_order_amount)}`,
    });
  }

  // 4️⃣ Cek usage limit global
  if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
    return res.status(400).json({ message: "Pengegunaan limit tercapai" });
  }

  // 5️⃣ Cek user sudah redeem sebelumnya
  const { data: redeemed, error: redemptionError } = await supabase
    .from("promo_redemptions")
    .select("*")
    .eq("promo_id", promo.id)
    .eq("user_id", userId)
    .single();

  if (redeemed) {
    return res.status(400).json({ message: "Kamu sudah menggunakan promo ini" });
  }
  if (redemptionError && redemptionError.code !== "PGRST116") {
    // PGRST116 = no rows found, bukan error
    console.error(redemptionError);
    return res.status(500).json({ message: "Redemption check failed" });
  }

  // 6️⃣ Hitung diskon
  let discount = 0;
  if (promo.discount_type === "percentage") {
    discount = (subtotal * promo.discount_value) / 100;
  } else {
    discount = promo.discount_value;
  }
  if (promo.max_discount) {
    discount = Math.min(discount, promo.max_discount);
  }
  discount = Math.min(discount, subtotal);

  // 7️⃣ Simpan redemption (belum ada order_id, nanti di checkout update)
//   await supabase.from("promo_redemptions").insert({
//     promo_id: promo.id,
//     user_id: userId,
//   });

//   // 8️⃣ Update used_count di promo_codes
//   await supabase
//     .from("promo_codes")
//     .update({ used_count: promo.used_count + 1 })
//     .eq("id", promo.id);

  return res.status(200).json({
    promoId: promo.id,
    discount,
    finalSubtotal: subtotal - discount,
  });
}
