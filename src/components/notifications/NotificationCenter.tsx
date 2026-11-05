import React, { useState, useEffect, useRef, useCallback } from "react";
import { tournamentsApi } from "../../api/tournaments";
import {
  Bell,
  Check,
  X,
  Shield,
  Clock,
  AlertCircle,
  Trophy,
  CheckCheck,
} from "lucide-react";
import confetti from "canvas-confetti";

interface NotificationCenterProps {
  onNotificationAction?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"INVITATIONS" | "ALERTS">("INVITATIONS");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await tournamentsApi.getNotifications();
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setPendingInvitations(data.pendingInvitations || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await tournamentsApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await tournamentsApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleRespondInvitation = async (invitationId: string, action: "ACCEPT" | "REJECT") => {
    setRespondingId(invitationId);
    try {
      await tournamentsApi.respondToInvitation(invitationId, action);
      if (action === "ACCEPT") {
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.7 },
          colors: ["#FFBE32", "#22C55E", "#FFFFFF"],
        });
      }
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      await fetchNotifications();
      if (onNotificationAction) onNotificationAction();
    } catch (err: any) {
      alert(err.message || "Failed to respond to invitation");
    } finally {
      setRespondingId(null);
    }
  };

  const totalBadge = unreadCount + pendingInvitations.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-full border border-white/10 bg-[#0C0C0E]/90 hover:border-[#FFBE32]/60 hover:bg-[#151518] transition-all cursor-pointer text-gray-300 hover:text-white"
        title="Notifications & Invitations"
        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4" />
        {totalBadge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFBE32] text-[9px] font-mono font-black text-black shadow-[0_0_10px_rgba(255,190,50,0.6)] animate-pulse">
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-[#FFBE32]/30 bg-[#0A0A0D]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_25px_rgba(255,190,50,0.15)] z-[8500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div>
              <h3 className="font-display text-sm tracking-wider uppercase text-white flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-[#FFBE32]" />
                Tournament Alerts
              </h3>
              <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                {pendingInvitations.length} Invitations • {unreadCount} Unread
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] font-heading font-bold text-[#FFBE32] hover:text-[#FFA000] flex items-center gap-1 cursor-pointer transition-colors uppercase"
              >
                <CheckCheck className="h-3 w-3" />
                Read All
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-black/30 text-xs font-heading font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setActiveTab("INVITATIONS")}
              className={`flex-1 py-2.5 text-center transition-all cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "INVITATIONS"
                  ? "border-[#FFBE32] text-[#FFBE32] bg-[#FFBE32]/5"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <span>Invitations</span>
              {pendingInvitations.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black bg-[#FFBE32] text-black">
                  {pendingInvitations.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ALERTS")}
              className={`flex-1 py-2.5 text-center transition-all cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "ALERTS"
                  ? "border-[#FFBE32] text-[#FFBE32] bg-[#FFBE32]/5"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black bg-white/20 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {activeTab === "INVITATIONS" && (
              <>
                {pendingInvitations.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <Shield className="h-8 w-8 text-gray-600 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-heading text-gray-400 uppercase tracking-wider">
                      No Pending Invitations
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                      When a Team Leader invites you to a tournament squad, it will appear here.
                    </p>
                  </div>
                ) : (
                  pendingInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 bg-gradient-to-r from-[#FFBE32]/5 to-transparent hover:bg-white/5 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#FFBE32] bg-[#FFBE32]/15 px-2 py-0.5 rounded border border-[#FFBE32]/30">
                            TOURNAMENT INVITATION
                          </span>
                          <h4 className="font-display text-sm uppercase tracking-wider text-white mt-1.5 truncate">
                            {inv.team?.teamName || "Squad"}
                          </h4>
                          <p className="text-xs text-gray-300 font-medium truncate mt-0.5">
                            {inv.team?.tournament?.title || "Tournament"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-gray-400">
                            <span>Invited by:</span>
                            <span className="text-white font-bold">
                              @{inv.invitedBy?.ign || inv.invitedBy?.username}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={respondingId === inv.id}
                          onClick={() => handleRespondInvitation(inv.id, "ACCEPT")}
                          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-heading font-bold uppercase tracking-wider bg-[#22C55E] hover:bg-[#16A34A] text-black flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.3)] transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          disabled={respondingId === inv.id}
                          onClick={() => handleRespondInvitation(inv.id, "REJECT")}
                          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-heading font-bold uppercase tracking-wider bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-300 flex items-center justify-center gap-1.5 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "ALERTS" && (
              <>
                {notifications.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-heading text-gray-400 uppercase tracking-wider">
                      No Notifications Yet
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                      Updates regarding payment verifications and registrations will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isRejected = item.type === "PAYMENT_REJECTED";
                    const isVerified =
                      item.type === "PAYMENT_VERIFIED" || item.type === "REGISTRATION_CONFIRMED";

                    return (
                      <div
                        key={item.id}
                        onClick={() => !item.read && handleMarkRead(item.id)}
                        className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 ${
                          item.read
                            ? "bg-transparent opacity-75 hover:opacity-100"
                            : "bg-white/[0.04] border-l-2 border-[#FFBE32]"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isVerified ? (
                            <div className="w-6 h-6 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center">
                              <Trophy className="h-3.5 w-3.5" />
                            </div>
                          ) : isRejected ? (
                            <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                              <AlertCircle className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#FFBE32]/20 text-[#FFBE32] flex items-center justify-center">
                              <Bell className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-heading font-bold text-white uppercase tracking-wider truncate">
                              {item.title}
                            </h5>
                            <span className="text-[9px] font-mono text-gray-500 shrink-0">
                              {new Date(item.createdAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-300 font-body mt-0.5 leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
