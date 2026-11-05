import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import logoImg from "../assets/lordz-logo.png";
import {
  LayoutDashboard,
  Trophy,
  Users,
  BarChart3,
  ShoppingBag,
  PackageCheck,
  Newspaper,
  Video,
  Handshake,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Radio,
  Clock,
  ChevronRight,
  Vote
} from "lucide-react";

interface NavGroup {
  group: string;
  items: Array<{
    name: string;
    path: string;
    icon: React.ElementType;
    badge?: string;
  }>;
}

const navGroups: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { name: "Analytics & Reports", path: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    group: "ESPORTS OPERATIONS",
    items: [
      { name: "Tournaments", path: "/admin/tournaments", icon: Trophy },
      { name: "Squad Registrations", path: "/admin/registrations", icon: Users, badge: "Live" },
    ],
  },
  {
    group: "ROSTERS & TALENT",
    items: [
      { name: "Pro Athletes", path: "/admin/players", icon: Users },
      { name: "Player Voting", path: "/admin/voting", icon: Vote, badge: "New" },
    ],
  },
  {
    group: "E-COMMERCE & STORE",
    items: [
      { name: "Merchandise Products", path: "/admin/merchandise", icon: ShoppingBag },
      { name: "Orders & Fulfillment", path: "/admin/orders", icon: PackageCheck },
    ],
  },
  {
    group: "CONTENT & BROADCAST",
    items: [
      { name: "News & Editorial", path: "/admin/news", icon: Newspaper },
      { name: "Video Highlights", path: "/admin/media", icon: Video },
      { name: "Sponsors & Partners", path: "/admin/partners", icon: Handshake },
    ],
  },
  {
    group: "SYSTEM & ACCESS",
    items: [
      { name: "Website & Live Ticker", path: "/admin/settings", icon: Settings },
      { name: "Admin Team & Roles", path: "/admin/users", icon: ShieldCheck },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // Find active item name for breadcrumb
  let activeItemName = "Dashboard";
  for (const group of navGroups) {
    const found = group.items.find(
      (i) =>
        i.path === location.pathname ||
        (i.path !== "/admin" && location.pathname.startsWith(`${i.path}/`))
    );
    if (found) {
      activeItemName = found.name;
      break;
    }
  }

  return (
    <div className="min-h-screen bg-[#060608] text-gray-200 flex flex-col font-body selection:bg-[#FFBE32] selection:text-black">
      {/* Top Bar Header */}
      <header className="h-16 bg-[#0B0B0F]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/admin" className="flex items-center gap-2.5 group">
            <img
              src={logoImg}
              alt="MG Esports"
              className="h-9 w-9 object-contain group-hover:scale-105 transition-transform drop-shadow-[0_0_8px_rgba(255,190,50,0.3)]"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg tracking-wider text-white uppercase leading-none">
                  MG <span className="text-[#FFBE32]">ADMIN</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#FFBE32]/10 border border-[#FFBE32]/30 text-[9px] font-heading font-bold uppercase tracking-wider text-[#FFBE32]">
                  PORTAL
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">
                Centralized Operations
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Live Sync Pill (Desktop) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
          <span>LIVE DATABASE SYNC ACTIVE</span>
        </div>

        {/* Right: Public Site Link, Profile, Logout */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-[#FFBE32]/50 text-xs font-heading font-bold text-gray-300 hover:text-[#FFBE32] transition-colors"
          >
            <span>View Public Site</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#FFBE32] to-amber-600 flex items-center justify-center text-black font-display font-bold text-sm shadow-[0_0_10px_rgba(255,190,50,0.3)]">
              {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-heading font-bold text-white leading-tight">
                {user?.fullName || user?.ign || "Administrator"}
              </span>
              <span className="text-[10px] font-mono text-[#FFBE32] tracking-wider uppercase">
                ADMIN
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Sign out of Admin Portal"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Body Grid: Sidebar + Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop sticky, Mobile drawer) */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#09090C] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 transform lg:translate-x-0 pt-16 lg:pt-0 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Nav Items Scrollable */}
          <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 custom-scrollbar">
            {navGroups.map((group) => (
              <div key={group.group}>
                <h3 className="px-3 text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-gray-300 mb-2">
                  {group.group}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== "/admin" && location.pathname.startsWith(`${item.path}/`));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-[#FFBE32] text-black shadow-[0_0_15px_rgba(255,190,50,0.3)] font-extrabold"
                            : "text-gray-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${isActive ? "text-black" : "text-[#FFBE32]"}`} />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              isActive
                                ? "bg-black text-[#FFBE32]"
                                : "bg-[#FFBE32]/20 text-[#FFBE32] border border-[#FFBE32]/30"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer System Info */}
          <div className="p-3 border-t border-white/10 bg-[#070709] text-[11px] font-mono text-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#FFBE32]" />
              <span>v2.4 Production</span>
            </div>
            <span className="text-emerald-400 font-bold">API Online</span>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#050507] p-4 sm:p-6 lg:p-8">
          {/* Breadcrumb Header */}
          <div className="max-w-7xl mx-auto mb-6 flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-gray-300">
            <Link to="/admin" className="hover:text-[#FFBE32] transition-colors">
              Admin Portal
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-[#FFBE32] font-extrabold">{activeItemName}</span>
          </div>

          {/* Outlet for Nested Pages */}
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
