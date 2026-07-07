import { Sidebar } from '@/components/layout/Sidebar';
import { Header }  from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app">
      <Sidebar />
      <div className="md:pl-60 flex flex-col min-h-screen transition-all duration-300">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
