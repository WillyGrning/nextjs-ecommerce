// /pages/api/setting/user/update.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import path from "path";
import fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type UserRow = Database["public"]["Tables"]["users"]["Row"];

type ApiResponse =
  | { message: string; user?: UserRow }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const userId = session.user.id;

  try {
    if (req.method === "PUT") {
      // Handle profile update (incl avatar)
      const { fullName, phone, address, bio, avatar } = req.body ?? {};

      if (typeof fullName !== "string" || fullName.trim().length < 2) {
        return res.status(400).json({ error: "Invalid fullName (min 2 chars)" });
      }

      const normalizedPhone = typeof phone === "string" && phone.trim() !== "" ? phone.trim() : null;
      const normalizedAddress = typeof address === "string" && address.trim() !== "" ? address.trim() : null;
      const normalizedBio = typeof bio === "string" && bio.trim() !== "" ? bio.trim() : null;

      let avatarUrl: string | undefined;

      // Kalau avatar baru dikirim dalam base64, simpan ke public/uploads
      if (typeof avatar === "string" && avatar.startsWith("data:image")) {
        const matches = avatar.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1];
          const data = matches[2];
          const buffer = Buffer.from(data, "base64");
          const fileName = `avatar-${Date.now()}.${ext}`;
          const uploadPath = path.join(process.cwd(), "/public/uploads", fileName);

          fs.writeFileSync(uploadPath, buffer);
          avatarUrl = `/uploads/${fileName}`;
        }
      }

      const { data, error } = await supabase
        .from("users")
        .update({
          fullname: fullName.trim(),
          phone_number: normalizedPhone,
          address: normalizedAddress,
          bio: normalizedBio,
          ...(avatarUrl ? { image: avatarUrl } : {}),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) return res.status(500).json({ error: "Database update failed" });

      return res.status(200).json({ message: "Profile updated", user: data });
    } 
    else if (req.method === "DELETE") {
      // Handle avatar removal
      const { data: user, error: fetchErr } = await supabase
        .from("users")
        .select("image")
        .eq("id", userId)
        .single();

      if (fetchErr) return res.status(500).json({ error: "Failed to get user avatar" });

      if (user?.image) {
        const filePath = path.join(process.cwd(), "/public", user.image);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      const { error: updateErr } = await supabase
        .from("users")
        .update({ image: "" })
        .eq("id", userId);

      if (updateErr) return res.status(500).json({ error: "Failed to remove avatar from DB" });

      return res.status(200).json({ message: "Avatar removed" });
    } 
    else {
      res.setHeader("Allow", ["PUT", "DELETE"]);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (err) {
    console.error("Server error /api/setting/user/update:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
