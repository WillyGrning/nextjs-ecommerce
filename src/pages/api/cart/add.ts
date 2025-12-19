// /pages/api/cart/add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ApiResponse = { message: string } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Login dibutuhkan" });

  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: "productId is required" });

  try {
    let userCart;
    const { data, error: cartError } = await supabase
        .from("carts")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

    if (cartError && cartError.code === "PGRST116") {
    const { data: newCart, error: insertCartError } = await supabase
        .from("carts")
        .insert({ user_id: session.user.id })
        .select()
        .single();

    if (insertCartError) throw insertCartError;
        userCart = newCart;
    } else if (cartError) {
        throw cartError;
    } else {
        userCart = data;
    }


    if (!userCart) throw new Error("Cart not found or created");

    // 2️⃣ cek apakah item sudah ada di cart_items
    const { data: existingItem, error: existingError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", userCart.id)
      .eq("product_id", productId)
      .maybeSingle();

    const { data: productData, error: productError } = await supabase
    .from("products")
    .select("price")
    .eq("id", productId)
    .single();

    if (productError || !productData) throw new Error("Product not found");
    const priceAtTime = productData.price;

    if (existingItem) {
      // update quantity
      await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id);
    } else {
      // insert baru
      await supabase
        .from("cart_items")
        .insert({
          cart_id: userCart.id,
          product_id: productId,
          quantity,
          price_at_time: priceAtTime,
        })
        .select()
        .single();
    }

    if (existingError) throw existingError;

    return res.status(200).json({ message: "Item added to cart" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add to cart" });
  }
}
