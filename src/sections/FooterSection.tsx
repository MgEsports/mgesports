import { Link } from "react-router-dom";
import logoImg from "../assets/lordz-logo.png";
import { ArrowUp, Mail, MapPin } from "lucide-react";

export const FooterSection = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#050505] border-t border-[#FFBE32]/20 pt-20 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle Bottom Gold Radiance */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#FFBE32]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          
          {/* Brand Column (lg:col-span-6) */}
          <div className="lg:col-span-6">
            <Link to="/" className="inline-flex items-center gap-2.5 sm:gap-3">
              <img
                src={logoImg}
                alt="MG ESPORTS Official Crest Logo"
                width={48}
                height={48}
                className="h-9 w-9 sm:h-12 sm:w-12 object-contain drop-shadow-[0_0_15px_rgba(255,190,50,0.35)]"
              />
              <div className="flex flex-col">
                <span className="font-display text-2xl sm:text-3xl uppercase tracking-widest text-white">
                  MG <span className="text-[#FFBE32]">ESPORTS</span>
                </span>
                <span className="font-heading text-[8.5px] sm:text-[10px] tracking-[0.25em] text-[#9CA3AF] uppercase">
                  Mobile Esports Organization
                </span>
              </div>
            </Link>

            <p className="mt-4 text-xs sm:text-sm text-[#9CA3AF] font-body leading-relaxed max-w-md">
              A professional mobile esports organization competing for the Clash of Clans world title. Together we conquer.
            </p>

            <div className="mt-5 sm:mt-6 flex items-center gap-2 text-xs text-gray-400 font-body">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FFBE32]" />
              <span>Clash of Clans World Championship Stage</span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 font-body">
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FFBE32]" />
              <a href="mailto:contact@mgesports.gg" className="hover:text-[#FFBE32] transition-colors">
                contact@mgesports.gg
              </a>
            </div>

            {/* Official Channels Quick Access */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <span className="block text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-[#FFBE32] mb-3">
                OFFICIAL CHANNELS
              </span>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-full">
                <a
                  href="https://discord.gg/rH3PkZdNz"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Official Discord Server"
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-[#5865F2]/20 border border-white/10 hover:border-[#5865F2]/50 text-gray-300 hover:text-[#5865F2] text-[11px] font-heading font-semibold inline-flex items-center gap-1.5 transition-all shrink-0"
                >
                  <span>Discord</span>
                </a>
                <a
                  href="https://www.instagram.com/mg13e.sports"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram @mg13e.sports"
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-[#E1306C]/20 border border-white/10 hover:border-[#E1306C]/50 text-gray-300 hover:text-[#E1306C] text-[11px] font-heading font-semibold inline-flex items-center gap-1.5 transition-all shrink-0"
                >
                  <span>Instagram</span>
                </a>
                <a
                  href="https://youtube.com/@mgesports-mg"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="YouTube @mgesports-mg"
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-[#FF0000]/20 border border-white/10 hover:border-[#FF0000]/50 text-gray-300 hover:text-[#FF0000] text-[11px] font-heading font-semibold inline-flex items-center gap-1.5 transition-all shrink-0"
                >
                  <span>YouTube</span>
                </a>
                <a
                  href="https://x.com/mg13esports"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="X (Twitter) @mg13esports"
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/20 border border-white/10 hover:border-white/50 text-gray-300 hover:text-white text-[11px] font-heading font-semibold inline-flex items-center gap-1.5 transition-all shrink-0"
                >
                  <span>X (Twitter)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links: Organization (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#FFBE32] mb-4">
              ORGANIZATION
            </h4>
            <ul className="space-y-2.5 text-xs font-heading tracking-wider uppercase text-gray-400">
              <li>
                <Link to="/about" className="hover:text-[#FFBE32] transition-colors">
                  About MG ESPORTS
                </Link>
              </li>
              <li>
                <Link to="/about#players" className="hover:text-[#FFBE32] transition-colors">
                  Pro Roster
                </Link>
              </li>
              <li>
                <Link to="/about#teams" className="hover:text-[#FFBE32] transition-colors">
                  The Collective Team
                </Link>
              </li>
              <li>
                <Link to="/partners" className="hover:text-[#FFBE32] transition-colors">
                  Partnerships
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links: Store & Services (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#FFBE32] mb-4">
              STORE & DISPATCHES
            </h4>
            <ul className="space-y-2.5 text-xs font-heading tracking-wider uppercase text-gray-400">
              <li>
                <Link to="/products" className="hover:text-[#FFBE32] transition-colors">
                  Products &amp; Armory
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-[#FFBE32] hover:text-[#FFA000] font-semibold transition-colors">
                  Track Your Order &rarr;
                </Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-[#FFBE32] transition-colors">
                  News &amp; Dispatches
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-[#FFBE32] transition-colors">
                  Community Hubs
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-body text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>© 2026 MG ESPORTS. ALL RIGHTS RESERVED.</span>
            <span className="hidden xs:inline">•</span>
            <span className="text-gray-400">MADE FOR INDIAN ESPORTS</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6">
            <Link to="/about" className="hover:text-gray-300 transition-colors">
              Manifesto
            </Link>
            <Link to="/media" className="hover:text-gray-300 transition-colors">
              Media Hub
            </Link>
            <Link to="/partners" className="hover:text-gray-300 transition-colors">
              Sponsorships
            </Link>
            
            <button
              onClick={scrollToTop}
              aria-label="Scroll to top"
              className="flex items-center gap-1 text-[#FFBE32] hover:text-[#FFCD59] transition-colors cursor-pointer ml-1 sm:ml-2"
            >
              <span>TOP</span>
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
