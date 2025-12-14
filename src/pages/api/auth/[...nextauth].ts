import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

import { getUserByEmail, verifyPassword } from "@/lib/auth";

/**
 * Supabase admin client
 * (SERVICE ROLE - server only)
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },

  jwt: {
    maxAge: 60 * 60 * 24 * 7,
  },

  providers: [
    /**
     * 🔹 MANUAL LOGIN (TIDAK DIUBAH)
     */
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) return null;

          const { email, password } = credentials;

          const user = await getUserByEmail(email);
          if (!user) {
            console.log("❌ User not found:", email);
            return null;
          }

          // Optional safety: pastikan user manual
          if (user.type !== "manual") {
            console.log("❌ This account uses Google login:", email);
            return null;
          }

          const isValid = await verifyPassword(password, user.password);
          if (!isValid) {
            console.log("❌ Invalid password for:", email);
            return null;
          }

          console.log("✅ Login success:", email);

          return {
            id: String(user.id),
            email: user.email,
            name: user.fullname ?? "",
          };
        } catch (error) {
          console.error("💥 Auth error:", error);
          return null;
        }
      },
    }),

    /**
     * 🔹 GOOGLE OAUTH (DITAMBAHKAN)
     */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  pages: {
    signIn: "/auth/login",
  },

  callbacks: {
    /**
     * 🔹 GOOGLE AUTO-REGISTER
     * Jalan SETELAH Google login
     */
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (!existingUser) {
            const { data: newUser } = await supabase
              .from("users")
              .insert({
                email: email,
                fullname: user.name ?? "",
                role: "member",
                type: "google",
                password: null,
              })
              .select()
              .single();

            user.id = newUser.id;
        } else {
            user.id = existingUser.id;
        }
      }

      return true;
    },

    /**
     * 🔹 JWT CALLBACK (TIDAK DIRUSAK)
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    /**
     * 🔹 SESSION CALLBACK (TIDAK DIRUSAK)
     */
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
      };
      return session;
    },
  },
};

export default NextAuth(authOptions);
