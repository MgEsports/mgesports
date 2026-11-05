import React, { useState, useEffect } from "react";
import { newsApi } from "../api/news";
import { adminApi } from "../api/admin";
import { type NewsArticle, newsData } from "../data/news";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Link,
  Check
} from "lucide-react";

const PRESET_BANNERS = [
  {
    label: "Grand Finals Arena",
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Pro Jersey Kit",
    url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "MVP / IGL Battle",
    url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Tier-1 Scrims",
    url: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Championship Trophy",
    url: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1200&q=80",
  },
];

export const AdminNewsPage: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState<Partial<NewsArticle>>({
    title: "",
    category: "TOURNAMENT",
    excerpt: "",
    content: "",
    coverImage: "",
    date: "TODAY",
    readTime: "3 MIN READ",
    author: "MG Editorial",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  });

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await newsApi.getAll();
      setArticles(data);
    } catch {
      setArticles(newsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setFormData({
      title: "",
      category: "TOURNAMENT",
      excerpt: "",
      content: "",
      coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase(),
      readTime: "3 MIN READ",
      author: "MG Editorial",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (art: NewsArticle) => {
    setEditingArticle(art);
    setFormData({
      ...art,
      coverImage: art.coverImage || art.image || art.bannerImage || "",
      content: art.content || art.description || art.excerpt || "",
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await adminApi.uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        coverImage: res.url,
        image: res.url,
      }));
    } catch (err: any) {
      alert(err.message || "Failed to upload image banner");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleFeatured = async (art: NewsArticle) => {
    const nextFeatured = !art.featured;
    try {
      await newsApi.update(art.id, { featured: nextFeatured });
      setArticles((prev) =>
        prev.map((a) => ({
          ...a,
          featured: a.id === art.id ? nextFeatured : false,
        }))
      );
    } catch (err: any) {
      alert(err.message || "Failed to set featured announcement");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const banner = formData.coverImage || formData.image || formData.bannerImage || "";
      const content = formData.content || formData.description || formData.excerpt || "";

      const payload = {
        ...formData,
        coverImage: banner,
        image: banner,
        bannerImage: banner,
        content: content,
        description: content,
        slug: formData.slug || formData.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `news-${Date.now()}`,
      };

      if (editingArticle) {
        await newsApi.update(editingArticle.id, payload);
        setArticles((prev) =>
          prev.map((a) => (a.id === editingArticle.id ? ({ ...a, ...payload } as NewsArticle) : a))
        );
      } else {
        const newArt: NewsArticle = {
          id: `news-${Date.now()}`,
          title: formData.title || "NEWS HEADLINE",
          category: formData.category || "TOURNAMENT",
          excerpt: formData.excerpt || "",
          content: content,
          description: content,
          coverImage: banner,
          image: banner,
          bannerImage: banner,
          date: formData.date || "SEP 2026",
          readTime: formData.readTime || "3 MIN READ",
          author: formData.author || "MG Editorial",
          badgeColor: formData.badgeColor || "bg-amber-500/20 text-amber-400 border-amber-500/30",
          featured: formData.featured || false,
        };
        try {
          await newsApi.create(newArt);
        } catch {
          // fallback optimistic
        }
        setArticles((prev) => [newArt, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save article");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this press article?")) return;
    try {
      await newsApi.delete(id);
    } catch {
      // optimistic
    }
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-white">
            NEWS & EDITORIAL DESK
          </h1>
          <p className="text-xs text-gray-400 font-body">
            Publish organization announcements with high-res banner images, headline summaries, and full press releases.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#FFBE32] hover:bg-[#FFA000] transition-all cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)] shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Announcement</span>
        </button>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse">
          Loading news releases...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => {
            const banner = art.coverImage || art.image || art.bannerImage;
            return (
              <div
                key={art.id}
                className="rounded-2xl bg-[#0C0C10] border border-white/10 hover:border-[#FFBE32]/60 transition-all flex flex-col justify-between group shadow-[0_10px_25px_rgba(0,0,0,0.7)] overflow-hidden"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/60 border-b border-white/5">
                    {banner ? (
                      <img
                        src={banner}
                        alt={art.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-gray-500">
                        <ImageIcon className="h-8 w-8 text-white/20 mb-1" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                          No Banner Image
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C10] via-black/20 to-transparent" />
                    
                    {/* Category Badge floating on banner */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider border shadow-md backdrop-blur-md ${
                          art.badgeColor || "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {art.category}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-3 text-[11px] font-mono text-gray-400 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                      <Calendar className="h-3 w-3 text-[#FFBE32]" /> {art.date}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="font-display text-lg uppercase tracking-wide text-white group-hover:text-[#FFBE32] transition-colors leading-snug line-clamp-2">
                      {art.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="mt-2.5 text-xs text-gray-400 font-body leading-relaxed line-clamp-3">
                      {art.excerpt}
                    </p>

                    {/* Description preview indicator if present */}
                    {(art.content || art.description) && (
                      <div className="mt-3 text-[11px] text-[#FFBE32]/80 font-mono flex items-center gap-1.5 bg-[#FFBE32]/5 px-2.5 py-1 rounded border border-[#FFBE32]/20">
                        <Sparkles className="h-3 w-3" />
                        <span>Full story description attached</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer & Actions */}
                {/* Footer & Actions */}
                <div className="p-5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(art)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all flex items-center gap-1 cursor-pointer ${
                        art.featured
                          ? "bg-[#FFBE32] text-black border-[#FFBE32] font-bold shadow-[0_0_10px_rgba(255,190,50,0.4)]"
                          : "bg-white/5 text-gray-400 border-white/10 hover:border-[#FFBE32]/50 hover:text-[#FFBE32]"
                      }`}
                      title="Click to spotlight this announcement as the full-screen top row banner"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>{art.featured ? "★ Full Row Feature" : "Set as Full Row"}</span>
                    </button>
                    <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      {art.readTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => handleOpenEdit(art)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#FFBE32] cursor-pointer transition-colors"
                      title="Edit Article & Banner"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(art.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 cursor-pointer transition-colors"
                      title="Delete Article"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/40 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h3 className="font-display text-2xl uppercase tracking-wider text-white">
                  {editingArticle ? "Edit Announcement" : "Publish News Announcement"}
                </h3>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  Set banner image, title, summary excerpt, and full announcement story.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* IMAGE BANNER SECTION */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-bold uppercase text-[#FFBE32] flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4" />
                    Announcement Banner Image *
                  </label>
                  {formData.coverImage && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImage: "", image: "" })}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-mono transition-colors"
                    >
                      Remove Banner
                    </button>
                  )}
                </div>

                {/* Banner Live Preview */}
                <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden bg-black/70 border border-white/10 flex items-center justify-center group">
                  {formData.coverImage ? (
                    <>
                      <img
                        src={formData.coverImage}
                        alt="Banner Preview"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                      <div className="absolute bottom-2.5 left-3 text-[10px] font-mono text-amber-300 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm border border-amber-500/20">
                        <Check className="h-3 w-3" /> Live Banner Preview
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                      <ImageIcon className="h-8 w-8 text-white/20 mb-1.5" />
                      <span className="text-xs text-gray-400 font-medium">No banner image selected</span>
                      <span className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Upload from computer or pick a preset below
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload & URL Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* File Upload Button */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="banner-file-input"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="banner-file-input"
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 hover:border-[#FFBE32]/60 bg-white/5 hover:bg-white/10 text-xs font-heading font-bold uppercase tracking-wider text-white transition-all cursor-pointer ${
                        uploadingImage ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <Upload className="h-4 w-4 text-[#FFBE32]" />
                      <span>{uploadingImage ? "Uploading Image..." : "Upload from Device"}</span>
                    </label>
                  </div>

                  {/* Or Direct URL */}
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.coverImage || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, coverImage: e.target.value, image: e.target.value })
                      }
                      placeholder="Or paste banner image URL..."
                      className="w-full rounded-xl border border-white/15 bg-black/60 pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-gray-600 focus:border-[#FFBE32] focus:outline-none"
                    />
                    <Link className="h-3.5 w-3.5 text-gray-500 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#FFBE32]" /> Quick Preset Banners:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_BANNERS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, coverImage: preset.url, image: preset.url })
                        }
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          formData.coverImage === preset.url
                            ? "bg-[#FFBE32]/20 border-[#FFBE32] text-[#FFBE32]"
                            : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* TITLE */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. FLAME OF GLORY S2 GRAND FINALS COMMENCES WITH ₹50,000 AT STAKE"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-medium"
                />
              </div>

              {/* CATEGORY & AUTHOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                  >
                    <option value="TOURNAMENT">TOURNAMENT</option>
                    <option value="TEAM">TEAM</option>
                    <option value="PLAYER">PLAYER</option>
                    <option value="COMMUNITY">COMMUNITY</option>
                    <option value="ESPORTS">ESPORTS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Author / Desk
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="MG Editorial"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
              </div>

              {/* READ TIME & DATE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    placeholder="3 MIN READ"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Publish Date
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="SEP 12, 2026"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
              </div>

              {/* SUMMARY / EXCERPT */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Card Summary / Excerpt *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short briefing displayed on news cards (e.g. 32 of the sharpest mobile esports squads converge...)"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                />
              </div>

              {/* FULL DESCRIPTION / CONTENT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-heading font-bold uppercase text-[#FFBE32]">
                    Full Announcement Story / Description *
                  </label>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Shown when users click "READ →"
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={formData.content || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value, description: e.target.value })
                  }
                  placeholder="Full announcement details, rules, match schedules, player quotes, or prize pool breakdowns..."
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-body leading-relaxed"
                />
              </div>

              {/* SPOTLIGHT TOGGLE */}
              <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-black/40 border border-white/10 hover:border-[#FFBE32]/40 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.featured || false}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded border-white/20 text-[#FFBE32] focus:ring-[#FFBE32] h-4 w-4 bg-black/60 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-heading font-bold uppercase text-white flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#FFBE32]" />
                    Spotlight as Full Screen Top Row Announcement
                  </span>
                  <p className="text-[11px] text-gray-400 font-body">
                    When enabled, this announcement appears full-width across the screen at the top of the news desk.
                  </p>
                </div>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 text-xs font-heading font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#FFBE32] text-black font-heading text-xs font-bold uppercase tracking-wider hover:bg-[#FFA000] transition-all cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)]"
                >
                  {editingArticle ? "Save Changes" : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

