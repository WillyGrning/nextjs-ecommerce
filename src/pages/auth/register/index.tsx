import RegisterView from "@/pages/views/RegisterView";
import { useRouter } from "next/router";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast"; // import toaster

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent,
    name: string,
    email: string,
    password: string
  ) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Register failed");
      }

      // ✅ tampilkan toaster sukses
      toast.success("Registration successful! Redirecting to login...", {
        duration: 2000,
      });

      // delay 2 detik sebelum redirect
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message); // ganti alert jadi toaster
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster /> {/* wajib ditaruh di atas/root component */}
      <RegisterView handleSubmit={handleSubmit} loading={loading} />
    </>
  );
}
