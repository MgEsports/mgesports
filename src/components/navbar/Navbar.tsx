import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logoImg from "../../assets/lordz-logo.png";
import { useScrollPosition } from "../../hooks/useScrollPosition";
import { MobileMenu } from "./MobileMenu";
import { useModals } from "../../context/useModals";
import { ThemeToggle } from "../common/ThemeToggle";

// Straight Desktop Nav Items (PLAYERS & TEAMS consolidated into ABOUT)
const straightNavItems = [
  { label: "HOME", path: "/" },
  // { label: "TOURNAMENTS", path: "/tournaments" },
  // { label: "VOTING", path: "/voting" },
  { label: "PRODUCTS", path: "/products" },
  { label: "TRACK ORDER", path: "/track" },
  { label: "PARTNERS", path: "/partners" },
  // { label: "PARTNER WITH US", path: "/partner-with-us" },
  { label: "MEDIA", path: "/media" },
  { label: "NEWS", path: "/news" },
  { label: "ABOUT", path: "/about" },
  { label: "COMMUNITY", path: "/community" },
];

export const Navbar = () => {
  const { isScrolled } = useScrollPosition(30);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { pathname } = useLocation();
  const { openJoinTournament, openLogin } = useModals();

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 w-full max-w-full z-[7000] h-16 sm:h-[68px] flex items-center transition-all duration-300 ${
          isScrolled
            ? "bg-[#070708] border-b border-[#fc8100]/25 shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
            : "bg-[#070708]/95 backdrop-blur-md border-b border-white/10 shadow-[0_2px_15px_rgba(0,0,0,0.6)]"
        }`}
      >
        <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 group cursor-pointer focus:outline-none shrink-0"
          >
            <div className="relative shrink-0">
              <img
                src={logoImg}
                alt="MG ESPORTS Official Crest Logo"
                width={40}
                height={40}
                className="h-8 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_12px_rgba(252, 129, 0,0.35)]"
              />
            </div>
            <div className="flex flex-col shrink-0">
              <span className="font-display text-base sm:text-xl xl:text-2xl leading-none uppercase tracking-widest text-white whitespace-nowrap">
                MG <span className="text-[#fc8100]">ESPORTS</span>
              </span>
              <span className="font-heading text-[7.5px] sm:text-[9px] tracking-[0.25em] text-[#9CA3AF] uppercase whitespace-nowrap">
                Golden Ticket Winners
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links — Straight Row Layout for xl+ screens */}
          <nav className="hidden xl:flex items-center gap-3 2xl:gap-5 text-[11px] 2xl:text-xs font-heading font-bold uppercase tracking-wider text-gray-300">
            {straightNavItems.map((item) => {
              const isActive =
                item.path === "/about"
                  ? pathname === "/about" || pathname === "/players" || pathname === "/teams"
                  : pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`relative py-1 transition-colors hover:text-[#fc8100] whitespace-nowrap ${
                    isActive ? "text-[#fc8100] font-extrabold" : "text-gray-300"
                  } after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#fc8100] ${
                    isActive ? "after:scale-x-100" : "after:scale-x-0"
                  } hover:after:scale-x-100 after:transition-transform after:origin-center`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            {/* Mobile / Tablet Hamburger Toggle - Precision 3-bar layout */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="xl:hidden shrink-0 flex items-center justify-center p-2 rounded-xl text-white hover:text-[#fc8100] hover:bg-white/5 active:bg-white/10 transition-colors focus:outline-none cursor-pointer"
            >
              <div className="w-5.5 sm:w-6 h-4 sm:h-[18px] flex flex-col justify-between items-center shrink-0" aria-hidden="true">
                <span className="w-full h-[2px] bg-current rounded-full transition-transform" />
                <span className="w-full h-[2px] bg-current rounded-full transition-transform" />
                <span className="w-full h-[2px] bg-current rounded-full transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenJoin={() => {
          setMobileMenuOpen(false);
          openJoinTournament();
        }}
        onOpenLogin={() => {
          setMobileMenuOpen(false);
          openLogin();
        }}
        currentPath={pathname}
      />
    </>
  );
};
