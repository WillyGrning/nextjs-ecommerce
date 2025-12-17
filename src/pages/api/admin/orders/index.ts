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

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { page = "1", limit = "10", search = "", status = "" } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Number(limit) || 10, 50);
  const from = (pageNumber - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase.from("orders").select(
      `
      *,
      users!inner (
        id,
        email,
        fullname
      )
    `,
      { count: "exact" }
    );

    /** ✅ Filter status */
    if (status) {
      query = query.eq("status", status);
    }

    /** ✅ SEARCH (ORDER ID, USER NAME, USER EMAIL) */
    if (search) {
      const normalized = search.toString().trim();

      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          normalized
        );

      if (isUUID) {
        // UUID → orders.id
        query = query.eq("id", normalized);
      } else {
        // TEXT → users table (JOIN)
        query = query.or(
          `email.ilike.%${normalized}%,fullname.ilike.%${normalized}%`,
          { foreignTable: "users" }
        );
      }
    }

    /** ✅ Sorting */
    query = query.order("created_at", { ascending: false });

    /** ✅ Pagination */
    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        message: "Failed to fetch orders",
        error: error.message,
      });
    }

    return res.status(200).json({
      data: data ?? [],
      meta: {
        total: count ?? 0,
        page: pageNumber,
        limit: pageSize,
      },
    });
  } catch (err) {
    console.error("Orders API error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
