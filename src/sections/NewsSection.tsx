import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "../components/common/SectionHeading";
import { type NewsArticle } from "../data/news";
import { newsApi, getStoredNewsList } from "../api/news";
import { Calendar, Clock, ArrowRight, Sparkles, Filter } from "lucide-react";

interface NewsSectionProps {
  onSelectArticle?: (article: NewsArticle) => void;
  showHeader?: boolean;
}

const CATEGORIES = ["ALL", "TOURNAMENT", "TEAM", "PLAYER", "COMMUNITY", "ESPORTS"];

export const NewsSection = ({
  onSelectArticle,
  showHeader = true,
}: NewsSectionProps) => {
  const [articles, setArticles] = useState<NewsArticle[]>(getStoredNewsList);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    const fetchNews = () => {
      newsApi
        .getAll()
        .then((data) => {
          if (data && data.length > 0) setArticles(data);
        })
        .catch(() => {});
    };

    fetchNews();

    const handleNewsUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setArticles(e.detail);
      } else {
        setArticles(getStoredNewsList());
      }
    };

    window.addEventListener("mg_news_updated", handleNewsUpdated);
    window.addEventListener("storage", handleNewsUpdated);
    window.addEventListener("focus", fetchNews);

    return () => {
      window.removeEventListener("mg_news_updated", handleNewsUpdated);
      window.removeEventListener("storage", handleNewsUpdated);
      window.removeEventListener("focus", fetchNews);
    };
  }, []);

  // Filter articles based on category
  const filtered = articles.filter((art) => {
    if (selectedCategory === "ALL") return true;
    return art.category?.toUpperCase() === selectedCategory;
  });

  // Top featured item: either explicitly marked featured, or the first one in the list
  const featuredArticle = filtered.find((a) => a.featured) || filtered[0];
  const otherArticles = filtered.filter((a) => a.id !== featuredArticle?.id);

  return (
    <section
      id="news"
      className={`relative ${showHeader ? "py-24" : "py-10 sm:py-14"} bg-[#070709] w-full`}
    >
      {/* Full-width container */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
        {showHeader && (
          <div className="mb-10">
            <SectionHeading
              badge="DISPATCHES & REPORTS"
              title="LATEST FROM MG"
              subtitle="Roster movements, tournament announcements, operational updates, and competitive debriefs."
            />
          </div>
        )}

        {/* Category Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-gray-500 mr-2 shrink-0">
              <Filter className="h-3.5 w-3.5 text-[#fc8100]" />
              <span>Filter:</span>
            </div>
            {CATEGORIES.map((cat) => {
              const count =
                cat === "ALL"
                  ? articles.length
                  : articles.filter((a) => a.category?.toUpperCase() === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                    selectedCategory === cat
                      ? "bg-[#fc8100] text-black shadow-[0_0_15px_rgba(252, 129, 0,0.4)]"
                      : "bg-[#0C0C10] text-gray-400 border border-white/10 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      selectedCategory === cat
                        ? "bg-black/20 text-black font-bold"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-gray-500 hidden sm:block">
            Showing <strong className="text-white">{filtered.length}</strong> dispatches
          </div>
        </div>

        {/* 1. THE FEATURED ANNOUNCEMENT — 100% FULL-WIDTH IN THE ROW */}
        {featuredArticle && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            onClick={() => onSelectArticle && onSelectArticle(featuredArticle)}
            className="group relative w-full mb-14 rounded-3xl bg-[#0C0C10] border border-[#fc8100]/40 hover:border-[#fc8100] overflow-hidden cursor-pointer transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:shadow-[0_25px_60px_rgba(252, 129, 0,0.2)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px]">
              {/* Left/Banner Section (7 cols) */}
              <div className="lg:col-span-7 relative overflow-hidden bg-black min-h-[300px] lg:min-h-[440px]">
                <img
                  src={
                    featuredArticle.coverImage ||
                    featuredArticle.image ||
                    featuredArticle.bannerImage ||
                    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
                  }
                  alt={featuredArticle.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 lg:from-transparent via-black/20 to-[#0C0C10]" />

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-[10px] font-heading font-black tracking-widest uppercase bg-[#fc8100] text-black shadow-lg flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> SPOTLIGHT ANNOUNCEMENT
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider border shadow-md backdrop-blur-md ${
                      featuredArticle.badgeColor || "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {featuredArticle.category}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-2 text-xs font-mono text-gray-300 bg-black/80 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                  <Clock className="h-3.5 w-3.5 text-[#fc8100]" />
                  <span>{featuredArticle.readTime}</span>
                  <span>•</span>
                  <span>By {featuredArticle.author}</span>
                </div>
              </div>

              {/* Right/Text Section (5 cols) */}
              <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between bg-gradient-to-br from-[#0C0C10] to-[#08080C]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mb-4">
                    <Calendar className="h-4 w-4 text-[#fc8100]" />
                    <span>{featuredArticle.date}</span>
                    <span>•</span>
                    <span className="text-[#fc8100] uppercase tracking-wider font-bold">Official Editorial</span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl xl:text-4xl uppercase tracking-wide text-white group-hover:text-[#fc8100] transition-colors leading-tight">
                    {featuredArticle.title}
                  </h2>

                  <p className="mt-4 text-sm sm:text-base text-gray-300 font-body leading-relaxed line-clamp-4 sm:line-clamp-5">
                    {featuredArticle.excerpt || featuredArticle.description || featuredArticle.content}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-500 hidden sm:inline">
                    Click to view full press briefing
                  </span>
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#fc8100] text-black font-heading text-xs font-black uppercase tracking-wider group-hover:bg-[#e07200] transition-all shadow-[0_0_20px_rgba(252, 129, 0,0.3)]">
                    <span>READ FULL ANNOUNCEMENT</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. OTHER ANNOUNCEMENTS WITH SCROLL-DOWN ANIMATIONS */}
        {otherArticles.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display text-xl uppercase tracking-wider text-white flex items-center gap-2">
                <span>ALL DISPATCHES & ARCHIVES</span>
                <span className="text-xs font-mono text-gray-500">({otherArticles.length})</span>
              </h3>
              <span className="text-xs font-mono text-gray-500">Scroll down to view recent stories</span>
            </div>

            <div className="space-y-6">
              {otherArticles.map((article, index) => {
                const banner =
                  article.coverImage ||
                  article.image ||
                  article.bannerImage ||
                  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80";

                return (
                  <motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{
                      duration: 0.55,
                      delay: (index % 3) * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onClick={() => onSelectArticle && onSelectArticle(article)}
                    className="group relative w-full rounded-2xl bg-[#0C0C0E] border border-white/10 hover:border-[#fc8100]/70 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-[0_12px_35px_rgba(0,0,0,0.7)] hover:shadow-[0_15px_40px_rgba(252, 129, 0,0.12)]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                      {/* Left: Image Banner (4 columns) */}
                      <div className="md:col-span-4 relative aspect-[16/9] md:aspect-auto overflow-hidden bg-black/70 min-h-[220px]">
                        <img
                          src={banner}
                          alt={article.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 md:from-transparent md:to-[#0C0C0E]" />
                        
                        {/* Category Floating on Banner */}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider border shadow-md backdrop-blur-md ${
                              article.badgeColor || "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {article.category}
                          </span>
                        </div>

                        {/* Read time on mobile */}
                        <div className="absolute bottom-2.5 right-3 md:hidden flex items-center gap-1 text-[11px] text-gray-300 font-mono bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                          <Clock className="h-3 w-3 text-[#fc8100]" />
                          {article.readTime}
                        </div>
                      </div>

                      {/* Right: Info & Description (8 columns) */}
                      <div className="md:col-span-8 p-6 sm:p-7 flex flex-col justify-between">
                        <div>
                          {/* Header metadata */}
                          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2.5">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-[#fc8100]" />
                              {article.date}
                            </span>
                            <span className="hidden md:flex items-center gap-1.5 text-gray-400">
                              <Clock className="h-3.5 w-3.5 text-gray-500" />
                              {article.readTime} • By {article.author}
                            </span>
                          </div>

                          {/* Headline Title */}
                          <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-white group-hover:text-[#fc8100] transition-colors leading-snug">
                            {article.title}
                          </h3>

                          {/* Excerpt / Story description */}
                          <p className="mt-3 text-xs sm:text-sm text-gray-400 font-body leading-relaxed line-clamp-3">
                            {article.excerpt || article.description || article.content}
                          </p>
                        </div>

                        {/* Footer & CTA */}
                        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs">
                          <span className="font-mono text-gray-500 text-[11px]">
                            Official MG ESPORTS Release
                          </span>

                          <span className="font-heading font-bold uppercase tracking-wider text-[#fc8100] group-hover:translate-x-1.5 transition-transform inline-flex items-center gap-1.5">
                            <span>READ FULL DISPATCH</span>
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

