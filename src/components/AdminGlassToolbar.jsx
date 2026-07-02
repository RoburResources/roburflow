import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import RoburLogo from "@/components/brand/RoburLogo";
import { LogOut } from "lucide-react";

// Floating, hover-expanding glassmorphism toolbar for the admin desktop shell.
// Collapsed = slim icon-only rail. On hover it expands to reveal group labels
// and item labels. Icons use thin 1.5 stroke (2 when active) for a sleek,
// minimal Swiss look. Hover = lighter overlay; active = opaque gold fill.
export default function AdminGlassToolbar({ groups, user, onLogout, expanded, onExpandedChange }) {
  const location = useLocation();

  return (
    <div
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
      className={`glass-heavy rounded-3xl flex flex-col overflow-hidden select-none transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        expanded ? "w-64" : "w-[68px]"
      }`}
    >
      {/* Brand */}
      <div className="flex items-center h-14 px-3 shrink-0 border-b border-white/40">
        <div className="w-11 flex justify-center shrink-0">
          <RoburLogo showText={false} className="!h-7" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2.5 space-y-3 overflow-y-auto overflow-x-hidden thin-scroll">
        {groups.map((group) => (
          <div key={group.label}>
            <div
              className={`px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 transition-opacity duration-200 whitespace-nowrap ${
                expanded ? "opacity-100" : "opacity-0"
              }`}
            >
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
                return (
                  <motion.div
                    key={item.to}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Link
                      to={item.to}
                      title={item.label}
                      className={`flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                        active
                          ? "bg-robur-gold text-robur-black shadow-sm"
                          : "text-slate-600 hover:bg-white/50 hover:text-robur-black"
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2 : 1.5} />
                      <span
                        className={`whitespace-nowrap transition-opacity duration-200 ${
                          expanded ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2.5 border-t border-white/40 shrink-0">
        <div
          className={`px-3 pb-1.5 text-xs text-slate-500 truncate transition-opacity duration-200 ${
            expanded ? "opacity-100" : "opacity-0 h-0 pb-0 overflow-hidden"
          }`}
        >
          {user?.email}
        </div>
        <motion.button
          onClick={onLogout}
          title="Sign Out"
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/50 hover:text-robur-black w-full transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          <span
            className={`whitespace-nowrap transition-opacity duration-200 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
          >
            Sign Out
          </span>
        </motion.button>
      </div>
    </div>
  );
}