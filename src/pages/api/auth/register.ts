import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 1️⃣ Validate body
    const { name, email, password } = registerSchema.parse(req.body);

    // 2️⃣ Cek email duplicate
    const { data: existingUser, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to check email" });
    }

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4️⃣ Insert user
    const { error: insertError } = await supabase.from("users").insert({
      fullname: name,
      email: email,
      password: hashedPassword,
      role: "member",
      type: "manual",
    });

    if (insertError) {
      console.error(insertError);
      return res.status(500).json({ message: "Failed to create user" });
    }

    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: err.issues,
      });
    }

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
