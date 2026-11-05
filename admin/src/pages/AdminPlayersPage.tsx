import React, { useState, useEffect, useRef } from "react";
import { getApiUrl } from "../api/client";
import { playersApi } from "../api/players";
import { type Player, playersData } from "../data/players";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Image as ImageIcon,
  Shield,
  Zap,
  Crosshair,
  Target,
  Upload,
  Loader2,
  CheckCircle,
  Cloud
} from "lucide-react";

// Social SVG Icons
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const AdminPlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Player>>({
    ign: "",
    realName: "",
    role: "RUSHER",
    game: "FREE FIRE MAX",
    team: "MG ESPORTS",
    about: "",
    instagram: "",
    image: "",
    avatarUrl: "",
    featuredQuote: "",
    isCaptain: false,
  });

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const data = await playersApi.getAll();
      setPlayers(data);
    } catch {
      setPlayers(playersData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus("Uploading to Cloudinary...");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const token =
        localStorage.getItem("lordz_admin_token") ||
        localStorage.getItem("token") ||
        "demo-admin-token";

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(getApiUrl("/upload"), {
        method: "POST",
        headers,
        body: uploadData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to upload image");
      }

      setFormData((prev) => ({
        ...prev,
        image: json.url,
        avatarUrl: json.url,
      }));

      setUploadStatus(
        json.provider === "cloudinary"
          ? "✅ Uploaded to Cloudinary successfully!"
          : "✅ Uploaded successfully!"
      );
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
      setUploadStatus(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpenCreate = () => {
    setEditingPlayer(null);
    setUploadStatus(null);
    setFormData({
      ign: "",
      realName: "",
      role: "RUSHER",
      game: "FREE FIRE MAX",
      team: "MG ESPORTS",
      about: "Aggressive entry player with sharp reflexes and great communication.",
      instagram: "@lordz_player",
      image: "",
      avatarUrl: "",
      featuredQuote: "Tactics win rounds. Pure conviction wins championships.",
      isCaptain: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Player) => {
    setEditingPlayer(p);
    setUploadStatus(null);
    setFormData({
      ...p,
      about: p.about || p.featuredQuote || "",
      instagram: p.instagram || "",
      image: p.image || p.avatarUrl || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Player> = {
        ...formData,
        avatarUrl: formData.image || formData.avatarUrl,
        image: formData.image || formData.avatarUrl,
        featuredQuote: formData.about || formData.featuredQuote,
      };

      if (editingPlayer) {
        await playersApi.update(editingPlayer.id, payload);
        setPlayers((prev) =>
          prev.map((p) => (p.id === editingPlayer.id ? ({ ...p, ...payload } as Player) : p))
        );
      } else {
        const newPlayer: Player = {
          id: `player-${formData.ign?.toLowerCase().replace(/\s+/g, "-")}`,
          ign: formData.ign?.toUpperCase() || "NEW_PLAYER",
          realName: formData.realName || "Athlete",
          role: formData.role || "RUSHER",
          game: formData.game || "FREE FIRE MAX",
          team: "MG ESPORTS",
          about: formData.about || "Pro athlete representing MG Esports.",
          instagram: formData.instagram || "@lordesports",
          image: formData.image || formData.avatarUrl || "",
          avatarUrl: formData.image || formData.avatarUrl || "",
          featuredQuote: formData.about || "Built for the ones who keep pushing.",
          avatarBg: "from-amber-500/20 via-neutral-900 to-transparent",
          isCaptain: !!formData.isCaptain,
        };
        try {
          await playersApi.create(newPlayer);
        } catch {
          // fallback
        }
        setPlayers((prev) => [...prev, newPlayer]);
      }
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save athlete");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this athlete from the active roster?")) return;
    try {
      await playersApi.delete(id);
    } catch {
      // optimistic
    }
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "IGL":
        return <Shield className="h-3.5 w-3.5 text-[#FFBE32]" />;
      case "RUSHER":
        return <Zap className="h-3.5 w-3.5 text-[#FFBE32]" />;
      case "SNIPER":
        return <Crosshair className="h-3.5 w-3.5 text-[#FFBE32]" />;
      default:
        return <Target className="h-3.5 w-3.5 text-[#FFBE32]" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-white">
            PRO ATHLETE ROSTERS
          </h1>
          <p className="text-xs text-gray-400 font-body">
            Manage player profiles, images, roles, bios, and Instagram handles with Cloudinary online storage.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#FFBE32] hover:bg-[#FFA000] transition-all cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)] shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Pro Athlete</span>
        </button>
      </div>

      {/* Athletes Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse">
          Loading pro athletes...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {players.map((p) => {
            const playerImg = p.image || p.avatarUrl;
            return (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-[#0C0C10] border border-white/10 hover:border-[#FFBE32]/60 transition-all flex flex-col justify-between group shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
              >
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 border border-white/10 text-[10px] font-heading font-bold uppercase text-gray-300">
                      {getRoleIcon(p.role)}
                      <span>{p.role}</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 font-semibold uppercase tracking-wider">
                      PRO ROSTER
                    </span>
                  </div>

                  {/* Player Image Thumbnail */}
                  <div className="mt-4 relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/60 border border-white/5 flex items-center justify-center">
                    {playerImg ? (
                      <img
                        src={playerImg}
                        alt={p.ign}
                        className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <ImageIcon className="h-8 w-8 text-gray-600 mb-1" />
                        <span className="text-[10px] font-mono">No Image</span>
                      </div>
                    )}
                    {p.isCaptain && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#FFBE32] text-black text-[9px] font-mono font-extrabold uppercase shadow">
                        CAPTAIN / IGL
                      </span>
                    )}
                  </div>

                  {/* Player Name */}
                  <div className="mt-3">
                    <h3 className="font-display text-2xl uppercase tracking-wider text-white group-hover:text-[#FFBE32] transition-colors">
                      {p.ign}
                    </h3>
                    <span className="text-xs text-gray-400 font-body">{p.realName}</span>
                  </div>

                  {/* About Bio */}
                  <div className="mt-3 p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="block text-[9px] font-heading font-bold uppercase text-[#FFBE32] mb-1">
                      ABOUT
                    </span>
                    <p className="text-[11px] text-gray-300 font-body line-clamp-3 leading-relaxed">
                      {p.about || p.featuredQuote || "No bio available."}
                    </p>
                  </div>

                  {/* Instagram Tag */}
                  <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E1306C]/10 border border-[#E1306C]/25 text-xs font-mono text-[#FF5B84]">
                    <InstagramIcon className="h-3.5 w-3.5 text-[#E1306C] shrink-0" />
                    <span className="truncate">
                      {p.instagram ? (p.instagram.startsWith("@") ? p.instagram : `@${p.instagram}`) : "Not configured"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#FFBE32] cursor-pointer"
                      title="Edit Player"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 cursor-pointer"
                      title="Delete Player"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/40 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h3 className="font-display text-2xl uppercase tracking-wider text-white">
                {editingPlayer ? "Edit Pro Athlete" : "Add Pro Athlete"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Athlete In-Game Name (IGN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ign}
                    onChange={(e) => setFormData({ ...formData, ign: e.target.value })}
                    placeholder="BEAST"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white uppercase focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Real Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.realName}
                    onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                    placeholder="Akash Sharma"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Combat Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                >
                  <option value="IGL">IGL (In-Game Leader)</option>
                  <option value="RUSHER">RUSHER</option>
                  <option value="SNIPER">SNIPER</option>
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="FRAGGER">FRAGGER</option>
                </select>
              </div>

              {/* Player Image / Photo URL & Cloudinary Device Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300">
                    Player Image / Photo
                  </label>
                  <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-mono">
                    <Cloud className="h-3.5 w-3.5 text-amber-400" />
                    <span>Cloudinary Storage</span>
                  </div>
                </div>

                {/* Hidden file input for device upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="space-y-2.5">
                  {/* Upload from Computer Button */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFBE32]/20 via-[#FFBE32]/10 to-transparent hover:from-[#FFBE32]/30 hover:to-[#FFBE32]/20 border border-[#FFBE32]/50 hover:border-[#FFBE32] text-[#FFBE32] text-xs font-heading font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 shadow-sm"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-[#FFBE32]" />
                          <span>Uploading to Cloudinary...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-[#FFBE32]" />
                          <span>Upload from Computer Device</span>
                        </>
                      )}
                    </button>

                    {uploadStatus && (
                      <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{uploadStatus}</span>
                      </span>
                    )}
                  </div>

                  {/* Image Link Input + Live Thumbnail Preview */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formData.image || formData.avatarUrl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            image: e.target.value,
                            avatarUrl: e.target.value,
                          })
                        }
                        placeholder="Upload file above or paste image URL (e.g. Cloudinary link)"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white font-mono focus:border-[#FFBE32] focus:outline-none"
                      />
                      <span className="block text-[10px] text-gray-500 mt-1 font-body">
                        Stores online in Cloudinary. You can also paste an online link or local preset (e.g. /players/player-beast.jpg).
                      </span>
                    </div>

                    {(formData.image || formData.avatarUrl) && (
                      <div className="h-14 w-12 rounded-lg border border-[#FFBE32]/40 overflow-hidden bg-black shrink-0 shadow-md">
                        <img
                          src={formData.image || formData.avatarUrl}
                          alt="Preview"
                          className="h-full w-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instagram Handle / ID */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Instagram ID / Handle
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <InstagramIcon className="h-4 w-4 text-[#E1306C]" />
                  </div>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@lordz_player or https://instagram.com/..."
                    className="w-full rounded-xl border border-white/15 bg-black/60 pl-9 pr-3.5 py-2 text-sm text-white font-mono focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
              </div>

              {/* About Player (Bio) */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  About the Player (Bio) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.about || formData.featuredQuote}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      about: e.target.value,
                      featuredQuote: e.target.value,
                    })
                  }
                  placeholder="Describe the player's playstyle, background, achievements, and impact on MG Esports..."
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCaptain"
                  checked={formData.isCaptain}
                  onChange={(e) => setFormData({ ...formData, isCaptain: e.target.checked })}
                  className="rounded border-white/20 bg-black accent-[#FFBE32] h-4 w-4 cursor-pointer"
                />
                <label htmlFor="isCaptain" className="text-xs font-heading uppercase text-gray-300 cursor-pointer">
                  Team Captain / IGL Badge
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-white/15 text-xs font-heading font-bold text-gray-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)]"
                >
                  Save Athlete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
