// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../lib/supabase";

type ShippingPayload = {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  zipCode: string;
};

type ItemPayload = {
  product_id: string;
  quantity: number;
  price: number;
};

type PaymentPayload = {
  method: string;
  provider?: string;
  transactionId?: string;
  last4?: string;
  cardNumber?: string;
  cardName?: string;
  expiryMonth?: string;
  expiryYear?: string;
};

type CreateOrderBody = {
  items: ItemPayload[];
  shipping: ShippingPayload;
  payment: PaymentPayload;
  promo_code_id?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { user_id, items, shipping, payment, promo_code_id } = req.body as {
      user_id: string;
      items: ItemPayload[];
      shipping: ShippingPayload;
      payment: PaymentPayload;
      promo_code_id?: string;
    };

    if (!user_id) return res.status(401).json({ message: "User ID required" });
    if (!items || items.length === 0)
      return res.status(400).json({ message: "Items required" });

    // ✅ subtotal / shipping / tax / total
    const { subtotal, shippingCost, tax, total } = req.body;

    // ✅ start transaction
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id,
        status: "PAID",
        subtotal,
        shipping_cost: shippingCost,
        tax,
        total,
      })
      .select()
      .single();

    if (orderError || !order) throw orderError;

    // ✅ order items
    const itemsPayload = items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      price_at_time: it.price,
      quantity: it.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload);
    if (itemsError) throw itemsError;

    // ✅ order shipping
    const { error: shippingError } = await supabase
      .from("order_shipping")
      .insert({
        order_id: order.id,
        full_name: shipping.fullName,
        email: shipping.email,
        phone_number: shipping.phone,
        home_address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        zip_code: shipping.zipCode,
        country: shipping.country || "INDONESIA",
        shipping_method: "STANDARD",
        shipping_cost: shippingCost,
      });
    if (shippingError) throw shippingError;

    let paymentCardId: string | null = null;

    if (payment.cardNumber && payment.cardName) {
      const { data: existingCard, error: fetchError } = await supabase
        .from("payment_cards")
        .select("id")
        .eq("user_id", user_id)
        .eq("payment_number", payment.cardNumber)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingCard) {
        // ✅ KARTU SUDAH ADA
        paymentCardId = existingCard.id;
      } else {
        // ✅ INSERT KARTU BARU
        const { data: newCard, error: cardError } = await supabase
          .from("payment_cards")
          .insert({
            user_id,
            last4: payment.cardNumber.slice(-4),
            card_brand: payment.method ?? "CARD",
            cardholder_name: payment.cardName,
            expiry_month: Number(payment.expiryMonth),
            expiry_year: Number(payment.expiryYear),
            is_default: true,
            payment_number: payment.cardNumber,
          })
          .select("id")
          .single();

        if (cardError || !newCard) throw cardError;

        paymentCardId = newCard.id;
      }
    }

    // ✅ order payment (SELALU PUNYA paymentCardId JIKA CARD)
    const { error: paymentError } = await supabase
      .from("order_payments")
      .insert({
        order_id: order.id,
        payment_method: payment.method,
        payment_provider: payment.provider,
        transaction_id: payment.transactionId,
        payment_card_id: paymentCardId,
        status: "PAID",
        paid_at: new Date().toISOString(),
      });

    if (paymentError) throw paymentError;

    // ✅ promo redemption (maks 1x per user)
    if (promo_code_id) {
      const { data: existingPromo } = await supabase
        .from("promo_redemptions")
        .select("*")
        .eq("promo_id", promo_code_id)
        .eq("user_id", user_id)
        .limit(1)
        .single();

      if (!existingPromo) {
        const { error: promoError } = await supabase
          .from("promo_redemptions")
          .insert({
            promo_id: promo_code_id,
            user_id,
            order_id: order.id,
          });
        if (promoError) throw promoError;
      } else {
        return res
          .status(400)
          .json({ message: "Promo code already redeemed by this user" });
      }
    }

    return res.status(201).json({ order_id: order.id, total });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    return res.status(500).json({ message: "Failed to create order" });
  }
}
