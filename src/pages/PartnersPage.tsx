import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  Handshake,
  MessageSquare,
  Globe,
  Phone,
  Mail,
  User,
  Building2
} from "lucide-react";
import confetti from "canvas-confetti";
import { partnerPlansApi, type PartnerPlanItem, fallbackPlans } from "../api/partners";
import { PartnersSection } from "../sections/PartnersSection";
import { SEO } from "../components/common/SEO";

export const PartnersPage = () => {
  const [plans, setPlans] = useState<PartnerPlanItem[]>(fallbackPlans);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PartnerPlanItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    orgName: "",
    contactName: "",
    email: "",
    phone: "",
    discordTag: "",
    websiteUrl: "",
    message: "",
  });

  useEffect(() => {
    partnerPlansApi
      .getAll()
      .then((data) => {
        if (data && data.length > 0) {
          setPlans(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOpenSubscribe = (plan: PartnerPlanItem) => {
    setSelectedPlan(plan);
    setSubmitted(false);
    setModalOpen(true);
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setSubmitting(true);
    try {
      await partnerPlansApi.submitInquiry({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planPrice: `${selectedPlan.price} ${selectedPlan.billing}`,
        orgName: formData.orgName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        discordTag: formData.discordTag || null,
        websiteUrl: formData.websiteUrl || null,
        message: formData.message || null,
      });

      setSubmitted(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      alert(err.message || "Failed to submit application. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to parse features array
  const parseFeatures = (features: string | string[]): string[] => {
    if (Array.isArray(features)) return features;
    try {
      return JSON.parse(features);
    } catch {
      return [features];
    }
  };

  // Divide into top row (3) and bottom row (2)
  const topRowPlans = plans.slice(0, 3);
  const bottomRowPlans = plans.slice(3, 5);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 sm:pt-28 pb-14 sm:pb-20 w-full max-w-full overflow-x-hidden relative">
      <SEO
        title="Partner With Us | Esports Sponsorship &amp; Collaboration | LORD ESPORTZ"
        description="Collaborate with LORD ESPORTZ. Choose from customized sponsorship tiers, brand integration in premier tournaments, community activations, and broadcast features."
        canonicalPath="/partner-with-us"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Partner With Us", item: "/partner-with-us" },
        ]}
      />

      {/* Background Ambience */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] max-w-[100vw] h-[500px] bg-radial from-[#FFBE32]/10 via-transparent to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-96 right-0 max-w-full w-[450px] h-[450px] bg-purple-600/5 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFBE32]/10 border border-[#FFBE32]/30 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-[#FFBE32]" />
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-[#FFBE32]">
                PARTNER WITH LORD ESPORTZ
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-wide text-white leading-[1.1]">
              Find the Perfect <span className="text-gold-gradient">Plan</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-gray-400 font-body leading-relaxed max-w-2xl mx-auto">
              Select the plan that fits your goals. Upgrade or unlock lifetime benefits to gain maximum exposure across India's premier Free Fire and competitive esports community.
            </p>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* PLANS GRID (Row 1: Bronze, Silver, Gold | Row 2: Diamond, Lifetime) */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#FFBE32]" />
            <span>Loading partnership plans...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Row: Bronze, Silver, Gold */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {topRowPlans.map((plan, idx) => {
                const featuresList = parseFeatures(plan.features);
                const isGold = plan.isPopular || plan.slug === "gold";
                const isSilver = plan.slug === "silver";

                return (
                  <motion.div
                    key={plan.id || idx}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    whileHover={{ y: -6 }}
                    className={`relative rounded-2xl flex flex-col justify-between p-7 sm:p-8 transition-all duration-300 ${
                      isGold
                        ? "bg-gradient-to-b from-[#14141a] to-[#0d0d12] border-2 border-[#FFBE32] shadow-[0_10px_40px_rgba(255,190,50,0.18)]"
                        : isSilver
                        ? "bg-[#0d0d12] border border-white/15 hover:border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                        : "bg-[#0d0d12] border border-[#a16207]/30 hover:border-[#a16207]/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                    }`}
                  >
                    <div>
                      {/* Badge Pill */}
                      <div className="mb-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider ${
                            isGold
                              ? "bg-[#FFBE32] text-black font-extrabold shadow-[0_0_12px_rgba(255,190,50,0.4)]"
                              : isSilver
                              ? "bg-zinc-800 text-gray-300 border border-zinc-700"
                              : "bg-[#78350f]/30 text-[#d97706] border border-[#d97706]/30"
                          }`}
                        >
                          {plan.badge}
                        </span>
                      </div>

                      {/* Plan Name */}
                      <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                        {plan.name}
                      </h3>

                      {/* Pricing */}
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                          {plan.price}
                        </span>
                        <span className="font-body text-xs sm:text-sm text-gray-400">
                          {plan.billing}
                        </span>
                      </div>

                      {/* Tagline / Subtitle */}
                      {plan.tag && (
                        <p className="mt-3 text-xs font-heading font-semibold text-[#FFBE32]/90">
                          {plan.tag}
                        </p>
                      )}

                      {/* Subheading (e.g. EVERYTHING IN BRONZE) */}
                      {plan.subheading && (
                        <div className="mt-6 pt-5 border-t border-white/10">
                          <span className="font-heading text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                            {plan.subheading}
                          </span>
                        </div>
                      )}

                      {/* Features List */}
                      <ul className={`space-y-3.5 font-body text-xs sm:text-sm text-gray-300 ${plan.subheading ? "mt-4" : "mt-6 pt-6 border-t border-white/10"}`}>
                        {featuresList.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-3">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-8 pt-4">
                      <button
                        onClick={() => handleOpenSubscribe(plan)}
                        className={`w-full py-3.5 px-6 rounded-xl font-heading text-xs font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer text-center ${
                          isGold
                            ? "bg-[#FFBE32] hover:bg-[#FFA000] text-black shadow-[0_0_25px_rgba(255,190,50,0.35)] hover:shadow-[0_0_35px_rgba(255,190,50,0.5)]"
                            : "bg-white/5 hover:bg-white/15 text-white border border-white/15 hover:border-white/30"
                        }`}
                      >
                        {plan.ctaText}
                      </button>
                    </div>

                    {/* Gold Aura Sheen */}
                    {isGold && (
                      <div className="absolute inset-0 bg-gradient-to-t from-[#FFBE32]/8 via-transparent to-transparent pointer-events-none rounded-2xl" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Row: Diamond, Lifetime (Centered 2 cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
              {bottomRowPlans.map((plan, idx) => {
                const featuresList = parseFeatures(plan.features);
                const isLifetime = plan.isLifetime || plan.slug === "lifetime";

                return (
                  <motion.div
                    key={plan.id || idx}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                    whileHover={{ y: -6 }}
                    className={`relative rounded-2xl flex flex-col justify-between p-7 sm:p-8 transition-all duration-300 ${
                      isLifetime
                        ? "bg-gradient-to-b from-[#171026] to-[#0c0a14] border-2 border-purple-500/60 shadow-[0_10px_40px_rgba(168,85,247,0.18)]"
                        : "bg-[#0d0d12] border border-cyan-500/30 hover:border-cyan-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                    }`}
                  >
                    <div>
                      {/* Badge Pill */}
                      <div className="mb-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider ${
                            isLifetime
                              ? "bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                              : "bg-cyan-950/40 text-cyan-400 border border-cyan-500/30"
                          }`}
                        >
                          {plan.badge}
                        </span>
                      </div>

                      {/* Plan Name */}
                      <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                        {plan.name}
                      </h3>

                      {/* Pricing */}
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                          {plan.price}
                        </span>
                        <span className="font-body text-xs sm:text-sm text-gray-400">
                          {plan.billing}
                        </span>
                      </div>

                      {/* Tagline / Subtitle */}
                      {plan.tag && (
                        <div className="mt-3">
                          {isLifetime ? (
                            <span className="inline-block px-2.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-[10px] font-heading font-bold uppercase text-rose-400">
                              {plan.tag}
                            </span>
                          ) : (
                            <p className="text-xs font-heading font-semibold text-[#FFBE32]/90">
                              {plan.tag}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Subheading (e.g. EVERYTHING IN GOLD) */}
                      {plan.subheading && (
                        <div className="mt-6 pt-5 border-t border-white/10">
                          <span className="font-heading text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                            {plan.subheading}
                          </span>
                        </div>
                      )}

                      {/* Features List */}
                      <ul className={`space-y-3.5 font-body text-xs sm:text-sm text-gray-300 ${plan.subheading ? "mt-4" : "mt-6 pt-6 border-t border-white/10"}`}>
                        {featuresList.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-3">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-8 pt-4">
                      <button
                        onClick={() => handleOpenSubscribe(plan)}
                        className={`w-full py-3.5 px-6 rounded-xl font-heading text-xs font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer text-center ${
                          isLifetime
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.35)]"
                            : "bg-white/5 hover:bg-white/15 text-white border border-white/15 hover:border-white/30"
                        }`}
                      >
                        {plan.ctaText}
                      </button>
                    </div>

                    {/* Ambient Glow */}
                    {isLifetime && (
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 via-transparent to-transparent pointer-events-none rounded-2xl" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXISTING OFFICIAL SPONSORS SHOWCASE STREAM */}
        {/* ========================================================================= */}
        <div className="mt-28">
          <PartnersSection
            onPartnerWithUs={() => handleOpenSubscribe(plans[2] || plans[0])}
            showHeader={true}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PARTNER SUBSCRIPTION CHECKOUT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {modalOpen && selectedPlan && (
          <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/40 p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-[#FFBE32]">
                    OFFICIAL APPLICATION
                  </span>
                  <h3 className="font-display text-2xl uppercase tracking-wider text-white mt-0.5">
                    Subscribe: {selectedPlan.name}
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {submitted ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="font-display text-2xl uppercase tracking-wider text-white">
                    Application Received!
                  </h4>
                  <p className="text-sm text-gray-400 font-body max-w-md mx-auto leading-relaxed">
                    Thank you for applying to join the LORD ESPORTZ Partner Network. Our partnerships team will contact you within 24 hours on WhatsApp and email with your invoice, Discord onboarding, and partnership perks.
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="px-8 py-3 rounded-xl bg-[#FFBE32] text-black font-heading text-xs font-bold uppercase tracking-wider"
                    >
                      Close &amp; Back to Website
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  {/* Selected Plan Summary Banner */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-[#FFBE32]/30 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-heading font-bold text-[#FFBE32] uppercase">
                        {selectedPlan.badge}
                      </span>
                      <div className="font-display text-lg text-white font-bold uppercase">
                        {selectedPlan.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-extrabold text-white">
                        {selectedPlan.price}
                      </div>
                      <div className="text-[11px] font-body text-gray-400">
                        {selectedPlan.billing}
                      </div>
                    </div>
                  </div>

                  {/* Org / Brand Name */}
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#FFBE32]" />
                      <span>Organization / Brand / Guild Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.orgName}
                      onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                      placeholder="e.g. Titan Esports Guild / HyperX"
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none uppercase"
                    />
                  </div>

                  {/* Contact Person Name */}
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#FFBE32]" />
                      <span>Contact Person Full Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-[#FFBE32]" />
                        <span>Email Address *</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@brand.com"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-body"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-[#FFBE32]" />
                        <span>WhatsApp / Phone *</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Discord & Website */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-[#FFBE32]" />
                        <span>Discord Username (Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.discordTag}
                        onChange={(e) => setFormData({ ...formData, discordTag: e.target.value })}
                        placeholder="username#0000"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-[#FFBE32]" />
                        <span>Website or Social Link</span>
                      </label>
                      <input
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="https://instagram.com/..."
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-body"
                      />
                    </div>
                  </div>

                  {/* Additional Message */}
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                      Partnership Goals / Message
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your brand goals, expected tournament reach, or special requirements..."
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none resize-none font-body"
                    />
                  </div>

                  {/* Direct Contact Note */}
                  <div className="text-[11px] text-gray-400 font-body flex items-center justify-between px-1">
                    <span>Direct Business &amp; Partnership Desk:</span>
                    <a href="mailto:lordesportz75@gmail.com" className="text-[#FFBE32] hover:underline font-mono">
                      lordesportz75@gmail.com
                    </a>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-white/15 text-xs font-heading font-bold uppercase text-gray-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(255,190,50,0.35)] disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Handshake className="h-4 w-4" />
                          <span>Submit Application ({selectedPlan.price})</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
