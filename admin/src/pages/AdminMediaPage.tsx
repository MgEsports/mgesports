import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/client";
import { mediaData, type MediaItem } from "../data/media";
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Star,
  Flame,
  X
} from "lucide-react";

function extractYouTubeId(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : trimmed;
}

const DELETED_MEDIA_KEY = "lordz_deleted_media_ids";
const MEDIA_STORAGE_KEY = "mg_cached_all_media";

function getDeletedMediaIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_MEDIA_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function markMediaIdDeleted(id: string) {
  try {
    const ids = getDeletedMediaIds();
    ids.add(id);
    localStorage.setItem(DELETED_MEDIA_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function unmarkMediaIdDeleted(id: string) {
  try {
    const ids = getDeletedMediaIds();
    ids.delete(id);
    localStorage.setItem(DELETED_MEDIA_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function getStoredMedia(): MediaItem[] {
  try {
    const raw = localStorage.getItem(MEDIA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return mediaData;
}

function persistMedia(items: MediaItem[]) {
  try {
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("mg_media_updated", { detail: items }));
  } catch {}
}

export const AdminMediaPage: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const [formData, setFormData] = useState<Partial<MediaItem>>({
    title: "",
    type: "VIDEOS",
    game: "FREE FIRE MAX",
    youtubeId: "o-1d_Ez_LcA",
    duration: "02:30",
    views: "10K VIEWS",
    tag: "FEATURED",
    description: "",
    featured: true,
  });

  const loadMedia = async () => {
    setLoading(true);
    const deletedIds = getDeletedMediaIds();
    // 1. Instantly load from local storage cache or fallback data
    const localItems = getStoredMedia().filter((m) => !deletedIds.has(m.id));
    setMedia(localItems);

    // 2. Fetch fresh from backend if server is active
    try {
      const data = await apiRequest<MediaItem[]>("/media", { method: "GET" });
      if (Array.isArray(data) && data.length > 0) {
        const items = data.filter((m) => !deletedIds.has(m.id));
        setMedia(items);
        persistMedia(items);
      }
    } catch {
      // Backend is offline or proxy 502; localItems already active
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      type: "VIDEOS",
      game: "FREE FIRE MAX",
      youtubeId: "",
      duration: "02:30",
      views: "15K VIEWS",
      tag: "FEATURED",
      featured: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (m: MediaItem) => {
    setEditingItem(m);
    setFormData(m);
    setModalOpen(true);
  };

  const handleToggleFeatured = async (m: MediaItem) => {
    const updatedFeatured = !m.featured;
    const nextMedia = media.map((item) =>
      item.id === m.id ? { ...item, featured: updatedFeatured } : item
    );
    setMedia(nextMedia);
    persistMedia(nextMedia);

    try {
      await apiRequest(`/media/${m.id}`, {
        method: "PUT",
        body: JSON.stringify({ featured: updatedFeatured }),
      });
    } catch (err: any) {
      console.warn("Media featured sync notice (saved locally):", err?.message);
    }
  };

  const handleSetPremiere = async (m: MediaItem) => {
    const nextMedia = media.map((item) =>
      item.id === m.id
        ? { ...item, tag: "PREMIERE" }
        : item.tag === "PREMIERE"
        ? { ...item, tag: "FEATURED" }
        : item
    );
    setMedia(nextMedia);
    persistMedia(nextMedia);

    try {
      await apiRequest(`/media/${m.id}`, {
        method: "PUT",
        body: JSON.stringify({ tag: "PREMIERE" }),
      });
    } catch (err: any) {
      console.warn("Media premiere sync notice (saved locally):", err?.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanYtId = extractYouTubeId(formData.youtubeId);
    const thumbnail =
      formData.thumbnail && !formData.thumbnail.includes("youtube.com/vi/")
        ? formData.thumbnail
        : (cleanYtId ? `https://img.youtube.com/vi/${cleanYtId}/hqdefault.jpg` : undefined);
    const chosenTag = formData.tag || "FEATURED";

    const payload: Partial<MediaItem> = {
      title: formData.title?.trim() || "NEW VIDEO",
      type: formData.type || "VIDEOS",
      game: formData.game || "FREE FIRE MAX",
      youtubeId: cleanYtId || "o-1d_Ez_LcA",
      thumbnail,
      duration: formData.duration || "02:30",
      views: formData.views || "10K VIEWS",
      date: formData.date || "RECENT",
      tag: chosenTag,
      description: formData.description || undefined,
      featured: formData.featured !== undefined ? !!formData.featured : true,
    };

    let tempId = `media-${Date.now()}`;
    let nextMedia: MediaItem[];

    if (editingItem) {
      nextMedia = media.map((item) => {
        if (item.id === editingItem.id) {
          return { ...item, ...payload } as MediaItem;
        }
        if (chosenTag === "PREMIERE" && item.tag === "PREMIERE") {
          return { ...item, tag: "FEATURED" };
        }
        return item;
      });
    } else {
      const finalItem: MediaItem = {
        id: tempId,
        ...(payload as any),
      };
      unmarkMediaIdDeleted(finalItem.id);
      nextMedia = [
        finalItem,
        ...media.map((item) =>
          chosenTag === "PREMIERE" && item.tag === "PREMIERE"
            ? { ...item, tag: "FEATURED" }
            : item
        ),
      ];
    }

    setMedia(nextMedia);
    persistMedia(nextMedia);
    setModalOpen(false);

    try {
      if (editingItem) {
        const resItem = await apiRequest<MediaItem>(`/media/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (resItem && resItem.id) {
          const synced = nextMedia.map((m) => (m.id === editingItem.id ? { ...m, ...resItem } : m));
          setMedia(synced);
          persistMedia(synced);
        }
      } else {
        const resItem = await apiRequest<MediaItem>("/media", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (resItem && resItem.id) {
          const synced = nextMedia.map((m) => (m.id === tempId ? resItem : m));
          setMedia(synced);
          persistMedia(synced);
        }
      }
    } catch (err: any) {
      console.error("Media save sync error:", err);
      alert("Failed to save to live server database: " + (err?.message || "Check connection"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) return;
    const nextMedia = media.filter((m) => m.id !== id);
    setMedia(nextMedia);
    persistMedia(nextMedia);
    markMediaIdDeleted(id);

    try {
      await apiRequest(`/media/${id}`, { method: "DELETE" });
    } catch (err: any) {
      console.error("Media delete error on server:", err);
      alert("Failed to delete from live server database: " + (err?.message || "Check connection"));
    }
  };

  const filteredMedia = media.filter((m) => {
    if (typeFilter === "ALL") return true;
    if (typeFilter === "BIG PREMIERE") return m.tag === "PREMIERE";
    if (typeFilter === "MAIN WEBSITE") return m.featured;
    return m.type === typeFilter;
  });

  const previewId = extractYouTubeId(formData.youtubeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-white">
            VIDEO HIGHLIGHTS & MEDIA HUB
          </h1>
          <p className="text-xs text-gray-400 font-body">
            Curate YouTube videos, choose what displays on the homepage, and select the Big Featured Premiere banner video.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#FFBE32] hover:bg-[#FFA000] transition-all cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)] shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Media Item</span>
        </button>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "BIG PREMIERE", "MAIN WEBSITE", "VIDEOS", "HIGHLIGHTS", "PHOTOS", "SHORTS"].map((tf) => (
          <button
            key={tf}
            onClick={() => setTypeFilter(tf)}
            className={`px-4 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
              typeFilter === tf
                ? "bg-[#FFBE32] text-black shadow-[0_0_10px_rgba(255,190,50,0.3)] font-extrabold"
                : "bg-black/50 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            {tf === "BIG PREMIERE" ? "🔥 BIG PREMIERE" : tf === "MAIN WEBSITE" ? "★ ON MAIN WEBSITE" : tf}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse">
          Loading media library...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredMedia.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl bg-[#0C0C10] border border-white/10 hover:border-[#FFBE32]/60 transition-all flex flex-col group shadow-[0_10px_25px_rgba(0,0,0,0.7)] overflow-hidden"
            >
              {/* Video Thumbnail */}
              <div className="aspect-video w-full bg-black relative overflow-hidden">
                {m.thumbnail || m.youtubeId ? (
                  <img
                    src={m.thumbnail || `https://img.youtube.com/vi/${extractYouTubeId(m.youtubeId)}/hqdefault.jpg`}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : null}

                {/* Vignette & play button */}
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-[#FFBE32] text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Floating Top Left Badges: Type + Big Premiere */}
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-black/80 border border-white/15 text-[10px] font-heading font-bold text-[#FFBE32] uppercase backdrop-blur-md">
                    {m.type}
                  </span>
                  {m.tag === "PREMIERE" && (
                    <span className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-heading font-bold uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(239,68,68,0.6)] backdrop-blur-md">
                      <Flame className="h-3 w-3 fill-current" />
                      Big Premiere
                    </span>
                  )}
                </div>

                {/* Floating Top Right Buttons */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                  {m.tag !== "PREMIERE" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPremiere(m);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-heading font-bold uppercase tracking-wider transition-all cursor-pointer backdrop-blur-md bg-black/80 border border-white/20 text-gray-300 hover:text-red-400 hover:border-red-500/50"
                      title="Set as the Big Featured Premiere Video on Media Hub"
                    >
                      <Flame className="h-3 w-3 text-red-500" />
                      <span>Set Big Video</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFeatured(m);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-heading font-bold uppercase tracking-wider transition-all cursor-pointer backdrop-blur-md ${
                      m.featured
                        ? "bg-[#FFBE32] text-black shadow-[0_0_12px_rgba(255,190,50,0.45)]"
                        : "bg-black/80 border border-white/20 text-gray-300 hover:text-white hover:border-white/40"
                    }`}
                    title={m.featured ? "Click to remove from main website" : "Click to display on main website"}
                  >
                    <Star className={`h-3 w-3 ${m.featured ? "fill-current text-black" : ""}`} />
                    <span>{m.featured ? "On Main Website" : "Show on Website"}</span>
                  </button>
                </div>

                {/* Duration Badge */}
                {m.duration && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono text-white border border-white/15">
                    {m.duration}
                  </span>
                )}
              </div>

              {/* Title & Actions Only - Tight & Snug without Empty Space or Description */}
              <div className="p-4 flex items-center justify-between gap-3 bg-[#0C0C10]">
                <h3 className="font-display text-base uppercase tracking-wider text-white group-hover:text-[#FFBE32] transition-colors line-clamp-2 leading-snug font-bold flex-1">
                  {m.title}
                </h3>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-[#FFBE32] cursor-pointer transition-colors"
                    title="Edit Media"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 cursor-pointer transition-colors"
                    title="Delete Media"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/40 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h3 className="font-display text-2xl uppercase tracking-wider text-white">
                {editingItem ? "Edit Media Item" : "Add Media Video / Clip"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="FLAME OF GLORY S2 • OFFICIAL TRAILER"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Media Category
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                >
                  <option value="VIDEOS">VIDEOS</option>
                  <option value="HIGHLIGHTS">HIGHLIGHTS</option>
                  <option value="SHORTS">SHORTS</option>
                  <option value="PHOTOS">PHOTOS</option>
                </select>
              </div>

              {/* YouTube Video Link Input */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  YouTube Video Link or ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.youtubeId || ""}
                  onChange={(e) => setFormData({ ...formData, youtubeId: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/... or ID"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Paste any YouTube URL (Watch link, Shorts link, Share link, or direct Video ID).
                </p>

                {/* Live Video Preview in Modal */}
                {previewId ? (
                  <div className="mt-3 p-3 rounded-xl bg-black/70 border border-[#FFBE32]/35 flex items-center gap-3">
                    <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                      <img
                        src={`https://img.youtube.com/vi/${previewId}/hqdefault.jpg`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <Play className="h-4 w-4 text-[#FFBE32] fill-current" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-heading font-bold">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Connected to YouTube</span>
                      </div>
                      <p className="font-mono text-[11px] text-gray-300 truncate mt-0.5">
                        Video ID: <span className="text-[#FFBE32] font-bold">{previewId}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Will stream in 1080p directly on the website
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-400/90 mt-1.5">
                    ⚠️ Enter a YouTube link to stream this video on the website.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Duration Display
                </label>
                <input
                  type="text"
                  value={formData.duration || ""}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="02:45"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                />
              </div>

              {/* Display on Main Website Toggle Switch */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/15 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Star className={`h-4 w-4 ${formData.featured ? "text-[#FFBE32] fill-current" : "text-gray-400"}`} />
                    <span className="text-xs font-heading font-bold uppercase text-white">
                      Display on Main Website
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-body mt-0.5">
                    Showcase this video in the Video Highlights section on the MG Esports homepage.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFBE32] peer-checked:after:bg-black"></div>
                </label>
              </div>

              {/* Set as Big Premiere Video Toggle Switch */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/15 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Flame className={`h-4 w-4 ${formData.tag === "PREMIERE" ? "text-red-500 fill-current" : "text-gray-400"}`} />
                    <span className="text-xs font-heading font-bold uppercase text-white">
                      Set as Big Premiere Video
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-body mt-0.5">
                    Showcase this video in the large cinematic hero banner at the top of the Media Hub.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.tag === "PREMIERE"}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.checked ? "PREMIERE" : "FEATURED" })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-white/15 text-xs font-heading font-bold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#FFBE32] text-black font-heading text-xs font-bold uppercase tracking-wider"
                >
                  Save Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
