// pages/api/log-user-visit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { ip, userAgent, url, timestamp } = req.body;

    const { error } = await supabase
      .from("user_visits")
      .insert([{ ip, user_agent: userAgent, url, timestamp }]);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ message: "Visit logged" });
  }
  res.status(405).json({ message: "Method not allowed" });
}
