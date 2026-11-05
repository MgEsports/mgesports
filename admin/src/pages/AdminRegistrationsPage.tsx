import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { tournamentsApi } from "../api/tournaments";
import {
  type RegistrationItem,
  type Tournament,
} from "../data/tournaments";
import { formatCurrency } from "../utils/formatters";
import {
  Search,
  Check,
  X,
  Eye,
  FileSpreadsheet,
} from "lucide-react";

export const AdminRegistrationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTourneyId = searchParams.get("tournamentId") || "";

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(initialTourneyId);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection & Details
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeRegDetail, setActiveRegDetail] = useState<RegistrationItem | null>(null);
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  // Load all tournaments for the dropdown selector
  useEffect(() => {
    tournamentsApi
      .getAll()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTournaments(list);
        if (list.length > 0 && !selectedTourneyId) {
          setSelectedTourneyId(list[0].id);
        }
      })
      .catch(() => {
        setTournaments([]);
      });
  }, []);

  // Fetch registrations when filters change
  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const data = await tournamentsApi.getRegistrations({
        tournamentId: selectedTourneyId && selectedTourneyId !== "ALL" ? selectedTourneyId : undefined,
        status: statusFilter,
        paymentStatus: paymentFilter,
        search: searchQuery,
      });
      setRegistrations(data || []);
    } catch {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [selectedTourneyId, statusFilter, paymentFilter, searchQuery]);

  // Selected tournament metadata
  const selectedTournament = tournaments.find((t) => t.id === selectedTourneyId);

  // Handlers
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await tournamentsApi.updateRegistrationStatus(id, newStatus);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      if (activeRegDetail && activeRegDetail.id === id) {
        setActiveRegDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleVerifyPayment = async (id: string) => {
    try {
      await tournamentsApi.verifyPayment(id);
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                paymentStatus: "VERIFIED",
                status: "APPROVED",
                payment: r.payment ? { ...r.payment, status: "VERIFIED" } : null,
              }
            : r
        )
      );
      if (activeRegDetail && activeRegDetail.id === id) {
        setActiveRegDetail((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: "VERIFIED",
                status: "APPROVED",
                payment: prev.payment ? { ...prev.payment, status: "VERIFIED" } : null,
              }
            : null
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to verify payment");
    }
  };

  const handleRejectPayment = async (id: string) => {
    const reason = window.prompt(
      "Enter rejection reason (will be displayed to the user):",
      "Invalid UTR number / Payment proof not found"
    );
    if (!reason || reason.trim() === "") return;

    try {
      await tournamentsApi.rejectPayment(id, reason.trim());
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                paymentStatus: "REJECTED",
                status: "PAYMENT_PENDING",
                payment: r.payment
                  ? { ...r.payment, status: "REJECTED", adminNotes: reason.trim() }
                  : null,
              }
            : r
        )
      );
      if (activeRegDetail && activeRegDetail.id === id) {
        setActiveRegDetail((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: "REJECTED",
                status: "PAYMENT_PENDING",
                payment: prev.payment
                  ? { ...prev.payment, status: "REJECTED", adminNotes: reason.trim() }
                  : null,
              }
            : null
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to reject payment");
    }
  };

  const handleBulkAction = async (action: "APPROVE" | "REJECT" | "VERIFY_PAYMENT") => {
    if (selectedIds.length === 0) return;
    try {
      await tournamentsApi.bulkActionRegistrations(selectedIds, action);
      setRegistrations((prev) =>
        prev.map((r) => {
          if (selectedIds.includes(r.id)) {
            if (action === "APPROVE") return { ...r, status: "APPROVED" };
            if (action === "REJECT") return { ...r, status: "REJECTED" };
            if (action === "VERIFY_PAYMENT") return { ...r, paymentStatus: "VERIFIED" };
          }
          return r;
        })
      );
      setSelectedIds([]);
    } catch (err: any) {
      alert(err.message || "Bulk action failed");
    }
  };

  const handleExportCsv = async () => {
    if (!selectedTourneyId) return;
    try {
      const csv = await tournamentsApi.exportRegistrationsCsv(
        selectedTourneyId,
        undefined,
        statusFilter !== "ALL" ? statusFilter : undefined
      );
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lordz-registrations-${selectedTourneyId}.csv`;
      a.click();
    } catch (err: any) {
      alert(err.message || "Failed to export registrations");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-white">
            SQUAD REGISTRATION DESK
          </h1>
          <p className="text-xs text-gray-400 font-body">
            Review rosters, verify UPI UTR payments, audit anti-cheat requirements, and dispatch slot approvals.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-heading font-bold uppercase tracking-wider text-gray-200 cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-[#FFBE32]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* CORE REQUIREMENT 5: SELECT TOURNAMENT FIRST */}
      <div className="p-5 rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/30 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-gray-400">
              Select Tournament to Manage:
            </span>
            <select
              value={selectedTourneyId}
              onChange={(e) => {
                setSelectedTourneyId(e.target.value);
                setSearchParams({ tournamentId: e.target.value });
              }}
              className="w-full md:w-96 px-4 py-2.5 rounded-xl bg-black border border-white/15 text-sm font-heading font-bold uppercase text-[#FFBE32] cursor-pointer focus:border-[#FFBE32] outline-none"
            >
              <option value="ALL">ALL TOURNAMENTS (COMBINED)</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.game})
                </option>
              ))}
            </select>
          </div>

          {/* Banner Display of "Teams Registered for [TOURNAMENT NAME]" */}
          {selectedTournament && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-6">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  Teams Registered for
                </div>
                <div className="font-display text-lg uppercase text-white">
                  {selectedTournament.title}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold text-[#FFBE32]">
                  {registrations.length}
                </div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-gray-400">
                  TEAMS REGISTERED
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-[#0D0D12] border border-white/10 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Registration Status Pills */}
          {["ALL", "APPROVED", "PENDING", "PAYMENT_PENDING", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-[#FFBE32] text-black shadow-[0_0_10px_rgba(255,190,50,0.3)] font-extrabold"
                  : "bg-black/50 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}

          {/* Payment Status Dropdown */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider bg-black/60 border border-white/10 text-white cursor-pointer"
          >
            <option value="ALL">Payment: All</option>
            <option value="VERIFIED">Verified</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team, captain, phone, UTR..."
            className="w-full rounded-xl border border-white/10 bg-black/60 pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FFBE32] focus:outline-none"
          />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
          <span className="font-heading font-bold text-amber-300">
            {selectedIds.length} squads selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction("APPROVE")}
              className="px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold uppercase text-[11px]"
            >
              Bulk Approve
            </button>
            <button
              onClick={() => handleBulkAction("VERIFY_PAYMENT")}
              className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-bold uppercase text-[11px]"
            >
              Verify Payment
            </button>
            <button
              onClick={() => handleBulkAction("REJECT")}
              className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold uppercase text-[11px]"
            >
              Bulk Reject
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0C0C0E] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs font-heading">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-wider text-gray-400">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={registrations.length > 0 && selectedIds.length === registrations.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(registrations.map((r) => r.id));
                    else setSelectedIds([]);
                  }}
                  className="cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">TEAM / REG NUMBER</th>
              <th className="py-3 px-3">CAPTAIN / LEADER</th>
              <th className="py-3 px-3">PLAYERS</th>
              <th className="py-3 px-3">PAYMENT</th>
              <th className="py-3 px-3">STATUS</th>
              <th className="py-3 px-3">STAGE</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500 font-mono">
                  Loading registrations...
                </td>
              </tr>
            ) : registrations.length > 0 ? (
              registrations.map((reg) => {
                const isSelected = selectedIds.includes(reg.id);
                const isApproved = reg.status === "APPROVED";
                const isPending = reg.status === "PENDING" || reg.status === "UNDER_REVIEW";

                return (
                  <tr
                    key={reg.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isSelected ? "bg-[#FFBE32]/5" : ""
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds((prev) => [...prev, reg.id]);
                          else setSelectedIds((prev) => prev.filter((id) => id !== reg.id));
                        }}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{reg.teamName}</div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {reg.registrationNumber || reg.id}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white font-mono text-xs">{reg.captainIgn}</div>
                      <div className="text-[10px] text-gray-400">
                        {reg.captainName || reg.whatsapp}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-black/60 border border-white/5 text-[11px] text-gray-300 font-mono">
                        {reg.players && reg.players.length > 0
                          ? `${reg.players.length} Players`
                          : reg.playerNames
                          ? `${reg.playerNames.split(",").map((s) => s.trim()).filter(Boolean).length} Players`
                          : "4 Players"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          reg.paymentStatus === "FREE" || reg.paymentStatus === "VERIFIED"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                            : reg.paymentStatus === "SUBMITTED"
                            ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/30"
                            : "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {reg.paymentStatus === "FREE" ? "FREE PRE-ENTRY" : reg.paymentStatus}
                      </span>
                      {reg.payment?.utr && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          UTR: {reg.payment.utr.slice(0, 10)}...
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                            : isPending
                            ? "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                            : "bg-red-950/60 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300">
                        {reg.currentStage?.name || "Round 1"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveRegDetail(reg)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#FFBE32] text-gray-300 hover:text-black border border-white/10 hover:border-[#FFBE32] text-[11px] font-bold uppercase transition-all cursor-pointer"
                        >
                          View
                        </button>
                        {!isApproved && (
                          <button
                            onClick={() => handleUpdateStatus(reg.id, "APPROVED")}
                            title="Approve Registration"
                            className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {reg.status !== "REJECTED" && (
                          <button
                            onClick={() => handleUpdateStatus(reg.id, "REJECTED")}
                            title="Reject Registration"
                            className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-500 font-mono">
                  No squad registrations found for this tournament filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= SQUAD REGISTRATION DETAILS DRAWER ================= */}
      {activeRegDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0D0D12] p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-[#FFBE32]">
                  {activeRegDetail.registrationNumber}
                </span>
                <h3 className="font-display text-2xl uppercase text-white">
                  {activeRegDetail.teamName}
                </h3>
              </div>
              <button
                onClick={() => setActiveRegDetail(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Captain & Contact */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs">
              <div className="text-[10px] uppercase font-bold text-gray-400">Team Leader / Captain Info</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                <div>
                  <span className="text-gray-500 block text-[10px]">Captain IGN:</span>
                  <span className="text-white font-bold">{activeRegDetail.captainIgn}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Full Name:</span>
                  <span className="text-white">{activeRegDetail.captainName || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">WhatsApp:</span>
                  <span className="text-white">{activeRegDetail.whatsapp}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Discord:</span>
                  <span className="text-white">{activeRegDetail.discordTag || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Email:</span>
                  <span className="text-white">{activeRegDetail.captainEmail || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Current Stage:</span>
                  <span className="text-[#FFBE32] font-bold">
                    {activeRegDetail.currentStage?.name || "Round 1"}
                  </span>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-2">
              <div className="text-xs uppercase font-bold text-gray-400">Squad Roster</div>
              <div className="rounded-xl border border-white/10 bg-black/40 divide-y divide-white/5 text-xs font-mono">
                {(() => {
                  const rosterPlayers = (activeRegDetail.players && activeRegDetail.players.length > 0)
                    ? activeRegDetail.players
                    : (activeRegDetail.playerNames ? activeRegDetail.playerNames.split(",").map((s) => s.trim()).filter(Boolean) : []).map((ign, idx) => ({
                        id: `p-${idx}`,
                        ign,
                        name: ign,
                        role: idx === 0 ? "IGL" : "STARTER",
                        isCaptain: idx === 0,
                        isSubstitute: false,
                        playerId: "N/A",
                      }));

                  if (rosterPlayers.length === 0) {
                    return <div className="p-3 text-gray-400">No players listed in roster</div>;
                  }

                  return rosterPlayers.map((p, idx) => (
                    <div key={p.id || idx} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">0{idx + 1}</span>
                        <span className="font-bold text-white">{p.ign}</span>
                        {p.isCaptain && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[#FFBE32] text-[9px] font-bold">
                            IGL
                          </span>
                        )}
                        {p.isSubstitute && (
                          <span className="px-1.5 py-0.2 rounded bg-white/10 text-gray-400 text-[9px]">
                            SUB
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-gray-400 text-[11px]">
                        <span>ID: {p.playerId || "N/A"}</span>
                        <span className="text-amber-400 uppercase">{p.role}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Payment / Pre-Entry Details */}
            {(() => {
              if (activeRegDetail.paymentStatus === "FREE") {
                return (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">FREE PRE-ENTRY SLOT</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">NO PAYMENT REQUIRED</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      This squad registered via free pre-entry reservation. Click Approve Squad below to confirm their slot for Round 1.
                    </p>
                  </div>
                );
              }

              const payment = activeRegDetail.payment;
              const utr = payment?.utr || (activeRegDetail as any).utr || (activeRegDetail as any).paymentUtr;
              const screenshot = payment?.screenshot || (activeRegDetail as any).screenshot || (activeRegDetail as any).paymentScreenshot;
              const amount = payment?.amount ?? (activeRegDetail as any).feeAmount ?? 49;
              const method = payment?.method || "UPI";
              const paymentStatus = payment?.status || activeRegDetail.paymentStatus || "PENDING";

              return (
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Payment Verification Proof
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        paymentStatus === "VERIFIED"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                          : paymentStatus === "SUBMITTED" || paymentStatus === "UNDER_REVIEW"
                          ? "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                          : "bg-red-950/60 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {paymentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono bg-black/40 p-3 rounded-lg border border-white/5">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Fee Amount:</span>
                      <span className="text-[#FFBE32] font-bold text-sm">{formatCurrency(amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Method:</span>
                      <span className="text-white">{method}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">UTR / Transaction:</span>
                      <span className="text-cyan-400 font-bold select-all break-all">
                        {utr || "NOT PROVIDED"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Payer Name:</span>
                      <span className="text-white truncate block">
                        {payment?.payerName || activeRegDetail.captainName || "Athlete"}
                      </span>
                    </div>
                  </div>

                  {payment?.adminNotes && (
                    <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
                      <strong className="text-red-400">Rejection Reason / Note:</strong> {payment.adminNotes}
                    </div>
                  )}

                  {/* Screenshot proof */}
                  <div className="pt-1">
                    {screenshot ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                        <img
                          src={screenshot}
                          alt="Screenshot Proof"
                          onClick={() => setPreviewScreenshot(screenshot)}
                          className="h-16 w-16 object-cover rounded-lg border border-white/20 hover:border-[#FFBE32] cursor-pointer transition-colors shrink-0"
                          title="Click to enlarge"
                        />
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setPreviewScreenshot(screenshot)}
                            className="px-3 py-1.5 rounded-lg bg-[#FFBE32]/20 hover:bg-[#FFBE32] text-[#FFBE32] hover:text-black text-xs font-heading font-bold uppercase transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Payment Screenshot
                          </button>
                          <p className="text-[10px] text-gray-400 font-mono">
                            Click image or button to view proof in full high-resolution.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 font-mono italic">
                        No payment screenshot uploaded. Verification relies on UTR: {utr || "None"}.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {activeRegDetail.payment && activeRegDetail.paymentStatus !== "VERIFIED" && activeRegDetail.paymentStatus !== "FREE" && (
                  <>
                    <button
                      onClick={() => handleVerifyPayment(activeRegDetail.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-heading font-bold text-xs uppercase cursor-pointer border border-emerald-500/30"
                    >
                      Verify Payment ✓
                    </button>
                    <button
                      onClick={() => handleRejectPayment(activeRegDetail.id)}
                      className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-heading font-bold text-xs uppercase cursor-pointer border border-red-500/30"
                    >
                      Reject Payment ✗
                    </button>
                  </>
                )}
                {activeRegDetail.status !== "APPROVED" && (
                  <button
                    onClick={() => handleUpdateStatus(activeRegDetail.id, "APPROVED")}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs uppercase cursor-pointer"
                  >
                    Approve Squad
                  </button>
                )}
                {activeRegDetail.status !== "REJECTED" && (
                  <button
                    onClick={() => handleUpdateStatus(activeRegDetail.id, "REJECTED")}
                    className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-heading font-bold text-xs uppercase cursor-pointer"
                  >
                    Reject Squad
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveRegDetail(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-heading font-bold text-xs uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative max-w-xl w-full rounded-2xl bg-[#0D0D12] border border-white/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-xs font-bold uppercase text-white">
                Payment Screenshot Verification
              </span>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-lg">
              <img
                src={previewScreenshot}
                alt="Payment Screenshot Proof"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
