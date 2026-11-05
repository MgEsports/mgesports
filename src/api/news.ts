import { apiRequest } from "./client";
import { newsData, type NewsArticle } from "../data/news";

export const NEWS_STORAGE_KEY = "mg_cached_news";
export const DELETED_NEWS_KEY = "lordz_deleted_news_ids";

export function getStoredNewsList(): NewsArticle[] {
  if (typeof window !== "undefined") {
    try {
      const deletedRaw = localStorage.getItem(DELETED_NEWS_KEY);
      const deletedIds = deletedRaw ? new Set<string>(JSON.parse(deletedRaw)) : new Set<string>();
      const raw = localStorage.getItem(NEWS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((n: NewsArticle) => n && n.id && !deletedIds.has(n.id));
        }
      }
      return newsData.filter((n) => !deletedIds.has(n.id));
    } catch {}
  }
  return newsData;
}

export function persistStoredNews(items: NewsArticle[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent("mg_news_updated", { detail: items }));
    } catch {}
  }
}

export const newsApi = {
  getAll: async (params?: { category?: string }): Promise<NewsArticle[]> => {
    const local = getStoredNewsList();
    const filteredLocal =
      params?.category && params.category !== "ALL"
        ? local.filter((n) => n.category?.toUpperCase() === params.category?.toUpperCase())
        : local;

    const query = new URLSearchParams();
    if (params?.category && params.category !== "ALL") query.set("category", params.category);
    const qs = query.toString() ? `?${query.toString()}` : "";

    try {
      const res = await apiRequest<NewsArticle[]>(`/news${qs}`, { method: "GET" }, filteredLocal);
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
      return filteredLocal;
    } catch {
      return filteredLocal;
    }
  },

  create: async (data: Partial<NewsArticle>): Promise<NewsArticle> => {
    const local = getStoredNewsList();
    const newArt: NewsArticle = {
      id: data.id || `news-${Date.now()}`,
      title: data.title || "NEWS HEADLINE",
      category: data.category || "TOURNAMENT",
      excerpt: data.excerpt || "",
      content: data.content || data.description || "",
      description: data.description || data.content || "",
      coverImage: data.coverImage || data.image || data.bannerImage || "",
      image: data.image || data.coverImage || "",
      bannerImage: data.bannerImage || data.coverImage || "",
      date: data.date || "RECENT",
      readTime: data.readTime || "3 MIN READ",
      author: data.author || "MG Editorial",
      badgeColor: data.badgeColor || "bg-amber-500/20 text-amber-400 border-amber-500/30",
      featured: data.featured || false,
      slug: data.slug || `news-${Date.now()}`,
    };
    const updated = [newArt, ...local];
    persistStoredNews(updated);

    try {
      const res = await apiRequest<NewsArticle>("/news", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res || newArt;
    } catch {
      return newArt;
    }
  },

  update: async (id: string, data: Partial<NewsArticle>): Promise<NewsArticle> => {
    const local = getStoredNewsList();
    const updated = local.map((n) => (n.id === id ? { ...n, ...data } : n));
    persistStoredNews(updated);

    try {
      const res = await apiRequest<NewsArticle>(`/news/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res || (updated.find((n) => n.id === id) as NewsArticle);
    } catch {
      return (updated.find((n) => n.id === id) || data) as NewsArticle;
    }
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const local = getStoredNewsList();
    const updated = local.filter((n) => n.id !== id);
    if (typeof window !== "undefined") {
      try {
        const deletedRaw = localStorage.getItem(DELETED_NEWS_KEY);
        const deletedIds = deletedRaw ? new Set<string>(JSON.parse(deletedRaw)) : new Set<string>();
        deletedIds.add(id);
        localStorage.setItem(DELETED_NEWS_KEY, JSON.stringify(Array.from(deletedIds)));
      } catch {}
    }
    persistStoredNews(updated);

    try {
      await apiRequest<{ success: boolean }>(`/news/${id}`, {
        method: "DELETE",
      });
    } catch {}
    return { success: true };
  },
};
