import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../../lib/supabase";

type ShippingPayload = {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

type CreateOrderBody = {
  items: {
    product_id: string;
    quantity: number;
    price: number;
  }[];
  shipping: ShippingPayload;
  payment: {
    method: string;
    provider?: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { user_id, items, shipping, payment } = req.body;

    if (!user_id) return res.status(401).json({ message: "User ID required" });

    const body = req.body as CreateOrderBody;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ message: "Items required" });
    }

    const subtotal = body.items.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    const shippingCost = subtotal > 500 ? 0 : 15;
    const tax = subtotal * 0.1;
    const total = subtotal + shippingCost + tax;

    // 1️⃣ Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user_id,
        status: "PAID",
        subtotal,
        shipping_cost: shippingCost,
        tax,
        total,
        payment: JSON.stringify(body.payment),
      })
      .select()
      .single();

    if (orderError || !order) {
      throw orderError;
    }

    // 2️⃣ Create order items
    const itemsPayload = body.items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      price_at_time: it.price,
      quantity: it.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload);

    if (itemsError) {
      throw itemsError;
    }

    const { error: shippingError } = await supabase
        .from("order_shipping")
        .insert({
            order_id: order.id,
            full_name: body.shipping.fullName,
            email: body.shipping.email,
            city: body.shipping.city,
            state: body.shipping.state,
            zip_code: body.shipping.zipCode,
            country: body.shipping.country,
            shipping_method: "STANDARD",
            shipping_cost: shippingCost,
            phone_number: body.shipping.phone,
            home_address: body.shipping.address,
        })

    if (shippingError) {
        throw shippingError;
    }

    return res.status(201).json({
      order_id: order.id,
      status: order.status,
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    return res.status(500).json({ message: "Failed to create order" });
  }
}
