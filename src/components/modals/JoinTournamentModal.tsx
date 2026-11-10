import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { GoldButton } from "../common/GoldButton";
import { CheckCircle2, Trophy, Shield, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { tournamentsApi } from "../../api/tournaments";

interface JoinTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentTitle?: string;
  game?: string;
  prizePool?: string;
  tournamentId?: string;
  entryFee?: string;
  feeAmount?: number;
  upiId?: string;
}

export const JoinTournamentModal = ({
  isOpen,
  onClose,
  tournamentTitle = "FLAME OF GLORY S2",
  game = "FREE FIRE MAX",
  prizePool = "₹50,000",
  tournamentId = "fog-season-2",
  entryFee = "FREE PRE-ENTRY",
}: JoinTournamentModalProps) => {
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainIgn, setCaptainIgn] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [discordTag, setDiscordTag] = useState("");

  const [player2, setPlayer2] = useState({ ign: "", role: "Rusher" });
  const [player3, setPlayer3] = useState({ ign: "", role: "Support" });
  const [player4, setPlayer4] = useState({ ign: "", role: "Sniper" });
  const [substitute, setSubstitute] = useState({ ign: "", role: "Sub" });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regResult, setRegResult] = useState<{ number: string; status: string } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!teamName || !captainIgn || !whatsapp) {
      setError("Please fill required fields (Team Name, Captain IGN, WhatsApp).");
      return;
    }

    setSubmitting(true);
    try {
      const playersList = [
        { name: captainName || captainIgn, ign: captainIgn, role: "IGL", isCaptain: true, isSubstitute: false },
        { name: player2.ign || "Player 2", ign: player2.ign || "PLAYER_02", role: player2.role, isCaptain: false, isSubstitute: false },
        { name: player3.ign || "Player 3", ign: player3.ign || "PLAYER_03", role: player3.role, isCaptain: false, isSubstitute: false },
        { name: player4.ign || "Player 4", ign: player4.ign || "PLAYER_04", role: player4.role, isCaptain: false, isSubstitute: false },
      ];

      if (substitute.ign.trim()) {
        playersList.push({
          name: substitute.ign,
          ign: substitute.ign,
          role: "Substitute",
          isCaptain: false,
          isSubstitute: true,
        });
      }

      const res = await tournamentsApi.registerSquad(tournamentId, {
        teamName,
        captainName: captainName || captainIgn,
        captainIgn,
        whatsapp,
        discordTag,
        players: playersList,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#fc8100", "#FFD700", "#FFFFFF"],
      });

      setRegResult({
        number: res.data?.registrationNumber || `LZ-${tournamentId.slice(0, 3).toUpperCase()}-REG`,
        status: res.data?.status || "PRE-ENTRY RESERVED",
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please verify your information.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setTeamName("");
    setCaptainName("");
    setCaptainIgn("");
    setWhatsapp("");
    setDiscordTag("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="TOURNAMENT ENTRY"
      subtitle={`Register squad for ${tournamentTitle}`}
      maxWidth="lg"
    >
      {submitted ? (
        <div className="py-8 text-center flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-[#fc8100]/20 border border-[#fc8100] flex items-center justify-center text-[#fc8100] mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h4 className="font-display text-3xl uppercase text-white">PRE-ENTRY RESERVED!</h4>
          <p className="mt-2 text-sm text-[#9CA3AF] max-w-sm">
            Squad <span className="text-[#fc8100] font-semibold">{teamName}</span> has been pre-registered for {tournamentTitle}. The MG ESPORTS Admin desk has been notified!
          </p>
          <div className="mt-4 p-3.5 rounded-xl border border-white/10 bg-black/60 text-xs text-left w-full space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">Registration ID:</span>
              <span className="text-[#fc8100] font-bold">{regResult?.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-emerald-400 font-bold">{regResult?.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Dispatch WhatsApp:</span>
              <span className="text-white">{whatsapp}</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-gray-400 max-w-sm text-center">
            Our admin team will review your squad roster. Official match room ID and password will be shared with your Captain on WhatsApp before match start.
          </p>
          <div className="mt-6 flex gap-3">
            <GoldButton onClick={handleReset}>Close</GoldButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold">
              {error}
            </div>
          )}

          {/* Tournament Quick Spec */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#fc8100]/10 border border-[#fc8100]/30 flex items-center justify-center text-[#fc8100]">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <span className="font-heading font-bold text-white uppercase text-sm block">
                  {tournamentTitle}
                </span>
                <span className="text-[10px] text-gray-400">{game}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase block font-mono">Prize Pool</span>
              <span className="font-display text-base text-[#fc8100] font-bold">{prizePool}</span>
            </div>
          </div>

          {/* Free Pre-Entry Badge */}
          <div className="p-3 rounded-xl bg-[#0D0D12] border border-[#fc8100]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#fc8100]" />
              <span className="font-heading font-bold text-[#fc8100] text-xs uppercase">
                {entryFee || "FREE PRE-ENTRY"}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              NO PAYMENT REQUIRED
            </span>
          </div>

          {/* Team Info */}
          <div className="space-y-3">
            <div>
              <label className="block uppercase font-bold text-gray-400 mb-1">
                Team / Clan Name *
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. DFG ESPORTS"
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">
                  Captain IGN * (IGL)
                </label>
                <input
                  type="text"
                  required
                  value={captainIgn}
                  onChange={(e) => setCaptainIgn(e.target.value)}
                  placeholder="e.g. DFG_MAHESH"
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white font-mono"
                />
              </div>

              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">
                  WhatsApp Contact *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 99000 88776"
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">
                  Captain Real Name
                </label>
                <input
                  type="text"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  placeholder="Mahesh Kumar"
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">
                  Discord ID
                </label>
                <input
                  type="text"
                  value={discordTag}
                  onChange={(e) => setDiscordTag(e.target.value)}
                  placeholder="dfg_lead#0001"
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Roster Starters */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <span className="font-heading uppercase font-bold text-gray-400 block">
              Additional Squad Roster (Starters):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
              <input
                type="text"
                placeholder="Player 2 IGN (Rusher)"
                value={player2.ign}
                onChange={(e) => setPlayer2({ ...player2, ign: e.target.value })}
                className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white"
              />
              <input
                type="text"
                placeholder="Player 3 IGN (Support)"
                value={player3.ign}
                onChange={(e) => setPlayer3({ ...player3, ign: e.target.value })}
                className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white"
              />
              <input
                type="text"
                placeholder="Player 4 IGN (Sniper)"
                value={player4.ign}
                onChange={(e) => setPlayer4({ ...player4, ign: e.target.value })}
                className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white"
              />
              <input
                type="text"
                placeholder="Substitute IGN (Optional)"
                value={substitute.ign}
                onChange={(e) => setSubstitute({ ...substitute, ign: e.target.value })}
                className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white"
              />
            </div>
          </div>

          {/* Pre-Entry Reservation Perks Info */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#fc8100]/10 via-transparent to-white/[0.02] border border-[#fc8100]/25 space-y-1.5">
            <span className="font-heading uppercase font-bold text-[#fc8100] flex items-center gap-1.5 text-[11px]">
              <Shield className="h-3.5 w-3.5 text-[#fc8100]" /> PRE-ENTRY SQUAD HOLD
            </span>
            <p className="text-[11px] text-gray-300 leading-relaxed font-body">
              Your registration locks an instant pre-entry slot. The MG ESPORTS Admin desk will review your roster and send room lobby access credentials via WhatsApp prior to kickoff.
            </p>
          </div>

          <div className="pt-2">
            <GoldButton type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "RESERVING SLOT..." : "CONFIRM PRE-ENTRY REGISTRATION"}
            </GoldButton>
            <p className="mt-2 text-center text-[10px] text-gray-500">
              By registering, you agree to official tournament rules and verification by MG Tournament Marshals.
            </p>
          </div>
        </form>
      )}
    </Modal>
  );
};
