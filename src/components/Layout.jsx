import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import RoburLogo from "@/components/brand/RoburLogo";
import {
  LayoutDashboard, ListChecks, Users, Truck, FileText, LogOut, Receipt,
  Archive, ScrollText, LayoutTemplate, Settings2, BarChart3, Boxes,
  ShieldAlert, KeyRound, Wrench, Fuel, UserCheck, CalendarDays,
  ShieldCheck, Wallet, BadgeCheck, AlertTriangle, MessageSquare, BookOpen,
} from "lucide-react";

const adminNavGroups = [
  {
    label: "Operations",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/jobs", label: "Jobs", icon: ListChecks },
      { to: "/dispatch-calendar", label: "Dispatch Calendar", icon: CalendarDays },
      { to: "/review", label: "Review", icon: FileText },
      { to: "/document-verification", label: "Verify Docs", icon: ShieldCheck },
      { to: "/settlements", label: "Settlements", icon: Receipt },
      { to: "/quick-templates", label: "Quick Templates", icon: LayoutTemplate },
    ],
  },
  {
    label: "Records",
    items: [
      { to: "/document-archive", label: "Document Archive", icon: Archive },
      { to: "/performance-analytics", label: "Analytics", icon: BarChart3 },
      { to: "/activity-logs", label: "Activity Logs", icon: ScrollText },
      { to: "/incident-reports", label: "Incident Reports", icon: ShieldAlert },
      { to: "/client-feedback", label: "Client Feedback", icon: MessageSquare },
    ],
  },
  {
    label: "Fleet & People",
    items: [
      { to: "/clients", label: "Clients", icon: Users },
      { to: "/drivers", label: "Drivers", icon: Truck },
      { to: "/driver-onboarding", label: "Onboarding", icon: UserCheck },
      { to: "/inventory-assets", label: "Inventory", icon: Boxes },
      { to: "/maintenance-schedule", label: "Maintenance", icon: Wrench },
      { to: "/maintenance-alerts", label: "Maintenance Alerts", icon: AlertTriangle },
      { to: "/fuel-logs", label: "Fuel Logs", icon: Fuel },
    ],
  },
  {
    label: "Compliance & Docs",
    items: [
      { to: "/driver-certifications", label: "Certifications", icon: BadgeCheck },
      { to: "/compliance-dashboard", label: "Compliance", icon: ShieldCheck },
      { to: "/safety-briefings", label: "Safety Briefings", icon: ShieldCheck },
      { to: "/expense-tracker", label: "Expenses", icon: Wallet },
      { to: "/resource-library", label: "Resource Library", icon: BookOpen },
    ],
  },
  {
    label: "Admin",
    items: [
      { to: "/client-access", label: "Client Access", icon: KeyRound },
      { to: "/system-settings", label: "System Settings", icon: Settings2 },
    ],
  },
];

const adminNav = adminNavGroups.flatMap((g) => g.items);
const mobileNav = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: ListChecks },
  { to: "/review", label: "Review", icon: FileText },
  { to: "/safety-briefings", label: "Safety", icon: ShieldCheck },
  { to: "/system-settings", label: "Settings", icon: Settings2 },
];

export default function Layout() {
  const { user, loading, isAdmin } = useCurrentUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-robur-gold/30 border-t-robur-gold rounded-full animate-spin" />
      </div>
    );
  }

  const logout = () => base44.auth.logout();

  // ---------- Driver shell: mobile-first, bottom nav ----------
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 bg-robur-black text-white px-4 py-3 flex items-center justify-between shadow-lg select-none" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <RoburLogo showText={false} />
          <button onClick={logout} aria-label="Sign out" className="text-white/70 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 pb-20 overscroll-none">
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // ---------- Admin shell: sidebar on desktop, top bar on mobile ----------
  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 flex-col bg-robur-black text-white sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <RoburLogo showText={false} />
        </div>
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto thin-scroll fade-edges select-none">
          {adminNavGroups.map((group) => (
            <div key={group.label}>
              <div className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active ? "bg-robur-gold text-robur-black" : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
        <header className="md:hidden sticky top-0 z-20 bg-robur-black text-white px-4 py-3 flex items-center justify-between select-none" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <RoburLogo showText={false} />
          <button onClick={logout} aria-label="Sign out"><LogOut className="w-5 h-5 text-white/70" /></button>
        </header>
        <main className="flex-1 pb-24 md:pb-0 overscroll-none">
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </main>
        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 glass-heavy rounded-none flex justify-around px-1 py-2 select-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {mobileNav.map((item) => {
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