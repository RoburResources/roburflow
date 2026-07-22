import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import RoburLogo from "@/components/brand/RoburLogo";
import AdminGlassToolbar from "@/components/AdminGlassToolbar";
import {
  LayoutDashboard, ListChecks, Users, Truck, FileText, LogOut, Receipt,
  Archive, ScrollText, LayoutTemplate, Settings2, BarChart3, Boxes,
  ShieldAlert, KeyRound, Wrench, Fuel, UserCheck, CalendarDays,
  ShieldCheck, Wallet, BadgeCheck, AlertTriangle, MessageSquare, BookOpen, ScanLine,
} from "lucide-react";

const adminNavGroups = [
  {
    label: "Operations",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/scan-documents", label: "Scan & Extract", icon: ScanLine },
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
  const [navExpanded, setNavExpanded] = useState(false);

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

  // ---------- Admin shell: floating glass toolbar on desktop, top bar on mobile ----------
  return (
    <div className="min-h-screen flex">
      {/* Floating glass toolbar — sits inset, in line with the main cards, expands on hover */}
      <div className="hidden md:block fixed left-2 top-6 bottom-6 z-30 pointer-events-none">
        <div className="h-full max-h-[calc(100vh-3rem)] pointer-events-auto">
          <AdminGlassToolbar
            groups={adminNavGroups}
            user={user}
            onLogout={logout}
            expanded={navExpanded}
            onExpandedChange={setNavExpanded}
          />
        </div>
      </div>

      <div
        className={`flex-1 flex flex-col min-w-0 transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          navExpanded ? "md:pl-[272px]" : "md:pl-[80px]"
        }`}
      >
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
              <motion.div key={item.to} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Link to={item.to} className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[56px]">
                  <item.icon className={`w-5 h-5 transition-colors ${active ? "text-robur-gold" : "text-slate-400"}`} strokeWidth={active ? 2 : 1.5} />
                  <span className={`text-[10px] transition-colors ${active ? "text-robur-black font-semibold" : "text-slate-400"}`}>
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}