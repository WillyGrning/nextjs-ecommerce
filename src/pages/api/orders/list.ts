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

        const { user_id } = req.query;

        if (!user_id || typeof user_id !== "string") {
            return res.status(400).json({ message: "user_id is required" });
        }

        // Fetch orders with related data
        const { data: orders, error: ordersError } = await supabase
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
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

        if (ordersError) {
            throw ordersError;
        }

        return res.status(200).json({
            orders: orders || [],
        });
    } catch (err) {
        console.error("FETCH ORDERS ERROR:", err);
        return res.status(500).json({ message: "Failed to fetch orders" });
    }
}