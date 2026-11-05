import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ArrowRight, Flame, Mail, Copy, Check, Briefcase } from "lucide-react";
import { settingsApi, fallbackSettings, type SettingsMap } from "../api/settings";

// Social SVG Icons
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" fill="currentColor" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

interface CommunitySectionProps {
  showHeader?: boolean;
}

export const CommunitySection = ({ showHeader = true }: CommunitySectionProps) => {
  const [settings, setSettings] = useState<SettingsMap>(fallbackSettings);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    settingsApi.getSettings().then(setSettings).catch(() => {});
  }, []);

  const businessEmail = settings.businessEmail || "contact@mgesports.in";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(businessEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const channels = [
    {
      name: "OFFICIAL WHATSAPP",
      title: "MG ESPORTS Channel",
      label: "Official announcements, tournament releases, rosters & daily dispatches",
      badge: "ANNOUNCEMENTS & NEWS",
      icon: WhatsAppIcon,
      accentColor: "#25D366",
      borderHover: "hover:border-[#25D366] hover:shadow-[0_0_25px_rgba(37,211,102,0.3)]",
      btnText: "JOIN WHATSAPP CHANNEL",
      href: settings.whatsappUrl || "https://whatsapp.com/channel/mgesports",
    },
    {
      name: "BR SCRIMS CHANNEL",
      title: "WhatsApp Scrims Desk",
      label: "Daily Battle Royale scrims, lobby IDs, slots & competitive match fixtures",
      badge: "DAILY SCRIMS & LOBBIES",
      icon: Flame,
      accentColor: "#FFBE32",
      borderHover: "hover:border-[#FFBE32] hover:shadow-[0_0_25px_rgba(255,190,50,0.3)]",
      btnText: "JOIN BR SCRIMS CHANNEL",
      href: settings.whatsappScrimsUrl || "https://whatsapp.com/channel/mgesports-scrims",
    },
    {
      name: "OFFICIAL INSTAGRAM",
      title: "@mgesports",
      label: "Highlight reels, roster announcements, matchday posters & behind the scenes",
      badge: "ROSTERS & STORIES",
      icon: InstagramIcon,
      accentColor: "#E1306C",
      borderHover: "hover:border-[#E1306C] hover:shadow-[0_0_25px_rgba(225,48,108,0.3)]",
      btnText: "FOLLOW @MGESPORTS",
      href: settings.instagramUrl || "https://www.instagram.com/mgesports",
    },
    {
      name: "OFFICIAL YOUTUBE",
      title: "@mgesports",
      label: "Official championship livestreams, match highlights, vods & tournament casts",
      badge: "LIVESTREAMS & VODS",
      icon: YoutubeIcon,
      accentColor: "#FF0000",
      borderHover: "hover:border-[#FF0000] hover:shadow-[0_0_25px_rgba(255,0,0,0.3)]",
      btnText: "SUBSCRIBE ON YOUTUBE",
      href: settings.youtubeUrl || "https://youtube.com/@mgesports",
    },
    {
      name: "OFFICIAL DISCORD",
      title: "MG Gaming Hub",
      label: "Tier-1 scrim coordination, referee tickets, team voice lounges & gamer community",
      badge: "VOICE COMMS & SCRIMS",
      icon: MessageSquare,
      accentColor: "#5865F2",
      borderHover: "hover:border-[#5865F2] hover:shadow-[0_0_25px_rgba(88,101,242,0.3)]",
      btnText: "JOIN DISCORD SERVER",
      href: settings.discordUrl || "https://discord.gg/mgesports",
    },
  ];

  return (
    <section id="community" className={`relative ${showHeader ? "py-24" : "py-10 sm:py-14"} px-4 sm:px-6 lg:px-8 bg-[#070709] overflow-hidden`}>
      {/* Background Gold Wave Grid */}
      <div className="absolute inset-0 bg-esports-grid opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#FFBE32]/8 blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto z-10">
        {showHeader && (
          <div className="text-center max-w-3xl mx-auto mb-14">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFBE32]/10 border border-[#FFBE32]/30 text-xs font-heading font-bold uppercase tracking-[0.2em] text-[#FFBE32] mb-3"
            >
              <Flame className="h-3.5 w-3.5 text-[#FFBE32]" />
              <span>OFFICIAL CHANNELS &amp; HUBS</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl sm:text-5xl md:text-6xl uppercase tracking-wider text-white font-bold"
            >
              CONNECT WITH <span className="text-gold-gradient">MG ESPORTS</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 text-sm sm:text-base text-gray-300 font-body"
            >
              Follow and join our official channels for the latest esports news, announcements, tournaments &amp; scrims. Stay connected with the community across all platforms.
            </motion.p>
          </div>
        )}

        {/* Official Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {channels.map((ch, index) => {
            const Icon = ch.icon;

            return (
              <motion.div
                key={ch.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ y: -6 }}
                className={`rounded-2xl bg-[#0C0C0E] border border-white/10 ${ch.borderHover} p-5 flex flex-col justify-between transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.6)] group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="h-11 w-11 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ color: ch.accentColor }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#FFBE32] font-semibold tracking-wider uppercase">
                      {ch.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-xl uppercase tracking-wider text-white mt-1">
                    {ch.name}
                  </h3>

                  <p className="font-heading text-xs text-[#FFBE32] font-semibold tracking-wide mt-0.5">
                    {ch.title}
                  </p>

                  <p className="mt-2 text-xs text-gray-400 font-body leading-relaxed">
                    {ch.label}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5">
                  <a
                    href={ch.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded font-heading text-[11px] font-bold uppercase tracking-wider bg-[#141418] hover:bg-[#FFBE32] text-gray-200 hover:text-black border border-white/10 hover:border-[#FFBE32] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{ch.btnText}</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Business & Partnership Enquiries Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 rounded-2xl bg-gradient-to-r from-[#0E0E12] via-[#14120D] to-[#0E0E12] border border-[#FFBE32]/30 p-6 sm:p-8 shadow-[0_10px_35px_rgba(255,190,50,0.08)]"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#FFBE32]/10 border border-[#FFBE32]/30 text-[11px] font-heading font-bold uppercase tracking-widest text-[#FFBE32]">
                <Briefcase className="h-3.5 w-3.5" />
                <span>COMMERCIAL DESK</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-white">
                MG ESPORTS <span className="text-[#FFBE32]">BUSINESS &amp; PARTNERSHIP ENQUIRIES</span>
              </h3>
              <p className="text-sm text-gray-300 font-body">
                Interested in brand collaborations, tournament sponsorships, merchandise partnerships, or esports integrations? Contact our commercial team directly.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Mail className="h-4 w-4 text-[#FFBE32]" />
                <span className="font-mono text-sm text-white font-semibold selection:bg-[#FFBE32] selection:text-black">
                  {businessEmail}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={handleCopyEmail}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copiedEmail ? (
                  <>
                    <Check className="h-4 w-4 text-[#25D366]" />
                    <span className="text-[#25D366]">COPIED TO CLIPBOARD!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-gray-400" />
                    <span>COPY EMAIL</span>
                  </>
                )}
              </button>

              <a
                href={`mailto:${businessEmail}?subject=MG%20Esports%20Business%20%26%20Partnership%20Enquiry`}
                className="py-3 px-6 rounded-xl bg-[#FFBE32] hover:bg-[#FFCD59] text-black font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,190,50,0.3)] cursor-pointer"
              >
                <Mail className="h-4 w-4" />
                <span>SEND EMAIL NOW</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
