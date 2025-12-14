import RegisterView from '@/pages/views/RegisterView';
import { useRouter } from 'next/router';
import { useState } from 'react';

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

            router.push("./login");
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(err.message);
            } else {
                alert("Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };


    return <RegisterView handleSubmit={handleSubmit} loading={loading} />;
}