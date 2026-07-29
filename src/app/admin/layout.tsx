import Sidebar from "./sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
