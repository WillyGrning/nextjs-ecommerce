import LoginView from '@/pages/views/LoginView';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { signIn } from "next-auth/react";

export default function Login() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent, email: string, password: string) => {
        e.preventDefault();
        setLoading(true);

        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        setLoading(false);

        if (res?.error) {
            alert(res.error || 'Login failed');
        } else {
            router.push('/');
        }
    };

    return <LoginView handleSubmit={handleSubmit} loading={loading} />;
}
