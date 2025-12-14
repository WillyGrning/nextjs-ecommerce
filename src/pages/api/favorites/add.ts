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
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "productId is required" });

    try {
        const { data: existingItem, error: existingItemError } = await supabase
            .from("favorites")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("product_id", productId)
            .maybeSingle();

        if (existingItem) return res.status(400).json({ error: "Item already exists in favorites" });
        
        if (existingItemError) throw existingItemError;

        const { data, error } = await supabase
            .from("favorites")
            .insert({ user_id: session.user.id, product_id: productId })
            .select()
            .single();

        if (!data) return res.status(400).json({ error: "Failed to add item to favorites" });

        if (error) throw error;

        return res.status(200).json({ message: "Item added to favorites" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Something went wrong" });
    }
}