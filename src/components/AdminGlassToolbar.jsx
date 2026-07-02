import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import RoburLogo from "@/components/brand/RoburLogo";
import { LogOut } from "lucide-react";

// Floating, hover-expanding glassmorphism toolbar for the admin desktop shell.
// Collapsed = slim icon-only rail. On hover it expands to reveal group labels
// and item labels; the parent shell reserves the collapsed width so expansion
// overlays/pushes the page content aside.
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
                  <Link
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={`flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-robur-gold text-robur-black"
                        : "text-slate-600 hover:bg-white/60 hover:text-robur-black"
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span
                      className={`whitespace-nowrap transition-opacity duration-200 ${
                        expanded ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
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
        <button
          onClick={onLogout}
          title="Sign Out"
          className="flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/60 hover:text-robur-black w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span
            className={`whitespace-nowrap transition-opacity duration-200 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
          >
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
}