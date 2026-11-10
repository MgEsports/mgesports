import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { votingApi, type VotingResultsData, type VotingEvent } from "../api/voting";
import {
  ArrowLeft,
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  Archive,
  ExternalLink,
  Loader2,
} from "lucide-react";

export const AdminVotingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<VotingEvent | null>(null);
  const [resultsData, setResultsData] = useState<VotingResultsData | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadEventAndResults = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [ev, res] = await Promise.all([
        votingApi.getById(id),
        votingApi.getResults(id).catch(() => null),
      ]);
      setEventData(ev);
      setResultsData(res);
    } catch (error) {
      console.error("Failed to load voting event details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventAndResults();
  }, [id]);

  const handleStatusTransition = async (
    newStatus: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED"
  ) => {
    if (!id) return;
    setUpdatingStatus(true);
    try {
      await votingApi.updateStatus(id, newStatus);
      await loadEventAndResults();
    } catch (error: any) {
      alert(error?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-[#fc8100] animate-spin mb-3" />
        <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
          Loading voting event analytics...
        </span>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-display text-white uppercase">Voting Event Not Found</h2>
        <Link
          to="/admin/voting"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fc8100] text-black text-xs font-heading font-black uppercase"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Voting Management
        </Link>
      </div>
    );
  }

  const startStr = new Date(eventData.startDate).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const endStr = new Date(eventData.endDate).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalVotes = resultsData?.totalVotes ?? eventData.totalVotes ?? 0;
  const leaderboard = resultsData?.leaderboard ?? [];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/voting"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-0.5">
              <span>Voting Management</span>
              <span>/</span>
              <span className="text-[#fc8100]">Event Analytics</span>
              {eventData.category && (
                <>
                  <span>/</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-black bg-[#fc8100]/15 text-[#fc8100] border border-[#fc8100]/30">
                    {eventData.category.replace("_", " ")}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-wider">
              {eventData.title}
            </h1>
          </div>
        </div>

        {/* Quick Status Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {eventData.status === "DRAFT" && (
            <button
              onClick={() => handleStatusTransition("PUBLISHED")}
              disabled={updatingStatus}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              Publish Event (Live)
            </button>
          )}

          {eventData.status === "PUBLISHED" && (
            <button
              onClick={() => handleStatusTransition("CLOSED")}
              disabled={updatingStatus}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              Close Voting
            </button>
          )}

          {eventData.status === "CLOSED" && (
            <button
              onClick={() => handleStatusTransition("ARCHIVED")}
              disabled={updatingStatus}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              Archive Event
            </button>
          )}

          {/* Direct Public Link */}
          <a
            href="/voting"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fc8100]/10 hover:bg-[#fc8100] text-[#fc8100] hover:text-black font-heading font-bold text-xs uppercase tracking-wider transition-all border border-[#fc8100]/30"
          >
            <span>Public Page</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Overview Cards Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Card */}
        <div className="bg-[#0D0D12] rounded-2xl border border-white/10 p-5">
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400 block mb-2">
            Lifecycle Status
          </span>
          <div className="flex items-center gap-2">
            {eventData.status === "PUBLISHED" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE / ACCEPTING VOTES
              </span>
            ) : eventData.status === "DRAFT" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Clock className="h-3 w-3" />
                DRAFT (UNPUBLISHED)
              </span>
            ) : eventData.status === "CLOSED" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <CheckCircle2 className="h-3 w-3" />
                VOTING CONCLUDED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30">
                <Archive className="h-3 w-3" />
                ARCHIVED
              </span>
            )}
          </div>
        </div>

        {/* Total Votes */}
        <div className="bg-[#0D0D12] rounded-2xl border border-white/10 p-5">
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400 block mb-1">
            Total Community Votes
          </span>
          <p className="text-3xl font-display font-black text-[#fc8100]">
            {totalVotes.toLocaleString()}
          </p>
          <span className="text-[11px] text-gray-500 font-body">Authenticated fan submissions</span>
        </div>

        {/* Nominees Count */}
        <div className="bg-[#0D0D12] rounded-2xl border border-white/10 p-5">
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400 block mb-1">
            Nominated Candidates
          </span>
          <p className="text-3xl font-display font-black text-white">
            {eventData.nominees?.length || leaderboard.length || 0}
          </p>
          <span className="text-[11px] text-gray-500 font-body">Competing for award</span>
        </div>

        {/* Schedule */}
        <div className="bg-[#0D0D12] rounded-2xl border border-white/10 p-5">
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400 block mb-1">
            Voting Window
          </span>
          <div className="text-[11px] font-mono text-gray-300 space-y-0.5">
            <div>
              <strong className="text-gray-400">Open:</strong> {startStr}
            </div>
            <div>
              <strong className="text-gray-400">Close:</strong> {endStr}
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS LEADERBOARD */}
      <div className="bg-[#0D0D12] rounded-2xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#fc8100]/10 border border-[#fc8100]/25 text-[#fc8100]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-black text-white uppercase tracking-wider">
                Live Vote Distribution & Standings
              </h2>
              <p className="text-xs text-gray-400 font-body">
                Deterministic rankings based on verified fan votes received to date.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest block">
              Live Visibility
            </span>
            <span
              className={`text-xs font-heading font-black uppercase ${
                eventData.isLiveResults ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {eventData.isLiveResults ? "Public Live Stream" : "Admin Only (Concealed)"}
            </span>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs font-mono uppercase">
            No nominees registered for this event.
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry) => {
              const isWinner = entry.rank === 1 && entry.votes > 0;
              const displayName = entry.name || entry.player?.ign || "Candidate";
              const roleName = entry.role || entry.player?.role || "CONTENDER";
              const platformOrTeam = entry.platform || entry.team || entry.player?.team || "MG ESPORTS";
              const imgUrl =
                entry.imageUrl ||
                entry.player?.avatarUrl ||
                entry.player?.image ||
                "/players/player-beast.jpg";

              return (
                <div
                  key={entry.nomineeId}
                  className={`p-4 rounded-2xl border transition-all ${
                    isWinner
                      ? "bg-gradient-to-r from-[#fc8100]/15 via-[#121216] to-[#0A0A0D] border-[#fc8100]/60 shadow-[0_0_25px_rgba(252, 129, 0,0.15)]"
                      : "bg-[#121217] border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    {/* Athlete Profile */}
                    <div className="flex items-center gap-3.5">
                      {/* Rank Badge */}
                      <div
                        className={`w-9 h-9 rounded-xl font-display font-black text-sm flex items-center justify-center shrink-0 ${
                          entry.rank === 1
                            ? "bg-[#fc8100] text-black shadow-[0_0_15px_rgba(252, 129, 0,0.4)]"
                            : entry.rank === 2
                            ? "bg-gray-300 text-black"
                            : entry.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-black/60 text-gray-400 border border-white/10"
                        }`}
                      >
                        #{entry.rank}
                      </div>

                      {/* Photo */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                        <img
                          src={imgUrl}
                          alt={displayName}
                          className="h-full w-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>

                      {/* Name & Role */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-black text-sm text-white uppercase tracking-wider">
                            {displayName}
                          </h4>
                          {isWinner && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-heading font-black bg-[#fc8100] text-black uppercase tracking-wider flex items-center gap-1">
                              <Flame className="h-2.5 w-2.5 fill-black" />
                              LEADER
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono">
                          {platformOrTeam} • <span className="text-[#fc8100]">{roleName}</span>
                        </p>
                      </div>
                    </div>

                    {/* Vote Stats */}
                    <div className="flex items-baseline sm:items-end flex-col">
                      <div className="flex items-baseline gap-1.5 font-display">
                        <span className="text-xl font-black text-white">
                          {entry.votes.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 font-mono uppercase">votes</span>
                        <span className="text-sm font-black text-[#fc8100] ml-1">
                          ({entry.percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-black/70 rounded-full h-3 overflow-hidden border border-white/5 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isWinner
                          ? "bg-gradient-to-r from-[#e07200] via-[#fc8100] to-[#FFE082] shadow-[0_0_12px_rgba(252, 129, 0,0.8)]"
                          : "bg-gradient-to-r from-gray-600 to-gray-400"
                      }`}
                      style={{ width: `${Math.max(entry.percentage, entry.votes > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
