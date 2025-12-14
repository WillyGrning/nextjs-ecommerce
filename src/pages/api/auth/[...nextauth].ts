import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/auth"; // ✅ FIXED

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 7, // 7 hari
    },

    jwt: {
        maxAge: 60 * 60 * 24 * 7, // 7 hari
    },
    providers: [
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

                    // Get user from database
                    const user = await getUserByEmail(email);
                    if (!user) {
                        console.log("❌ User not found:", email);
                        return null;
                    }

                    // Verify password
                    const isValid = await verifyPassword(password, user.password);
                    if (!isValid) {
                        console.log("❌ Invalid password for:", email);
                        return null;
                    }

                    console.log("✅ Login success:", email);

                    return { 
                        id: String(user.id), 
                        email: user.email, 
                        name: user.fullname ?? "" 
                    };
                } catch (error) {
                    console.error("💥 Auth error:", error);
                    return null;
                }
            }
        }),
    ],
    pages: {
        signIn: '/auth/login'
    },
    callbacks: {
        async jwt({ token, user }) {
            console.log("JWT CALLBACK BEFORE:", token, user);

            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
            }
            console.log("JWT CALLBACK AFTER:", token);
            return token;
        },
        async session({ session, token }) {
            session.user = {
                id: token.id as string,
                email: token.email as string,
                name: token.name as string,
            };
            return session;
        }
    }
};

export default NextAuth(authOptions);