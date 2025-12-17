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

    const { data, error } = await supabase
        .from("sales_summary")
        .select("*");

    if (error) {
        return res.status(500).json({ message: error.message });
    }

    return res.status(200).json(data);
}