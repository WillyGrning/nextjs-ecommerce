import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin only" });
  }

  const { id } = req.query;
  console.log("Order ID:", id);

  if (typeof id !== "string") {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const { status } = req.body;

  if (req.method == "PUT") {
    try {
      const { data: dataStatus, error: errorStatus } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (errorStatus) {
        return res.status(500).json({
          success: false,
          message: "Failed to update order status",
        });
      }

      return res.status(200).json({
        success: true,
        data: dataStatus,
        message: "Order status updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }
  return res.status(405).json({ message: "Method not allowed" });
}
