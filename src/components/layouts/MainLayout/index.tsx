import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/router';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const isNavbar = ["/auth/login", "/auth/register", "/auth/forgotPassword", "/auth/reset-password"].includes(router.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      { !isNavbar && < Navbar /> }
      <main className="flex-1">{children}</main>
      { !isNavbar && <Footer /> }
    </div>
  );
};

export default MainLayout;
