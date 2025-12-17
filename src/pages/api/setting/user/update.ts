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

type ApiResponse = { message: string; user?: UserRow } | { error: string };

interface UserUpdatePayload {
  fullname?: string;
  email?: string;
  phone_number?: string | null;
  address?: string | null;
  bio?: string | null;
  image?: string;
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  const userId = session.user.id;

  try {
    if (req.method === "PUT") {
      const { fullname, email, phone, address, bio, avatar } = req.body ?? {};

      const updatePayload: Partial<UserUpdatePayload> = {};

      if (typeof fullname === "string" && fullname.trim().length >= 2) {
        updatePayload.fullname = fullname.trim();
      }

      if (typeof email === "string" && email.includes("@")) {
        updatePayload.email = email.trim().toLowerCase();
      }

      if (typeof phone === "string" && phone.trim() !== "") {
        updatePayload.phone_number = phone.trim();
      }

      if (typeof address === "string" && address.trim() !== "") {
        updatePayload.address = address.trim();
      }

      if (typeof bio === "string" && bio.trim() !== "") {
        updatePayload.bio = bio.trim();
      }

      /* Avatar handling */
      if (typeof avatar === "string" && avatar.startsWith("data:image")) {
        const matches = avatar.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const fileName = `avatar-${userId}-${Date.now()}.${ext}`;
          const uploadPath = path.join(
            process.cwd(),
            "public/uploads",
            fileName
          );

          fs.writeFileSync(uploadPath, buffer);
          updatePayload.image = `/uploads/${fileName}`;
        }
      }

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const { data, error } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Database update failed" });
      }

      return res.status(200).json({
        message: "Profile updated successfully",
        user: data,
      });
    } else if (req.method === "DELETE") {
      // Handle avatar removal
      const { data: user, error: fetchErr } = await supabase
        .from("users")
        .select("image")
        .eq("id", userId)
        .single();

      if (fetchErr)
        return res.status(500).json({ error: "Failed to get user avatar" });

      if (user?.image) {
        const filePath = path.join(process.cwd(), "/public", user.image);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      const { error: updateErr } = await supabase
        .from("users")
        .update({ image: "" })
        .eq("id", userId);

      if (updateErr)
        return res
          .status(500)
          .json({ error: "Failed to remove avatar from DB" });

      return res.status(200).json({ message: "Avatar removed" });
    } else {
      res.setHeader("Allow", ["PUT", "DELETE"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (err) {
    console.error("Server error /api/setting/user/update:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
