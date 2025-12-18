import { getToken } from "next-auth/jwt";
import type { GetServerSidePropsContext } from "next";

export async function adminGuard(context: GetServerSidePropsContext) {
  const token = await getToken({
    req: context.req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  if (token.role !== "admin") {
    return {
      props: {
        unauthorized: true,
        user: {
          email: token.email ?? null,
          role: token.role ?? "guest",
        },
      },
    };
  }

  return {
    props: {
      unauthorized: false,
      user: {
        email: token.email,
        role: token.role,
      },
      session: token, // ← optional kalau mau
    },
  };
}
