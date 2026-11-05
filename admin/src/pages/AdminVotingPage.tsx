import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { votingApi, type VotingEvent } from "../api/voting";
import { adminApi } from "../api/admin";
import {
  Vote,
  Plus,
  Search,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Archive,
  Trash2,
  Edit,
  BarChart3,
  X,
  Flame,
  AlertTriangle,
  Loader2,
  Upload,
  Image as ImageIcon,
  UserPlus,
  Video,
  Trophy,
} from "lucide-react";

interface CandidateDraft {
  id?: string;
  name: string;
  role: string;
  team: string;
  platform?: string;
  imageUrl: string;
  bio: string;
}

export const AdminVotingPage: React.FC = () => {
  const [events, setEvents] = useState<VotingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Upload states
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingCandidateIdx, setUploadingCandidateIdx] = useState<number | null>(null);
  const candidateFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    category: string;
    description: string;
    bannerImage: string;
    startDate: string;
    endDate: string;
    status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
    isLiveResults: boolean;
    nominees: CandidateDraft[];
  }>({
    title: "",
    slug: "",
    category: "BEST_PLAYER",
    description: "",
    bannerImage: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
    isLiveResults: false,
    nominees: [],
  });

  // Delete Dialog State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load Events
  const loadData = async () => {
    setLoading(true);
    try {
      const eventsRes = await votingApi.getAll();
      setEvents(eventsRes || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format date helper for datetime-local inputs
  const toDatetimeLocal = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenCreate = () => {
    setEditingEventId(null);
    setErrorMsg(null);
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    setFormData({
      title: "",
      slug: "",
      category: "BEST_PLAYER",
      description: "",
      bannerImage: "",
      startDate: toDatetimeLocal(now.toISOString()),
      endDate: toDatetimeLocal(nextWeek.toISOString()),
      status: "DRAFT",
      isLiveResults: true,
      nominees: [
        {
          name: "",
          role: "Content Creator",
          team: "YouTube",
          platform: "YouTube",
          imageUrl: "",
          bio: "",
        },
        {
          name: "",
          role: "Esports Athlete",
          team: "MG ESPORTS",
          platform: "Competitive Roster",
          imageUrl: "",
          bio: "",
        },
      ],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = async (event: VotingEvent) => {
    setEditingEventId(event.id);
    setErrorMsg(null);

    try {
      const full = await votingApi.getById(event.id);
      const candidates: CandidateDraft[] =
        full.nominees && full.nominees.length > 0
          ? full.nominees.map((n) => ({
              id: n.id,
              name: n.name || n.player?.ign || "",
              role: n.role || n.player?.role || "CREATOR",
              team: n.platform || n.team || n.player?.team || "MG ESPORTS",
              platform: n.platform || n.team || n.player?.team || "MG ESPORTS",
              imageUrl: n.imageUrl || n.player?.avatarUrl || n.player?.image || "",
              bio: n.bio || n.player?.bio || "",
            }))
          : [
              {
                name: "",
                role: "CREATOR",
                team: "MG ESPORTS",
                platform: "MG ESPORTS",
                imageUrl: "",
                bio: "",
              },
            ];

      setFormData({
        title: full.title,
        slug: full.slug || "",
        category: full.category || "BEST_PLAYER",
        description: full.description || "",
        bannerImage: full.bannerImage || "",
        startDate: toDatetimeLocal(full.startDate),
        endDate: toDatetimeLocal(full.endDate),
        status: full.status,
        isLiveResults: full.isLiveResults,
        nominees: candidates,
      });
    } catch {
      setFormData({
        title: event.title,
        slug: event.slug || "",
        category: event.category || "BEST_PLAYER",
        description: event.description || "",
        bannerImage: event.bannerImage || "",
        startDate: toDatetimeLocal(event.startDate),
        endDate: toDatetimeLocal(event.endDate),
        status: event.status,
        isLiveResults: event.isLiveResults,
        nominees: [
          {
            name: "",
            role: "CREATOR",
            team: "MG ESPORTS",
            platform: "MG ESPORTS",
            imageUrl: "",
            bio: "",
          },
        ],
      });
    }
    setModalOpen(true);
  };

  // Candidate management helpers
  const handleAddCandidate = () => {
    setFormData((prev) => ({
      ...prev,
      nominees: [
        ...prev.nominees,
        {
          name: "",
          role: "RUSHER",
          team: "MG ESPORTS",
          imageUrl: "",
          bio: "",
        },
      ],
    }));
  };

  const handleRemoveCandidate = (index: number) => {
    setFormData((prev) => {
      if (prev.nominees.length <= 1) {
        alert("A voting event must have at least one nominated candidate.");
        return prev;
      }
      return {
        ...prev,
        nominees: prev.nominees.filter((_, idx) => idx !== index),
      };
    });
  };

  const handleCandidateChange = (
    index: number,
    field: keyof CandidateDraft,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.nominees];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, nominees: updated };
    });
  };

  const handleCandidateUpload = async (index: number, file: File) => {
    setUploadingCandidateIdx(index);
    try {
      const res = await adminApi.uploadImage(file);
      setFormData((prev) => {
        const updated = [...prev.nominees];
        updated[index] = { ...updated[index], imageUrl: res.url };
        return { ...prev, nominees: updated };
      });
    } catch (err: any) {
      alert(err?.message || "Failed to upload image. You can also paste an image URL.");
    } finally {
      setUploadingCandidateIdx(null);
    }
  };

  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    try {
      const res = await adminApi.uploadImage(file);
      setFormData((prev) => ({ ...prev, bannerImage: res.url }));
    } catch (err: any) {
      alert(err?.message || "Failed to upload banner image.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg("Please enter an event title.");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setErrorMsg("Please specify both start and end dates.");
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setErrorMsg("End date must be after the start date.");
      return;
    }

    // Validate candidates
    if (formData.nominees.length === 0) {
      setErrorMsg("Please add at least one candidate for this voting event.");
      return;
    }

    const hasEmptyName = formData.nominees.some((c) => !c.name.trim());
    if (hasEmptyName) {
      setErrorMsg("All candidates must have a Player / Candidate Name entered.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || undefined,
        category: formData.category || "BEST_PLAYER",
        description: formData.description.trim() || undefined,
        bannerImage: formData.bannerImage.trim() || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        status: formData.status,
        isLiveResults: formData.isLiveResults,
        nominees: formData.nominees.map((c) => ({
          id: c.id,
          name: c.name.trim(),
          role: c.role.trim() || "CREATOR",
          team: c.platform?.trim() || c.team.trim() || "MG ESPORTS",
          platform: c.platform?.trim() || c.team.trim() || "MG ESPORTS",
          category: formData.category || null,
          imageUrl: c.imageUrl.trim() || null,
          bio: c.bio.trim() || null,
        })),
      };

      if (editingEventId) {
        await votingApi.update(editingEventId, payload);
      } else {
        await votingApi.create(payload);
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save voting event");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED"
  ) => {
    try {
      await votingApi.updateStatus(id, newStatus);
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to update event status");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await votingApi.delete(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete event");
      setDeleteConfirmId(null);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
      const matchesCategory =
        categoryFilter === "ALL" ||
        (e.category || "BEST_PLAYER").toUpperCase() === categoryFilter.toUpperCase();
      const matchesSearch =
        !searchQuery.trim() ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [events, statusFilter, categoryFilter, searchQuery]);

  // KPI Calculations
  const totalEventsCount = events.length;
  const publishedCount = events.filter((e) => e.status === "PUBLISHED").length;
  const totalVotesAcrossAll = events.reduce((acc, curr) => acc + (curr.totalVotes || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-[#FFBE32]/10 border border-[#FFBE32]/30 text-[#FFBE32]">
              <Vote className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider">
              Awards & Voting Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 font-body">
            Manage multi-section awards: Best Creator, Best Player of the Year, and Community Champion polls.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFBE32] to-[#FFA000] text-black font-heading font-black text-xs uppercase tracking-wider hover:shadow-[0_0_25px_rgba(255,190,50,0.4)] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Create Award Section</span>
        </button>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0C0C10] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Total Polls</span>
            <Vote className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-display font-black text-white mt-2">{totalEventsCount}</p>
          <span className="text-[11px] text-gray-500 font-body">Configured voting sections</span>
        </div>

        <div className="bg-[#0C0C10] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">Active / Published</span>
            <Flame className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-display font-black text-emerald-400 mt-2">{publishedCount}</p>
          <span className="text-[11px] text-gray-500 font-body">Currently live and accepting votes</span>
        </div>

        <div className="bg-[#0C0C10] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#FFBE32]">Total Fan Votes</span>
            <Users className="h-5 w-5 text-[#FFBE32]" />
          </div>
          <p className="text-3xl font-display font-black text-[#FFBE32] mt-2">
            {totalVotesAcrossAll.toLocaleString()}
          </p>
          <span className="text-[11px] text-gray-500 font-body">Verified fan submissions recorded</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 bg-[#0A0A0D] p-4 rounded-2xl border border-white/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sections by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#121217] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFBE32]"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(["ALL", "PUBLISHED", "DRAFT", "CLOSED", "ARCHIVED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-[#FFBE32] text-black shadow-[0_0_15px_rgba(255,190,50,0.3)]"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Category / Section Quick Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-white/5 pt-3">
          <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider shrink-0">
            Award Section:
          </span>
          {[
            { id: "ALL", label: "All Sections" },
            { id: "BEST_PLAYER", label: "🏆 Best Player" },
            { id: "BEST_CREATOR", label: "🎬 Best Creator" },
            { id: "COMMUNITY", label: "🛡️ Community" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === cat.id
                  ? "bg-white/20 text-white font-bold border border-white/30"
                  : "bg-white/5 text-gray-400 hover:text-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Card List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-8 w-8 text-[#FFBE32] animate-spin mb-3" />
          <span className="text-xs font-mono uppercase tracking-widest">Loading voting events...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0C0C10] border border-white/10 rounded-2xl text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFBE32]/10 border border-[#FFBE32]/25 flex items-center justify-center text-[#FFBE32]">
            <Vote className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
              No Voting Events Found
            </h3>
            <p className="text-xs text-gray-400 max-w-sm">
              {searchQuery || statusFilter !== "ALL"
                ? "No voting events matched your filter criteria."
                : "Create your first community voting event with custom candidates!"}
            </p>
          </div>
          {!searchQuery && statusFilter === "ALL" && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FFBE32] text-black font-heading font-black text-xs uppercase tracking-wider"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Create Event Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map((event) => {
            const isLive = event.status === "PUBLISHED";
            const isDraft = event.status === "DRAFT";
            const isClosed = event.status === "CLOSED";
            const isArchived = event.status === "ARCHIVED";

            const startStr = new Date(event.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const endStr = new Date(event.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={event.id}
                className={`group p-5 rounded-2xl border transition-all duration-300 ${
                  isLive
                    ? "bg-gradient-to-r from-[#FFBE32]/5 via-[#0D0D12] to-[#0A0A0D] border-[#FFBE32]/40 hover:border-[#FFBE32] shadow-[0_0_20px_rgba(255,190,50,0.08)]"
                    : "bg-[#0C0C10] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left Column: Status Badge & Event Identity */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Section Category Badge */}
                      {event.category === "BEST_CREATOR" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-black bg-purple-500/20 text-purple-400 border border-purple-500/40 uppercase tracking-wider">
                          <Video className="h-3 w-3" />
                          CREATOR AWARD
                        </span>
                      ) : event.category === "COMMUNITY" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
                          <Users className="h-3 w-3" />
                          COMMUNITY CHAMPION
                        </span>
                      ) : event.category === "RISING_STAR" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 uppercase tracking-wider">
                          <Flame className="h-3 w-3" />
                          RISING STAR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-black bg-[#FFBE32]/20 text-[#FFBE32] border border-[#FFBE32]/40 uppercase tracking-wider">
                          <Trophy className="h-3 w-3" />
                          PLAYER AWARD
                        </span>
                      )}

                      {isLive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          LIVE POLL
                        </span>
                      )}
                      {isDraft && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          DRAFT
                        </span>
                      )}
                      {isClosed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3" />
                          CONCLUDED
                        </span>
                      )}
                      {isArchived && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold bg-gray-500/20 text-gray-400 border border-gray-500/40 uppercase tracking-wider">
                          <Archive className="h-3 w-3" />
                          ARCHIVED
                        </span>
                      )}

                      {event.isLiveResults && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 text-[10px] font-mono border border-blue-500/30">
                          LIVE RESULTS VISIBLE
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-wider group-hover:text-[#FFBE32] transition-colors">
                      {event.title}
                    </h3>

                    {event.description && (
                      <p className="text-xs text-gray-400 font-body line-clamp-1 max-w-2xl">
                        {event.description}
                      </p>
                    )}

                    {/* Timeline & Candidates Summary */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        <span>
                          {startStr} — {endStr}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-500" />
                        <span>
                          <strong className="text-white">{event.nomineesCount || 0}</strong> Candidates
                        </span>
                      </div>
                      {event.leadingNominee && (
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <Flame className="h-3.5 w-3.5" />
                          <span>
                            Leader: <strong>{event.leadingNominee.ign}</strong> ({event.leadingNominee.votes} votes)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Vote Metric */}
                  <div className="flex items-center gap-4 lg:border-l lg:border-r border-white/10 lg:px-6 shrink-0">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block">
                        TOTAL VOTES
                      </span>
                      <span className="font-display font-black text-2xl text-[#FFBE32]">
                        {(event.totalVotes || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      to={`/admin/voting/${event.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors"
                      title="View Live Standings & Vote Analytics"
                    >
                      <BarChart3 className="h-3.5 w-3.5 text-[#FFBE32]" />
                      <span>Analytics</span>
                    </Link>

                    <button
                      onClick={() => handleOpenEdit(event)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                      title="Edit Event & Candidates"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {/* Status Dropdown */}
                    <select
                      value={event.status}
                      onChange={(e) => handleStatusChange(event.id, e.target.value as any)}
                      className="px-3 py-1.5 bg-[#14141A] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#FFBE32] cursor-pointer"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISH</option>
                      <option value="CLOSED">CLOSE</option>
                      <option value="ARCHIVED">ARCHIVE</option>
                    </select>

                    <button
                      onClick={() => setDeleteConfirmId(event.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Event"
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

      {/* CREATE / EDIT VOTING EVENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0E0E14] border border-white/15 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#121218]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#FFBE32]/10 border border-[#FFBE32]/30 text-[#FFBE32]">
                  <Vote className="h-5 w-5" />
                </div>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                  {editingEventId ? "Edit Voting Event" : "Create New Voting Event"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMsg && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-body">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Event Title */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                  Award Section / Title <span className="text-[#FFBE32]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BEST CREATOR AWARD 2026 or BEST PLAYER OF THE YEAR"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#14141A] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFBE32]"
                />
              </div>

              {/* Award Section / Category Selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                  Category Type <span className="text-[#FFBE32]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "BEST_PLAYER", label: "Best Player", icon: Trophy },
                    { id: "BEST_CREATOR", label: "Best Creator", icon: Video },
                    { id: "COMMUNITY", label: "Community", icon: Users },
                    { id: "RISING_STAR", label: "Rising Star", icon: Flame },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-heading font-bold uppercase transition-all cursor-pointer ${
                        formData.category === cat.id
                          ? "bg-[#FFBE32] text-black border-[#FFBE32] shadow-[0_0_15px_rgba(255,190,50,0.3)]"
                          : "bg-[#14141A] text-gray-400 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <cat.icon className="h-3.5 w-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                  Description / Subtitle
                </label>
                <textarea
                  rows={2}
                  placeholder="Vote for the champion athlete, viral content creator, or community pillar."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#14141A] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFBE32]"
                />
              </div>

              {/* Banner Image URL / Upload */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                  Banner Image (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="https://... or upload banner image"
                    value={formData.bannerImage}
                    onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                    className="flex-1 px-3.5 py-2 bg-[#14141A] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFBE32]"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-heading font-bold uppercase cursor-pointer shrink-0 transition-colors">
                    {uploadingBanner ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 text-[#FFBE32]" />
                    )}
                    <span>{uploadingBanner ? "Uploading..." : "Upload Banner"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBannerUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Date Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                    Start Date & Time <span className="text-[#FFBE32]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#14141A] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FFBE32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                    End Date & Time <span className="text-[#FFBE32]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#14141A] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FFBE32]"
                  />
                </div>
              </div>

              {/* Status & Live Results Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                    Lifecycle Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-[#14141A] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FFBE32]"
                  >
                    <option value="DRAFT">DRAFT (Hidden from Public)</option>
                    <option value="PUBLISHED">PUBLISHED (Active & Live)</option>
                    <option value="CLOSED">CLOSED (Voting Ended)</option>
                    <option value="ARCHIVED">ARCHIVED (Historical)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 p-2.5 bg-[#14141A] border border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isLiveResults}
                      onChange={(e) => setFormData({ ...formData, isLiveResults: e.target.checked })}
                      className="rounded border-white/20 bg-black text-[#FFBE32] focus:ring-0 focus:ring-offset-0 h-4 w-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-heading font-bold text-white uppercase tracking-wider">
                        Live Public Results
                      </span>
                      <span className="text-[10px] text-gray-400">Show percentage bars to fans while voting</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ======================================================== */}
              {/* CANDIDATES & NOMINEES SECTION (ALL ROLES) */}
              {/* ======================================================== */}
              <div className="border-t border-white/10 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-white font-bold block">
                        Nominees & Candidates (All Roles) <span className="text-[#FFBE32]">*</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#FFBE32]/10 text-[#FFBE32] text-[10px] font-mono border border-[#FFBE32]/30">
                        Open for All
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      Add creators, streamers, esports players, or community members for this section.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCandidate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFBE32]/15 hover:bg-[#FFBE32] text-[#FFBE32] hover:text-black font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-[#FFBE32]/30"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>+ Add Candidate</span>
                  </button>
                </div>

                {/* Candidate List Cards */}
                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {formData.nominees.map((candidate, idx) => {
                    const isUploadingThis = uploadingCandidateIdx === idx;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#121218] border border-white/10 hover:border-white/20 transition-all space-y-3 relative group/cand"
                      >
                        {/* Header: Candidate Index & Delete Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#FFBE32] text-black font-display font-black text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-heading font-bold text-white uppercase tracking-wider">
                              Nominee #{idx + 1}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveCandidate(idx)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove candidate"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Candidate Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          {/* Photo Avatar Preview & Upload */}
                          <div className="md:col-span-3 flex items-center gap-3">
                            <div className="w-16 h-16 rounded-xl bg-black border border-white/15 overflow-hidden shrink-0 flex items-center justify-center relative group">
                              {candidate.imageUrl ? (
                                <img
                                  src={candidate.imageUrl}
                                  alt={candidate.name || "Candidate"}
                                  className="w-full h-full object-cover object-top"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-gray-500" />
                              )}

                              {isUploadingThis && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 text-[#FFBE32] animate-spin" />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => candidateFileInputRefs.current[idx]?.click()}
                                disabled={isUploadingThis}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-200 text-[11px] font-heading font-bold uppercase transition-colors cursor-pointer border border-white/10"
                              >
                                <Upload className="h-3 w-3 text-[#FFBE32]" />
                                <span>Upload</span>
                              </button>
                              <input
                                ref={(el) => {
                                  candidateFileInputRefs.current[idx] = el;
                                }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleCandidateUpload(idx, file);
                                }}
                              />
                              <span className="text-[9px] text-gray-500 font-mono">JPG/PNG</span>
                            </div>
                          </div>

                          {/* Candidate Name & Role & Platform */}
                          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                                Candidate Name / Handle <span className="text-[#FFBE32]">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Frost Gaming / Beast"
                                value={candidate.name}
                                onChange={(e) => handleCandidateChange(idx, "name", e.target.value)}
                                className="w-full px-3 py-1.5 bg-[#171720] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFBE32]"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                                Role / Speciality
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. YouTube Creator / Sniper"
                                value={candidate.role}
                                onChange={(e) => handleCandidateChange(idx, "role", e.target.value)}
                                className="w-full px-3 py-1.5 bg-[#171720] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFBE32]"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                                Platform / Team
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. YouTube / Twitch / Discord"
                                value={candidate.platform || candidate.team}
                                onChange={(e) => {
                                  handleCandidateChange(idx, "platform", e.target.value);
                                  handleCandidateChange(idx, "team", e.target.value);
                                }}
                                className="w-full px-3 py-1.5 bg-[#171720] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFBE32]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Image URL & Optional Bio Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <div>
                            <input
                              type="text"
                              placeholder="Or paste Image URL (https://...)"
                              value={candidate.imageUrl}
                              onChange={(e) => handleCandidateChange(idx, "imageUrl", e.target.value)}
                              className="w-full px-3 py-1.5 bg-[#171720] border border-white/10 rounded-lg text-[11px] text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#FFBE32]"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Candidate bio / notable achievement (optional)"
                              value={candidate.bio}
                              onChange={(e) => handleCandidateChange(idx, "bio", e.target.value)}
                              className="w-full px-3 py-1.5 bg-[#171720] border border-white/10 rounded-lg text-[11px] text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#FFBE32]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Add Button at bottom of candidates list */}
                <button
                  type="button"
                  onClick={handleAddCandidate}
                  className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-[#FFBE32]/60 bg-white/5 hover:bg-[#FFBE32]/5 text-gray-300 hover:text-[#FFBE32] text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Another Candidate (Creator / Player / Community)</span>
                </button>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-heading text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FFBE32] to-[#FFA000] text-black font-heading font-black text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(255,190,50,0.35)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingEventId ? (
                    "Update Event"
                  ) : (
                    "Save & Create Event"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0C0C10] border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h4 className="font-display font-black text-lg text-white uppercase tracking-wider">
                Delete Voting Event?
              </h4>
            </div>
            <p className="text-xs text-gray-400 font-body leading-relaxed">
              Are you sure you want to permanently delete this event? This will delete the voting event, its candidate nominees, and all recorded fan votes.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-heading font-bold uppercase transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-heading font-black uppercase transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
