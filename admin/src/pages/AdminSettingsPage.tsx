import React, { useState, useEffect, useRef } from "react";
import { settingsApi, type SettingsMap, fallbackSettings } from "../api/settings";
import {
  Radio,
  Save,
  Check,
  RefreshCw,
  Bell,
  Share2,
  BarChart,
  Download,
  Upload,
  Copy,
  RotateCcw,
  FileJson,
  X,
  AlertCircle,
  FileText,
  Sliders,
  Sparkles,
  Database,
  CheckSquare,
  Square,
  Trophy,
  Video,
  Newspaper,
  Handshake,
  Users,
  Award,
  ShoppingBag,
  Vote,
  HardDrive,
  Banknote,
  Truck,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { adminApi } from "../api/admin";
import { courierApi } from "../api/courier";


const MODULE_METADATA: Array<{
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  desc: string;
}> = [
  { key: "settings", label: "Broadcast & Site Settings", icon: Sliders, color: "text-[#fc8100]", desc: "Live ticker, social URLs, counters" },
  { key: "tournaments", label: "Tournaments & Brackets", icon: Trophy, color: "text-amber-400", desc: "All tournament setups & schedules" },
  { key: "media", label: "Video Highlights", icon: Video, color: "text-red-400", desc: "Highlight reels & YouTube links" },
  { key: "news", label: "News & Editorial", icon: Newspaper, color: "text-blue-400", desc: "Articles, blogs & announcements" },
  { key: "partners", label: "Sponsors & Partners", icon: Handshake, color: "text-emerald-400", desc: "Official brands, tiers & links" },
  { key: "players", label: "Pro Athlete Rosters", icon: Users, color: "text-purple-400", desc: "Player profiles & game stats" },
  { key: "legends", label: "Hall of Fame Legends", icon: Award, color: "text-yellow-400", desc: "Alumni & legendary members" },
  { key: "votingEvents", label: "Voting Campaigns", icon: Vote, color: "text-pink-400", desc: "Active & completed player polls" },
  { key: "products", label: "Merchandise Catalog", icon: ShoppingBag, color: "text-orange-400", desc: "Official apparel & products" },
];

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsMap>(fallbackSettings);
  const [originalSettings, setOriginalSettings] = useState<SettingsMap>(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importedNotice, setImportedNotice] = useState<string | null>(null);

  // Full Platform Backup State
  const [isExportingFull, setIsExportingFull] = useState(false);
  const [isFullBackupModalOpen, setIsFullBackupModalOpen] = useState(false);
  const [fullBackupInputText, setFullBackupInputText] = useState("");
  const [fullBackupFileName, setFullBackupFileName] = useState<string | null>(null);
  const [fullBackupError, setFullBackupError] = useState<string | null>(null);
  const [parsedFullBackup, setParsedFullBackup] = useState<{ raw: any; data: any; modulesFound: Record<string, number> } | null>(null);
  const [fullImportMode, setFullImportMode] = useState<"merge" | "replace">("merge");
  const [isRestoringFull, setIsRestoringFull] = useState(false);
  const [fullImportTab, setFullImportTab] = useState<"file" | "paste">("file");
  const fullBackupFileRef = useRef<HTMLInputElement>(null);

  // Selected modules for full backup restore
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({
    settings: true,
    tournaments: true,
    media: true,
    news: true,
    partners: true,
    partnerPlans: true,
    players: true,
    legends: true,
    products: true,
    votingEvents: true,
  });

  // Import Modal State (Settings only)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedImportSettings, setParsedImportSettings] = useState<SettingsMap | null>(null);
  const [importTab, setImportTab] = useState<"file" | "paste">("file");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AfterShip & Courier Tracking State
  const [showAftershipKey, setShowAftershipKey] = useState(false);
  const [testingAftership, setTestingAftership] = useState(false);
  const [aftershipTestResult, setAftershipTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestAftership = async () => {
    setTestingAftership(true);
    setAftershipTestResult(null);
    try {
      const res = await courierApi.testConnection(settings.aftershipApiKey);
      if (res.success) {
        setAftershipTestResult({
          success: true,
          message: `Connected successfully! ${res.couriersCount || 2276} couriers active on AfterShip.`,
        });
      } else {
        setAftershipTestResult({
          success: false,
          message: res.message || "Failed to authenticate with AfterShip. Check your API key.",
        });
      }
    } catch (err: any) {
      setAftershipTestResult({
        success: false,
        message: err.message || "Failed to reach AfterShip API",
      });
    } finally {
      setTestingAftership(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        const merged = { ...fallbackSettings, ...data };
        setSettings(merged);
        setOriginalSettings(merged);
      } catch {
        setSettings(fallbackSettings);
        setOriginalSettings(fallbackSettings);
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

  const handleSave = async (e?: React.FormEvent, customSettings?: SettingsMap) => {
    if (e) e.preventDefault();
    setSaving(true);
    const payload = customSettings || settings;
    try {
      await settingsApi.updateSettings(payload);
      setOriginalSettings(payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
      return true;
    } catch (err: any) {
      alert(err.message || "Failed to update settings");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ================= FULL PLATFORM BACKUP & RESTORE =================
  const handleExportFullBackup = async () => {
    setIsExportingFull(true);
    try {
      const backup = await adminApi.exportFullBackup();
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `mg-esports-full-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImportedNotice("Platform backup generated and downloaded successfully! Keep this file secure.");
    } catch (err: any) {
      alert(err.message || "Failed to export platform backup");
    } finally {
      setIsExportingFull(false);
    }
  };

  const parseFullBackupJson = (text: string) => {
    setFullBackupError(null);
    setParsedFullBackup(null);

    if (!text.trim()) return;

    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid format: backup must be a JSON object.");
      }

      const data = (parsed.data && typeof parsed.data === "object") ? parsed.data : parsed;
      const modulesFound: Record<string, number> = {};

      if (data.settings && typeof data.settings === "object") {
        modulesFound.settings = Object.keys(data.settings).length;
      }
      if (Array.isArray(data.tournaments)) modulesFound.tournaments = data.tournaments.length;
      if (Array.isArray(data.media)) modulesFound.media = data.media.length;
      if (Array.isArray(data.news)) modulesFound.news = data.news.length;
      if (Array.isArray(data.partners)) modulesFound.partners = data.partners.length;
      if (Array.isArray(data.partnerPlans)) modulesFound.partnerPlans = data.partnerPlans.length;
      if (Array.isArray(data.players)) modulesFound.players = data.players.length;
      if (Array.isArray(data.legends)) modulesFound.legends = data.legends.length;
      if (Array.isArray(data.products)) modulesFound.products = data.products.length;
      if (Array.isArray(data.votingEvents)) modulesFound.votingEvents = data.votingEvents.length;

      const totalItems = Object.values(modulesFound).reduce((acc, c) => acc + c, 0);
      if (totalItems === 0) {
        throw new Error("No recognized platform datasets (settings, tournaments, media, news, partners, players, etc.) found in this JSON file.");
      }

      setParsedFullBackup({ raw: parsed, data, modulesFound });
      const newSelected: Record<string, boolean> = {};
      for (const key of Object.keys(modulesFound)) {
        newSelected[key] = true;
      }
      setSelectedModules((prev) => ({ ...prev, ...newSelected }));
    } catch (err: any) {
      setFullBackupError(err.message || "Failed to parse backup JSON file.");
      setParsedFullBackup(null);
    }
  };

  const handleFullBackupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFullBackupFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFullBackupInputText(content);
      parseFullBackupJson(content);
    };
    reader.onerror = () => {
      setFullBackupError("Failed to read file from disk.");
    };
    reader.readAsText(file);
  };

  const handleFullBackupDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFullBackupFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFullBackupInputText(content);
      parseFullBackupJson(content);
    };
    reader.onerror = () => {
      setFullBackupError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleExecuteFullRestore = async () => {
    if (!parsedFullBackup) return;

    const filteredData: Record<string, any> = {};
    const d = parsedFullBackup.data;

    for (const [modKey, isSelected] of Object.entries(selectedModules)) {
      if (isSelected && d[modKey] !== undefined) {
        filteredData[modKey] = d[modKey];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      alert("Please select at least one module to restore.");
      return;
    }

    if (fullImportMode === "replace") {
      const confirmed = window.confirm(
        "CAUTION: 'Replace' mode will delete existing items for selected collections before restoring from backup. Are you sure you want to proceed?"
      );
      if (!confirmed) return;
    }

    setIsRestoringFull(true);
    try {
      const res = await adminApi.importFullBackup({ data: filteredData }, fullImportMode);
      
      if (filteredData.settings) {
        try {
          const fresh = await settingsApi.getSettings();
          setSettings({ ...fallbackSettings, ...fresh });
        } catch {
          // Keep current
        }
      }

      const resultsStr = res.results 
        ? Object.entries(res.results).map(([k, v]) => `${k}: ${v}`).join(", ")
        : "all items";

      setImportedNotice(`Platform backup successfully restored (${fullImportMode} mode)! Restored: [${resultsStr}]`);
      setIsFullBackupModalOpen(false);
      resetFullImportModal();
    } catch (err: any) {
      alert(err.message || "Failed to restore backup.");
    } finally {
      setIsRestoringFull(false);
    }
  };

  const resetFullImportModal = () => {
    setFullBackupInputText("");
    setFullBackupFileName(null);
    setFullBackupError(null);
    setParsedFullBackup(null);
    if (fullBackupFileRef.current) {
      fullBackupFileRef.current.value = "";
    }
  };

  // ================= EXPORT SETTINGS =================
  const handleExportJson = () => {
    const exportPayload = {
      appName: "MG Esports Admin Console",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      settings: { ...settings },
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `mg-esports-settings-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    try {
      const cleanJson = JSON.stringify(settings, null, 2);
      await navigator.clipboard.writeText(cleanJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Failed to copy to clipboard.");
    }
  };

  // ================= IMPORT VALIDATION & PARSING =================
  const parseAndValidateJson = (text: string) => {
    setImportError(null);
    setParsedImportSettings(null);

    if (!text.trim()) {
      return;
    }

    try {
      const parsed = JSON.parse(text);
      let extracted: any = null;

      if (parsed && typeof parsed === "object") {
        if (parsed.settings && typeof parsed.settings === "object") {
          extracted = parsed.settings;
        } else if (parsed.data && parsed.data.settings && typeof parsed.data.settings === "object") {
          extracted = parsed.data.settings;
        } else if (parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)) {
          extracted = parsed.data;
        } else {
          extracted = parsed;
        }
      }

      if (!extracted || typeof extracted !== "object" || Array.isArray(extracted)) {
        throw new Error("Invalid format: settings file must contain a key-value JSON object.");
      }

      // Convert all primitive values to strings
      const normalized: SettingsMap = {};
      let validKeysCount = 0;
      for (const [k, v] of Object.entries(extracted)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          normalized[k] = String(v);
          validKeysCount++;
        }
      }

      if (validKeysCount === 0) {
        throw new Error("No recognizable settings entries found in JSON.");
      }

      setParsedImportSettings(normalized);
    } catch (err: any) {
      setImportError(err.message || "Failed to parse JSON file.");
      setParsedImportSettings(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      parseAndValidateJson(content);
    };
    reader.onerror = () => {
      setImportError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      parseAndValidateJson(content);
    };
    reader.readAsText(file);
  };

  const handleApplyImportedSettings = async (saveImmediately: boolean) => {
    if (!parsedImportSettings) return;

    const merged = { ...settings, ...parsedImportSettings };
    setSettings(merged);
    const count = Object.keys(parsedImportSettings).length;

    if (saveImmediately) {
      const ok = await handleSave(undefined, merged);
      if (ok) {
        setImportedNotice(`Successfully imported & published ${count} settings live!`);
        setIsImportModalOpen(false);
        resetImportModal();
      }
    } else {
      setImportedNotice(`${count} settings loaded into form! Review below and click "Save & Publish Live" to persist.`);
      setIsImportModalOpen(false);
      resetImportModal();
    }
  };

  const resetImportModal = () => {
    setImportJsonText("");
    setImportError(null);
    setParsedImportSettings(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Are you sure you want to restore default broadcast settings? You will still need to click 'Save & Publish Live' to apply.")) {
      setSettings(fallbackSettings);
      setImportedNotice("Restored default settings in form. Click 'Save & Publish Live' to save.");
    }
  };

  const handleRevertChanges = () => {
    setSettings(originalSettings);
    setImportedNotice(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-6 w-6 text-[#fc8100]" />
            <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-white">
              BROADCAST &amp; SITE SETTINGS
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-body mt-1">
            Manage live broadcast tickers, platform emergency banners, organization statistics, and social links.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export JSON Button */}
          <button
            type="button"
            onClick={handleExportJson}
            title="Download current settings as JSON"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all cursor-pointer shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-[#fc8100]" />
            <span>Export</span>
          </button>

          {/* Copy JSON Button */}
          <button
            type="button"
            onClick={handleCopyJson}
            title="Copy current settings JSON to clipboard"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-gray-400" />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          {/* Import JSON Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            title="Upload or paste settings JSON to import"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#fc8100]/50 transition-all cursor-pointer shrink-0"
          >
            <Upload className="h-3.5 w-3.5 text-[#fc8100]" />
            <span>Import</span>
          </button>

          {/* Reset Defaults */}
          <button
            type="button"
            onClick={handleResetDefaults}
            title="Reset form fields to default configuration"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Defaults</span>
          </button>

          {/* Primary Save & Publish Live Button */}
          <button
            onClick={(e) => handleSave(e)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#fc8100] hover:bg-[#e07200] transition-all cursor-pointer shadow-[0_0_15px_rgba(252, 129, 0,0.3)] shrink-0 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : success ? (
              <>
                <Check className="h-4 w-4" />
                <span>Published Live!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save &amp; Publish</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full System Disaster Recovery & Platform Backup Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0F0F14] border border-[#fc8100]/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#fc8100]/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#fc8100]/15 border border-[#fc8100]/40 flex items-center justify-center shrink-0 text-[#fc8100] shadow-[0_0_20px_rgba(252, 129, 0,0.15)]">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-heading font-bold uppercase tracking-wider text-white">
                  Entire Admin Side Data Backup &amp; Restore
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#fc8100]/20 text-[#fc8100] border border-[#fc8100]/40 rounded-full">
                  Full Platform Snapshot
                </span>
              </div>
              <p className="text-xs text-gray-300 font-body mt-1 max-w-2xl leading-relaxed">
                Export and import the entire platform database: <strong>Settings, Tournaments, Media Highlights, News Articles, Sponsors, Pro Athlete Rosters, Hall of Fame, Merchandise, and Fan Voting Campaigns</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Export Entire Admin Data */}
            <button
              type="button"
              onClick={handleExportFullBackup}
              disabled={isExportingFull}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#fc8100] hover:bg-[#e07200] shadow-[0_0_15px_rgba(252, 129, 0,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isExportingFull ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Exporting Full DB...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Export Entire Admin Data</span>
                </>
              )}
            </button>

            {/* Import Full Backup */}
            <button
              type="button"
              onClick={() => {
                setIsFullBackupModalOpen(true);
                resetFullImportModal();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#fc8100]/60 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4 text-[#fc8100]" />
              <span>Import Full Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Imported Notice / Revert Banner */}
      {importedNotice && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#fc8100]/10 border border-[#fc8100]/40 text-[#fc8100] text-xs font-mono animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0 text-[#fc8100]" />
            <span>{importedNotice}</span>
          </div>
          <button
            type="button"
            onClick={handleRevertChanges}
            className="text-xs uppercase font-heading font-bold text-gray-300 hover:text-white underline cursor-pointer ml-4 shrink-0"
          >
            Revert
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse">
          Loading broadcast settings...
        </div>
      ) : (
        <form onSubmit={(e) => handleSave(e)} className="space-y-6">
          {/* Live Broadcast Ticker Section */}
          <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-heading font-bold text-sm uppercase">
                <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
                <span>Top Bar Live Status Ticker</span>
              </div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                Key: liveTicker
              </span>
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
                className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white font-mono focus:border-[#fc8100] focus:outline-none"
              />
            </div>
          </div>

          {/* Emergency Alert Banner */}
          <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-heading font-bold text-sm uppercase">
                <Bell className="h-4 w-4 text-[#fc8100]" />
                <span>Championship Announcement Banner</span>
              </div>
              <label className="flex items-center gap-2 text-xs font-mono text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emergencyBannerActive === "true"}
                  onChange={(e) => handleChange("emergencyBannerActive", e.target.checked ? "true" : "false")}
                  className="rounded border-white/20 bg-black accent-[#fc8100] h-4 w-4 cursor-pointer"
                />
                <span>Banner Active</span>
              </label>
            </div>
            <input
              type="text"
              value={settings.emergencyBanner || ""}
              onChange={(e) => handleChange("emergencyBanner", e.target.value)}
              placeholder="OFFICIAL REGISTRATIONS OPEN FOR LORD CLUTCH CUP S1 (₹1,00,000 PRIZE POOL)"
              className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white focus:border-[#fc8100] focus:outline-none"
            />
          </div>

          {/* Organization Counter Statistics */}
          <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-white font-heading font-bold text-sm uppercase">
              <BarChart className="h-4 w-4 text-[#fc8100]" />
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
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white font-mono focus:border-[#fc8100] focus:outline-none"
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
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white font-mono focus:border-[#fc8100] focus:outline-none"
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
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white font-mono focus:border-[#fc8100] focus:outline-none"
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
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white font-mono focus:border-[#fc8100] focus:outline-none text-[#fc8100] font-bold"
                />
              </div>
            </div>
          </div>

          {/* Community & Social Links */}
          <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-white font-heading font-bold text-sm uppercase">
              <Share2 className="h-4 w-4 text-[#fc8100]" />
              <span>Official Community &amp; Social Links</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                  Discord Hub URL
                </label>
                <input
                  type="url"
                  value={settings.discordUrl || ""}
                  onChange={(e) => handleChange("discordUrl", e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none"
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
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                  WhatsApp Scrims Channel URL
                </label>
                <input
                  type="url"
                  value={settings.whatsappScrimsUrl || ""}
                  onChange={(e) => handleChange("whatsappScrimsUrl", e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none"
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
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none"
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
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                  Twitter / X URL
                </label>
                <input
                  type="url"
                  value={settings.twitterUrl || ""}
                  onChange={(e) => handleChange("twitterUrl", e.target.value)}
                  placeholder="https://x.com/mgesports"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-heading font-bold uppercase text-gray-400 mb-1">
                  Official Business &amp; Partnership Email
                </label>
                <input
                  type="email"
                  value={settings.businessEmail || ""}
                  onChange={(e) => handleChange("businessEmail", e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* E-Commerce & Store Payment Configuration */}
          <div className="p-6 rounded-2xl bg-[#0D0D12] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-heading font-bold text-sm uppercase">
                <Banknote className="h-4 w-4 text-[#fc8100]" />
                <span>Store Checkout &amp; Payment Options</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                settings.codEnabled !== "false"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}>
                {settings.codEnabled !== "false" ? "COD ACTIVE" : "PREPAID ONLY"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-black/60 border border-white/10">
              <div className="space-y-1">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                  Cash On Delivery (COD) Checkout Option
                </h4>
                <p className="text-xs text-gray-400 font-body max-w-xl">
                  Allow customers to pay cash upon doorstep delivery. When disabled, the Cash on Delivery choice is hidden at checkout, requiring instant UPI verification.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleChange("codEnabled", "true")}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    settings.codEnabled !== "false"
                      ? "bg-emerald-500 text-black font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
                  }`}
                >
                  Enabled
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("codEnabled", "false")}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    settings.codEnabled === "false"
                      ? "bg-rose-500 text-white font-extrabold shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
                  }`}
                >
                  Disabled
                </button>
              </div>
            </div>
          </div>

          {/* ================= COURIER TRACKING & AFTERSHIP SETTINGS ================= */}
          <div className="rounded-2xl border border-white/10 bg-[#0E0E12] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-white font-heading font-bold text-sm uppercase">
                <Truck className="h-4 w-4 text-[#fc8100]" />
                <span>Courier &amp; AfterShip Live Tracking Configuration</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border bg-amber-500/20 text-amber-300 border-amber-500/40">
                AfterShip Active
              </span>
            </div>

            <p className="text-xs text-gray-400 font-body">
              Configure real-time courier tracking powered by AfterShip. Customers can track shipments for <strong>India Post Domestic (india-post)</strong>, <strong>India Post International (india-post-int)</strong>, Delhivery, Blue Dart, DTDC, and 2,000+ international carriers directly from your store.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AfterShip API Key */}
              <div className="space-y-2">
                <label className="block text-xs font-heading font-bold uppercase text-gray-300">
                  AfterShip API Key (as-api-key)
                </label>
                <div className="relative">
                  <input
                    type={showAftershipKey ? "text" : "password"}
                    value={settings.aftershipApiKey || ""}
                    onChange={(e) => handleChange("aftershipApiKey", e.target.value)}
                    placeholder="asat_..."
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 pr-10 text-xs text-white focus:border-[#fc8100] focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAftershipKey(!showAftershipKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showAftershipKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Header: <code className="text-[#fc8100]">as-api-key</code>. Generated from your AfterShip Organization portal.
                </p>
              </div>

              {/* Default Courier Partner */}
              <div className="space-y-2">
                <label className="block text-xs font-heading font-bold uppercase text-gray-300">
                  Default Courier Partner / Slug
                </label>
                <select
                  value={settings.aftershipDefaultCourier || "india-post"}
                  onChange={(e) => handleChange("aftershipDefaultCourier", e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-[#fc8100] focus:outline-none font-body"
                >
                  <option value="india-post">India Post Domestic (india-post) — Recommended</option>
                  <option value="india-post-int">India Post International (india-post-int)</option>
                  <option value="delhivery">Delhivery (delhivery)</option>
                  <option value="bluedart">Blue Dart Express (bluedart)</option>
                  <option value="dtdc">DTDC India (dtdc)</option>
                  <option value="shadowfax">Shadowfax (shadowfax)</option>
                  <option value="ecom-express">Ecom Express (ecom-express)</option>
                  <option value="xpressbees">XpressBees (xpressbees)</option>
                  <option value="dhl">DHL Express (dhl)</option>
                  <option value="fedex">FedEx (fedex)</option>
                  <option value="ups">UPS (ups)</option>
                </select>
                <p className="text-[11px] text-gray-500">
                  Selected default carrier slug used when auto-creating shipments.
                </p>
              </div>
            </div>

            {/* Test Connection & Auto-Sync Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-black/60 border border-white/10">
              <div className="space-y-1">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                  AfterShip Connection &amp; Auto-Sync
                </h4>
                <p className="text-xs text-gray-400 font-body">
                  Verify API key authentication and courier database availability.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestAftership}
                  disabled={testingAftership}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testingAftership ? "animate-spin" : ""}`} />
                  <span>{testingAftership ? "Testing..." : "Test Connection"}</span>
                </button>
                <a
                  href="https://admin.aftership.com/settings/couriers"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white"
                >
                  <span>AfterShip Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Connection Test Result Alert */}
            {aftershipTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                  aftershipTestResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                {aftershipTestResult.success ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
                <span>{aftershipTestResult.message}</span>
              </div>
            )}
          </div>
        </form>
      )}

            {/* ================= FULL PLATFORM BACKUP & RESTORE MODAL ================= */}
      {isFullBackupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0D0D12] border border-[#fc8100]/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-[#fc8100]" />
                <div>
                  <h3 className="font-heading font-bold text-base uppercase text-white tracking-wider">
                    Restore Entire Platform Backup
                  </h3>
                  <p className="text-[11px] text-gray-400 font-body">
                    Upload or paste an MG Esports full JSON backup to restore platform data
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFullBackupModalOpen(false);
                  resetFullImportModal();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Method Switcher */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-black/60 border border-white/10">
                <button
                  type="button"
                  onClick={() => setFullImportTab("file")}
                  className={`flex-1 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    fullImportTab === "file"
                      ? "bg-[#fc8100] text-black shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Upload JSON File
                </button>
                <button
                  type="button"
                  onClick={() => setFullImportTab("paste")}
                  className={`flex-1 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    fullImportTab === "paste"
                      ? "bg-[#fc8100] text-black shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Paste Raw JSON
                </button>
              </div>

              {fullImportTab === "file" ? (
                /* Mode 1: File Upload */
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFullBackupDrop}
                  onClick={() => fullBackupFileRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-[#fc8100] rounded-2xl p-8 text-center cursor-pointer bg-white/[0.02] hover:bg-[#fc8100]/5 transition-all group"
                >
                  <input
                    ref={fullBackupFileRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFullBackupFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 group-hover:bg-[#fc8100]/10 border border-white/10 group-hover:border-[#fc8100]/40 flex items-center justify-center text-gray-400 group-hover:text-[#fc8100] transition-colors">
                      <HardDrive className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                        {fullBackupFileName ? fullBackupFileName : "Click to select or drop full backup JSON here"}
                      </p>
                      <p className="text-xs text-gray-500 font-body mt-1">
                        Accepts mg-esports-full-backup-*.json containing entire platform data
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode 2: Paste Raw JSON */
                <div className="space-y-2">
                  <label className="block text-xs font-heading font-bold uppercase text-gray-400">
                    Paste Full Platform Backup JSON
                  </label>
                  <textarea
                    rows={8}
                    value={fullBackupInputText}
                    onChange={(e) => {
                      setFullBackupInputText(e.target.value);
                      parseFullBackupJson(e.target.value);
                    }}
                    placeholder={`{\n  "version": "2.0",\n  "data": {\n    "settings": { ... },\n    "tournaments": [ ... ],\n    "media": [ ... ],\n    "news": [ ... ]\n  }\n}`}
                    className="w-full rounded-xl border border-white/15 bg-black/80 px-4 py-3 text-xs font-mono text-white focus:border-[#fc8100] focus:outline-none"
                  />
                </div>
              )}

              {/* Error Alert */}
              {fullBackupError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{fullBackupError}</span>
                </div>
              )}

              {/* Discovered Modules & Selective Restore */}
              {parsedFullBackup && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                    <div>
                      <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        Valid Platform Backup Detected
                      </h4>
                      <p className="text-[11px] text-gray-400 font-body mt-0.5">
                        Select which data collections to restore to your live database:
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allTrue: Record<string, boolean> = {};
                          for (const k of Object.keys(parsedFullBackup.modulesFound)) {
                            allTrue[k] = true;
                          }
                          setSelectedModules((prev) => ({ ...prev, ...allTrue }));
                        }}
                        className="text-[10px] font-mono uppercase text-gray-300 hover:text-white underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-gray-600">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allFalse: Record<string, boolean> = {};
                          for (const k of Object.keys(parsedFullBackup.modulesFound)) {
                            allFalse[k] = false;
                          }
                          setSelectedModules((prev) => ({ ...prev, ...allFalse }));
                        }}
                        className="text-[10px] font-mono uppercase text-gray-300 hover:text-white underline cursor-pointer"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Modules Selection Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {MODULE_METADATA.map((mod) => {
                      const count = parsedFullBackup.modulesFound[mod.key];
                      const isFound = count !== undefined && count > 0;
                      const isChecked = !!selectedModules[mod.key];
                      const IconComponent = mod.icon;

                      return (
                        <div
                          key={mod.key}
                          onClick={() => {
                            if (!isFound) return;
                            setSelectedModules((prev) => ({ ...prev, [mod.key]: !prev[mod.key] }));
                          }}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                            !isFound
                              ? "opacity-35 bg-white/[0.02] border-white/5 cursor-not-allowed"
                              : isChecked
                              ? "bg-[#fc8100]/10 border-[#fc8100]/50 cursor-pointer"
                              : "bg-white/[0.03] border-white/10 hover:border-white/25 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isFound && isChecked ? (
                              <CheckSquare className="h-4 w-4 text-[#fc8100] shrink-0" />
                            ) : isFound ? (
                              <Square className="h-4 w-4 text-gray-500 shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-700 shrink-0" />
                            )}
                            <IconComponent className={`h-4 w-4 shrink-0 ${mod.color}`} />
                            <div className="min-w-0">
                              <p className="text-xs font-heading font-bold text-white truncate">
                                {mod.label}
                              </p>
                              <p className="text-[10px] text-gray-400 font-body truncate">
                                {mod.desc}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ml-2 ${
                            isFound
                              ? "bg-white/10 text-white"
                              : "text-gray-600 bg-white/5"
                          }`}>
                            {isFound ? `${count} items` : "None"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mode Selection */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2">
                    <label className="block text-xs font-heading font-bold uppercase text-gray-300">
                      Import Operation Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        fullImportMode === "merge"
                          ? "bg-[#fc8100]/10 border-[#fc8100]/50 text-white"
                          : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20"
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          checked={fullImportMode === "merge"}
                          onChange={() => setFullImportMode("merge")}
                          className="mt-0.5 accent-[#fc8100]"
                        />
                        <div>
                          <p className="font-heading font-bold uppercase text-[11px] text-white">Merge &amp; Upsert (Safe)</p>
                          <p className="text-[10px] text-gray-400 font-body mt-0.5">
                            Updates existing records and adds new ones. Does not delete untargeted records.
                          </p>
                        </div>
                      </label>

                      <label className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        fullImportMode === "replace"
                          ? "bg-rose-500/15 border-rose-500/50 text-white"
                          : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20"
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          checked={fullImportMode === "replace"}
                          onChange={() => setFullImportMode("replace")}
                          className="mt-0.5 accent-rose-500"
                        />
                        <div>
                          <p className="font-heading font-bold uppercase text-[11px] text-rose-400">Clean Replace</p>
                          <p className="text-[10px] text-gray-400 font-body mt-0.5">
                            Clears selected tables before restoring to ensure an exact replica match.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 border-t border-white/10 bg-black/40">
              <button
                type="button"
                onClick={() => {
                  setIsFullBackupModalOpen(false);
                  resetFullImportModal();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!parsedFullBackup || isRestoringFull}
                onClick={handleExecuteFullRestore}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-black bg-[#fc8100] hover:bg-[#e07200] shadow-[0_0_15px_rgba(252, 129, 0,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRestoringFull ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Restoring Selected Data...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Restore &amp; Apply Selected Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= IMPORT SETTINGS MODAL ================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0C0C10] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#fc8100]/10 border border-[#fc8100]/30 flex items-center justify-center text-[#fc8100]">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg uppercase tracking-wider text-white">
                    IMPORT SETTINGS CONFIGURATION
                  </h3>
                  <p className="text-xs text-gray-400 font-body">
                    Upload a settings JSON backup or paste raw JSON directly.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  resetImportModal();
                }}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Tab Selector: Upload File vs Paste JSON */}
              <div className="flex gap-2 p-1 bg-black/50 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setImportTab("file")}
                  className={`flex-1 py-2 text-xs font-heading font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    importTab === "file"
                      ? "bg-[#fc8100] text-black shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <FileJson className="h-4 w-4" />
                  <span>Upload JSON File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab("paste")}
                  className={`flex-1 py-2 text-xs font-heading font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    importTab === "paste"
                      ? "bg-[#fc8100] text-black shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Paste JSON Text</span>
                </button>
              </div>

              {/* Mode 1: File Dropzone */}
              {importTab === "file" ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-[#fc8100]/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-black/40 hover:bg-black/60 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 group-hover:bg-[#fc8100]/10 border border-white/10 group-hover:border-[#fc8100]/40 flex items-center justify-center text-gray-400 group-hover:text-[#fc8100] transition-colors">
                      <FileJson className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                        {fileName ? fileName : "Click to browse or drop JSON file here"}
                      </p>
                      <p className="text-xs text-gray-500 font-body mt-1">
                        Accepts .json exported from MG Esports settings
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode 2: Paste Raw JSON */
                <div className="space-y-2">
                  <label className="block text-xs font-heading font-bold uppercase text-gray-400">
                    Paste Settings JSON
                  </label>
                  <textarea
                    rows={8}
                    value={importJsonText}
                    onChange={(e) => {
                      setImportJsonText(e.target.value);
                      parseAndValidateJson(e.target.value);
                    }}
                    placeholder={`{\n  "liveTicker": "🔥 GRAND FINALS LIVE NOW...",\n  "tournamentsCount": "25+",\n  "discordUrl": "https://discord.gg/..."\n}`}
                    className="w-full rounded-xl border border-white/15 bg-black/80 px-4 py-3 text-xs font-mono text-white focus:border-[#fc8100] focus:outline-none"
                  />
                </div>
              )}

              {/* Error Alert */}
              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview of Parsed Settings */}
              {parsedImportSettings && (
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      {Object.keys(parsedImportSettings).length} Settings Verified
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      Ready to apply
                    </span>
                  </div>

                  {/* Key-Value Quick Preview Table */}
                  <div className="max-h-44 overflow-y-auto rounded-lg border border-white/5 divide-y divide-white/5 font-mono text-[11px]">
                    {Object.entries(parsedImportSettings).map(([key, val]) => (
                      <div key={key} className="p-2 flex items-center justify-between hover:bg-white/5">
                        <span className="text-gray-400 font-bold">{key}:</span>
                        <span className="text-white max-w-[65%] truncate text-right">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 border-t border-white/10 bg-black/40">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  resetImportModal();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={!parsedImportSettings}
                  onClick={() => handleApplyImportedSettings(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Load into Form
                </button>
                <button
                  type="button"
                  disabled={!parsedImportSettings || saving}
                  onClick={() => handleApplyImportedSettings(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-black bg-[#fc8100] hover:bg-[#e07200] shadow-[0_0_15px_rgba(252, 129, 0,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Import &amp; Publish Live</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
