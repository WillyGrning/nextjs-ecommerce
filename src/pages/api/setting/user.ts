import type { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getUserById } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await unstable_getServerSession(req, res, authOptions);
    console.log("SESSION DEBUG:", session);

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await getUserById(session.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      id: user.id,
      fullname: user.fullname ?? "",
      image: user.image ?? "",
      email: user.email,
      phone: user.phone_number ?? "",
      address: user.address ?? "",
      bio: user.bio ?? "",
    });

  } catch (e) {
    console.error("🔥 /api/setting/user error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
