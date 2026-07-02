import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import RoburLogo from "@/components/brand/RoburLogo";
import { LayoutDashboard, ListChecks, Users, Truck, FileText, LogOut, Receipt } from "lucide-react";

const adminNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: ListChecks },
  { to: "/review", label: "Review", icon: FileText },
  { to: "/settlements", label: "Settlements", icon: Receipt },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/drivers", label: "Drivers", icon: Truck },
];

export default function Layout() {
  const { user, loading, isAdmin } = useCurrentUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-robur-gold/30 border-t-robur-gold rounded-full animate-spin" />
      </div>
    );
  }

  const logout = () => base44.auth.logout();

  // ---------- Driver shell: mobile-first, bottom nav ----------
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="sticky top-0 z-20 bg-robur-black text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <RoburLogo dark />
          <button onClick={logout} className="text-white/70 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 pb-20">
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // ---------- Admin shell: sidebar on desktop, top bar on mobile ----------
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex w-64 flex-col bg-robur-black text-white sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <RoburLogo dark />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map((item) => {
            const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-robur-gold text-robur-black" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="px-4 py-2 text-xs text-white/50 truncate">{user?.email}</div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white w-full"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 bg-robur-black text-white px-4 py-3 flex items-center justify-between">
          <RoburLogo dark />
          <button onClick={logout}><LogOut className="w-5 h-5 text-white/70" /></button>
        </header>
        <main className="flex-1 pb-24 md:pb-0">
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </main>
        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 flex justify-around px-1 py-2 no-scrollbar overflow-x-auto">
          {adminNav.map((item) => {
            const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to} className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[56px]">
                <item.icon className={`w-5 h-5 ${active ? "text-robur-gold" : "text-slate-400"}`} />
                <span className={`text-[10px] ${active ? "text-robur-black font-semibold" : "text-slate-400"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}