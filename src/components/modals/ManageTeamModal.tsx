import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { tournamentsApi } from "../../api/tournaments";
import {
  Users,
  UserPlus,
  Trash2,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: any | null;
  teamId?: string;
  teamName?: string;
  initialMembers?: any[];
  rosterLockDate?: string;
  maxPlayers?: number;
  onRosterUpdated?: () => void;
  onTeamUpdated?: () => void;
}

export const ManageTeamModal: React.FC<ManageTeamModalProps> = ({
  isOpen,
  onClose,
  team,
  teamId,
  teamName,
  initialMembers,
  rosterLockDate,
  maxPlayers = 6,
  onRosterUpdated,
  onTeamUpdated,
}) => {
  const resolvedTeam = team || {
    id: teamId || "",
    name: teamName || "",
    members: initialMembers || [],
    tournament: { rosterLockDate },
    maxPlayers,
  };
  const [currentTeam, setCurrentTeam] = useState<any | null>(resolvedTeam);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    if (team) {
      setCurrentTeam(team);
    } else if (teamId) {
      setCurrentTeam({
        id: teamId,
        name: teamName || "",
        members: initialMembers || [],
        tournament: { rosterLockDate },
        maxPlayers,
      });
    }
    setActionError("");
    setActionSuccess("");
  }, [team]);

  if (!currentTeam) return null;

  const isRosterLocked =
    currentTeam.isLocked ||
    (currentTeam.tournament?.rosterLockDate &&
      new Date() > new Date(currentTeam.tournament.rosterLockDate));

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const players = await tournamentsApi.searchPlayers(q, currentTeam.tournament?.id);
      setSearchResults(players || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (userId: string) => {
    setActionError("");
    setActionSuccess("");
    setInviting(true);
    try {
      const res = await tournamentsApi.invitePlayer(currentTeam.id, userId, "STARTER");
      setActionSuccess(res.message || "Invitation sent successfully!");
      setSearchResults([]);
      setSearchQuery("");
      if (onRosterUpdated) onRosterUpdated();
      if (onTeamUpdated) onTeamUpdated();
    } catch (err: any) {
      setActionError(err.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this player from your roster?")) return;
    setActionError("");
    setActionSuccess("");
    try {
      const res = await tournamentsApi.removePlayer(currentTeam.id, memberId);
      setActionSuccess(res.message || "Player removed from roster.");
      setCurrentTeam((prev: any) => ({
        ...prev,
        members: prev.members.filter((m: any) => m.id !== memberId),
      }));
      if (onRosterUpdated) onRosterUpdated();
      if (onTeamUpdated) onTeamUpdated();
    } catch (err: any) {
      setActionError(err.message || "Failed to remove player.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MANAGE TEAM ROSTER"
      subtitle={`${currentTeam.name || currentTeam.teamName || "Squad"} • ${currentTeam.tournament?.title || "Championship"}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Roster Lock Warning / Status */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            isRosterLocked
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-[#FFBE32]/10 border-[#FFBE32]/30 text-[#FFBE32]"
          }`}
        >
          <div className="flex items-center gap-3">
            {isRosterLocked ? (
              <Lock className="h-5 w-5 text-red-400 shrink-0" />
            ) : (
              <Users className="h-5 w-5 text-[#FFBE32] shrink-0" />
            )}
            <div>
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider">
                {isRosterLocked ? "Roster Locked" : "Roster Modifications Active"}
              </h4>
              <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                {isRosterLocked
                  ? "The roster lock deadline has passed. Squad roster is frozen."
                  : currentTeam.tournament?.rosterLockDate
                  ? `Lock Date: ${new Date(currentTeam.tournament.rosterLockDate).toLocaleString()}`
                  : "Modifications allowed until tournament check-in."}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded text-[9px] font-mono font-black uppercase tracking-widest ${
              isRosterLocked
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40"
            }`}
          >
            {isRosterLocked ? "LOCKED" : "OPEN"}
          </span>
        </div>

        {/* Feedback alerts */}
        {actionSuccess && (
          <div className="p-3 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Current Roster Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-heading font-bold uppercase tracking-wider text-gray-400">
            <span>Official Squad Roster ({currentTeam.members?.length || 1} Players)</span>
            {currentTeam.registration?.registrationNumber && (
              <span className="text-[#FFBE32] font-mono">
                ID: {currentTeam.registration.registrationNumber}
              </span>
            )}
          </div>

          <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-black/40 overflow-hidden">
            {currentTeam.members?.map((m: any, idx: number) => {
              const isLeader = m.userId === currentTeam.leader?.id;

              return (
                <div key={m.id || idx} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center font-display text-xs font-black text-white shrink-0">
                      {m.user?.ign?.slice(0, 2).toUpperCase() || `P${idx + 1}`}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-heading font-extrabold text-white uppercase tracking-wider truncate">
                          {m.user?.ign || m.user?.username || `Player ${idx + 1}`}
                        </span>
                        {isLeader ? (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-heading font-black bg-[#FFBE32]/20 text-[#FFBE32] border border-[#FFBE32]/30 uppercase">
                            LEADER (IGL)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-heading font-bold bg-white/10 text-gray-400 uppercase">
                            {m.role || "STARTER"}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-gray-400">
                        @{m.user?.username || "athlete"} {m.user?.gameUid ? `• UID: ${m.user.gameUid}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const status = m.invitationStatus || (isLeader ? "ACCEPTED" : "ACCEPTED");
                      if (status === "PENDING") {
                        return (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#FFBE32] bg-[#FFBE32]/10 border border-[#FFBE32]/30 animate-pulse">
                            INVITED / PENDING
                          </span>
                        );
                      }
                      if (status === "DECLINED") {
                        return (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/30">
                            DECLINED
                          </span>
                        );
                      }
                      return (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30">
                          ACCEPTED
                        </span>
                      );
                    })()}

                    {!isLeader && !isRosterLocked && (
                      <button
                        type="button"
                        onClick={() => handleRemove(m.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer border border-red-500/20"
                        title="Remove player"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Invitations list */}
          {currentTeam.pendingInvitations && currentTeam.pendingInvitations.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#FFBE32]">
                Pending Team Invitations ({currentTeam.pendingInvitations.length})
              </div>
              <div className="divide-y divide-white/5 rounded-xl border border-[#FFBE32]/20 bg-[#FFBE32]/5 overflow-hidden">
                {currentTeam.pendingInvitations.map((inv: any) => (
                  <div key={inv.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-heading font-bold text-white uppercase">
                        {inv.invitedUser?.ign || inv.invitedUser?.username || "Invited Athlete"}
                      </span>
                      <p className="text-[10px] font-mono text-gray-400">
                        @{inv.invitedUser?.username} • Sent {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#FFBE32] bg-[#FFBE32]/10 border border-[#FFBE32]/30 animate-pulse">
                      PENDING ACCEPTANCE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search & Invite Players (if not locked) */}
        {!isRosterLocked && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#FFBE32]" />
              Invite Teammates
            </h4>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search players by username, IGN, or Game UID..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-[#0D0D10] border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-[#FFBE32] transition-colors"
              />
              {searching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#FFBE32] border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="rounded-xl border border-white/15 bg-[#0A0A0D] divide-y divide-white/5 max-h-48 overflow-y-auto">
                {searchResults.map((player) => (
                  <div
                    key={player.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-heading font-bold text-white uppercase">
                          {player.ign || player.username}
                        </span>
                        {player.gameUid && (
                          <span className="text-[10px] font-mono text-gray-400">
                            (UID: {player.gameUid})
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-gray-400">@{player.username}</p>
                    </div>

                    {(() => {
                      const isMember = currentTeam.members?.some((m: any) => m.userId === player.id || m.user?.id === player.id);
                      const isAlreadyInOther = player.isRegisteredInTournament;
                      const disabled = inviting || isMember || isAlreadyInOther;

                      return (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleInvite(player.id)}
                          className={`px-3 py-1 rounded text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                            disabled
                              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                              : "bg-[#FFBE32] hover:bg-[#FFA000] text-black cursor-pointer shadow-[0_0_10px_rgba(255,190,50,0.3)]"
                          }`}
                        >
                          {isMember ? "In Squad" : isAlreadyInOther ? "In Other Team" : "Invite"}
                        </button>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
