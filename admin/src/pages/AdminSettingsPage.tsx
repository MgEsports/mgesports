import React, { useState, useEffect } from "react";
import { settingsApi, type SettingsMap, fallbackSettings } from "../api/settings";
import {
  Radio,
  Save,
  Check,
  RefreshCw,
  Bell,
  Share2,
  BarChart
} from "lucide-react";

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsMap>(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        setSettings({ ...fallbackSettings, ...data });
      } catch {
        setSettings(fallbackSettings);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-white">
            WEBSITE CONTENT & BROADCAST CONTROLS
          </h1>
          <p className="text-xs text-gray-400 font-body">
            Manage live broadcast tickers, platform emergency banners, organization statistics, and social links.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#FFBE32] hover:bg-[#FFA000] transition-all cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)] shrink-0 disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Saving Broadcast...</span>
            </>
          ) : success ? (
            <>
              <Check className="h-4 w-4" />
              <span>Published Live!</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save & Publish Live</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse">
          Loading broadcast settings...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
        {/* Live Broadcast Ticker Section */}
        <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white font-heading font-bold text-sm uppercase">
            <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
            <span>Top Bar Live Status Ticker</span>
          </div>
          <p className="text-xs text-gray-400 font-body">
            This message continuously scrolls on the top sticky navigation bar on every public webpage.
          </p>
          <div>
            <input
              type="text"
              value={settings.liveTicker || ""}
              onChange={(e) => handleChange("liveTicker", e.target.value)}
              placeholder="🔥 FLAME OF GLORY S2 GRAND FINALS LIVE NOW • PRIZE POOL ₹50,000 • WATCH STREAM ON YOUTUBE"
              className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white font-mono focus:border-[#FFBE32] focus:outline-none"
            />
          </div>
        </div>

        {/* Emergency Alert Banner */}
        <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-heading font-bold text-sm uppercase">
              <Bell className="h-4 w-4 text-[#FFBE32]" />
              <span>Championship Announcement Banner</span>
            </div>
            <label className="flex items-center gap-2 text-xs font-mono text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emergencyBannerActive === "true"}
                onChange={(e) => handleChange("emergencyBannerActive", e.target.checked ? "true" : "false")}
                className="rounded border-white/20 bg-black accent-[#FFBE32] h-4 w-4"
              />
              <span>Banner Active</span>
            </label>
          </div>
          <input
            type="text"
            value={settings.emergencyBanner || ""}
            onChange={(e) => handleChange("emergencyBanner", e.target.value)}
            placeholder="OFFICIAL REGISTRATIONS OPEN FOR LORD CLUTCH CUP S1 (₹1,00,000 PRIZE POOL)"
            className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
          />
        </div>

        {/* Organization Counter Statistics */}
        <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white font-heading font-bold text-sm uppercase">
            <BarChart className="h-4 w-4 text-[#FFBE32]" />
            <span>Organization Viewport Counters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                Tournaments Hosted
              </label>
              <input
                type="text"
                value={settings.tournamentsCount || "25+"}
                onChange={(e) => handleChange("tournamentsCount", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white font-mono focus:border-[#FFBE32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                Registered Players
              </label>
              <input
                type="text"
                value={settings.playersCount || "500+"}
                onChange={(e) => handleChange("playersCount", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white font-mono focus:border-[#FFBE32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                Vetted Squads
              </label>
              <input
                type="text"
                value={settings.teamsCount || "50+"}
                onChange={(e) => handleChange("teamsCount", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white font-mono focus:border-[#FFBE32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                Total Prize Purses
              </label>
              <input
                type="text"
                value={settings.prizePoolCount || "₹5L+"}
                onChange={(e) => handleChange("prizePoolCount", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white font-mono focus:border-[#FFBE32] focus:outline-none text-[#FFBE32] font-bold"
              />
            </div>
          </div>
        </div>

        {/* Community & Social Links */}
        <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white font-heading font-bold text-sm uppercase">
            <Share2 className="h-4 w-4 text-[#FFBE32]" />
            <span>Official Community Links</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                Discord Hub URL
              </label>
              <input
                type="url"
                value={settings.discordUrl || ""}
                onChange={(e) => handleChange("discordUrl", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                WhatsApp Community URL
              </label>
              <input
                type="url"
                value={settings.whatsappUrl || ""}
                onChange={(e) => handleChange("whatsappUrl", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                WhatsApp BR Scrims Channel URL
              </label>
              <input
                type="url"
                value={settings.whatsappScrimsUrl || ""}
                onChange={(e) => handleChange("whatsappScrimsUrl", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                YouTube Channel URL
              </label>
              <input
                type="url"
                value={settings.youtubeUrl || ""}
                onChange={(e) => handleChange("youtubeUrl", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                value={settings.instagramUrl || ""}
                onChange={(e) => handleChange("instagramUrl", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                Business &amp; Partnership Email
              </label>
              <input
                type="email"
                value={settings.businessEmail || ""}
                onChange={(e) => handleChange("businessEmail", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>
      )}
    </div>
  );
};
