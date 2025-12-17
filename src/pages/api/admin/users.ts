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
    return res.status(403).json({ message: "Forbidden" });
  }

  const {
    page = "1",
    limit = "10",
    search = "",
    role = "",
  } = req.query;

  const pageNumber = Math.max(parseInt(page as string), 1);
  const pageSize = Math.min(parseInt(limit as string), 50);
  const from = (pageNumber - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("users")
    .select("id, email, fullname, role", { count: "exact" });

  if (search) {
    query = query.ilike("email", `%${search}%`);
  }

  if (role) {
    query = query.eq("role", role);
  }

  const { data, count, error } = await query
    .range(from, to);

  if (error) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }

  return res.status(200).json({
    data,
    meta: {
      total: count,
      page: pageNumber,
      limit: pageSize,
    },
  });
}
