import { apiRequest } from "./client";
import { mediaData, type MediaItem } from "../data/media";

export const MEDIA_STORAGE_KEY = "mg_cached_all_media";
export const DELETED_MEDIA_KEY = "lordz_deleted_media_ids";

export function isExcludedMedia(item?: { title?: string; id?: string } | null): boolean {
  if (!item) return false;
  const t = (item.title || "").toLowerCase();
  const id = (item.id || "").toLowerCase();
  return (
    t.includes("btr") ||
    t.includes("1 v 3") ||
    t.includes("1v3") ||
    t.includes("international lobby") ||
    id.includes("btr")
  );
}


export function getStoredMediaList(): MediaItem[] {
  if (typeof window !== "undefined") {
    try {
      const deletedRaw = localStorage.getItem(DELETED_MEDIA_KEY);
      const deletedIds = deletedRaw ? new Set<string>(JSON.parse(deletedRaw)) : new Set<string>();
      const raw = localStorage.getItem(MEDIA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(
            (m: MediaItem) => m && m.id && !deletedIds.has(m.id) && !isExcludedMedia(m)
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
      return mediaData.filter((m) => !deletedIds.has(m.id) && !isExcludedMedia(m));
    } catch {}
  }
  return mediaData.filter((m) => !isExcludedMedia(m));
}

export function persistStoredMedia(items: MediaItem[]) {
  if (typeof window !== "undefined") {
    try {
      const sanitized = items.filter((m) => !isExcludedMedia(m));
      localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent("mg_media_updated", { detail: sanitized }));
    } catch {}
  }
}

export const mediaApi = {
  getAll: async (type?: string): Promise<MediaItem[]> => {
    const local = getStoredMediaList();
    const filteredLocal = type && type !== "ALL" ? local.filter((m) => m.type === type) : local;
    const query = type && type !== "ALL" ? `?type=${type}` : "";

    try {
      const res = await apiRequest<MediaItem[]>(`/media${query}`, { method: "GET" }, filteredLocal);
      if (Array.isArray(res)) {
        const sanitized = res.filter((m) => !isExcludedMedia(m));
        if (!type || type === "ALL") {
          persistStoredMedia(sanitized);
        }
        return sanitized;
      }
      return filteredLocal;
    } catch {
      return filteredLocal;
    }
  },

  getFeatured: async (): Promise<MediaItem[]> => {
    const local = getStoredMediaList().filter((m) => m.featured || m.tag === "PREMIERE");
    try {
      const res = await apiRequest<MediaItem[]>("/media?featured=true", { method: "GET" }, local);
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
      return local;
    } catch {
      return local;
    }
  },

  create: async (data: Partial<MediaItem>): Promise<MediaItem> => {
    const local = getStoredMediaList();
    const tempId = data.id || `media-${Date.now()}`;
    const newItem: MediaItem = {
      id: tempId,
      title: data.title || "NEW VIDEO",
      type: data.type || "VIDEOS",
      game: data.game || "FREE FIRE MAX",
      youtubeId: data.youtubeId || "o-1d_Ez_LcA",
      thumbnail: data.thumbnail,
      duration: data.duration || "02:30",
      views: data.views || "10K VIEWS",
      date: data.date || "RECENT",
      tag: data.tag || "FEATURED",
      description: data.description,
      featured: data.featured !== undefined ? !!data.featured : true,
    };
    persistStoredMedia([newItem, ...local]);

    try {
      const res = await apiRequest<MediaItem>("/media", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res && res.id) {
        const synced = [res, ...local.filter((m) => m.id !== tempId)];
        persistStoredMedia(synced);
        return res;
      }
      return newItem;
    } catch {
      return newItem;
    }
  },

  update: async (id: string, data: Partial<MediaItem>): Promise<MediaItem> => {
    const local = getStoredMediaList();
    const updated = local.map((m) => (m.id === id ? { ...m, ...data } : m));
    persistStoredMedia(updated);

    try {
      const res = await apiRequest<MediaItem>(`/media/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (res && res.id) {
        const synced = local.map((m) => (m.id === id ? { ...m, ...res } : m));
        persistStoredMedia(synced);
        return res;
      }
      return (updated.find((m) => m.id === id) as MediaItem);
    } catch {
      return (updated.find((m) => m.id === id) || data) as MediaItem;
    }
  },

  delete: async (id: string): Promise<void> => {
    const local = getStoredMediaList();
    const itemToDelete = local.find((m) => m.id === id);
    const updated = local.filter((m) => m.id !== id && !isExcludedMedia(m));
    if (typeof window !== "undefined") {
      try {
        const deletedRaw = localStorage.getItem(DELETED_MEDIA_KEY);
        const deletedIds = deletedRaw ? new Set<string>(JSON.parse(deletedRaw)) : new Set<string>();
        deletedIds.add(id);
        if (itemToDelete?.title) deletedIds.add(itemToDelete.title);
        localStorage.setItem(DELETED_MEDIA_KEY, JSON.stringify(Array.from(deletedIds)));
      } catch {}
    }
    persistStoredMedia(updated);

    try {
      await apiRequest<void>(`/media/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (itemToDelete?.title) {
        await apiRequest<void>(`/media/${encodeURIComponent(itemToDelete.title)}`, { method: "DELETE" }).catch(() => {});
      }
    } catch {}
  },
};
