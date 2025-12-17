import LoginView from "@/pages/views/LoginView";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    if (session.user.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/");
    }
  }, [status, session, router]);

  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string
  ) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.error) {
      alert(res.error || "Login failed");
    } else {
      router.push("/");
    }
  };

  return <LoginView handleSubmit={handleSubmit} loading={loading} />;
}
