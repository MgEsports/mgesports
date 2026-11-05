import React, { useState, useEffect, useRef } from "react";
import {
  partnersApi,
  partnerInquiriesApi,
  partnerPlansAdminApi,
  type PartnerItem,
  type PartnerPlanItem,
  type PartnerInquiryItem,
  fallbackPlansAdmin
} from "../api/partners";
import { adminApi } from "../api/admin";
import { resolveAdminPartnerLogo, resolveAdminPartnerCard } from "../utils/partnerLogo";
import {
  Handshake,
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Phone,
  Mail,
  MessageSquare,
  Layers,
  Inbox,
  UserCheck,
  Check,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";

const PRESET_PARTNER_LOGOS = [
  { name: "Infinix", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Infinix_logo.svg/1024px-Infinix_logo.svg.png" },
  { name: "Free Fire Max", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Garena_Free_Fire_logo.svg/1024px-Garena_Free_Fire_logo.svg.png" },
  { name: "Red Bull", url: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/RedBullEnergyDrink.svg/1024px-RedBullEnergyDrink.svg.png" },
  { name: "Monster Energy", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Monster_Energy_logo.svg/800px-Monster_Energy_logo.svg.png" },
  { name: "Logitech G", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Logitech_G_logo.svg/1024px-Logitech_G_logo.svg.png" },
  { name: "Razer", url: "https://upload.wikimedia.org/wikipedia/en/thumb/4/40/Razer_snake_logo.svg/800px-Razer_snake_logo.svg.png" },
  { name: "Discord", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Discord_Logo_%282020%29.svg/1024px-Discord_Logo_%282020%29.svg.png" },
  { name: "ASUS ROG", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Asus_Republic_of_Gamers_logo.svg/1024px-Asus_Republic_of_Gamers_logo.svg.png" },
  { name: "Puma", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Puma_logo.svg/1024px-Puma_logo.svg.png" },
  { name: "SteelSeries", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/SteelSeries_logo.svg/1024px-SteelSeries_logo.svg.png" },
];

export const AdminPartnersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"inquiries" | "plans" | "logos">("logos");

  // Inquiries State
  const [inquiries, setInquiries] = useState<PartnerInquiryItem[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("ALL");

  // Plans State
  const [plans, setPlans] = useState<PartnerPlanItem[]>(fallbackPlansAdmin);
  const [editingPlan, setEditingPlan] = useState<PartnerPlanItem | null>(null);
  const [planFormData, setPlanFormData] = useState<Partial<PartnerPlanItem>>({});
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // Logos / Partners State
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerItem | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingPartner, setSavingPartner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [partnerFormData, setPartnerFormData] = useState<Partial<PartnerItem>>({
    name: "",
    tier: "OFFICIAL PARTNER",
    category: "Gaming Hardware",
    logoImage: "",
    cardImage: "",
    websiteUrl: "https://",
    sortOrder: 1,
    isActive: true,
  });

  // Load Inquiries
  const loadInquiries = async () => {
    setInquiriesLoading(true);
    try {
      const data = await partnerInquiriesApi.getAll(inquiryStatusFilter);
      setInquiries(data);
    } catch {
      setInquiries([]);
    } finally {
      setInquiriesLoading(false);
    }
  };

  // Load Plans
  const loadPlans = async () => {
    try {
      const data = await partnerPlansAdminApi.getAll();
      setPlans(data && data.length > 0 ? data : fallbackPlansAdmin);
    } catch {
      setPlans(fallbackPlansAdmin);
    }
  };

  // Load Logos / Partners
  const loadPartners = async () => {
    setPartnersLoading(true);
    try {
      const data = await partnersApi.getAllAdmin();
      setPartners(Array.isArray(data) ? data : []);
    } catch {
      try {
        const publicData = await partnersApi.getAll();
        setPartners(Array.isArray(publicData) ? publicData : []);
      } catch {
        setPartners([]);
      }
    } finally {
      setPartnersLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
    loadPlans();
    loadPartners();
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [inquiryStatusFilter]);

  // Handle Inquiry Status Change
  const handleInquiryStatusChange = async (id: string, newStatus: any) => {
    try {
      await partnerInquiriesApi.update(id, { status: newStatus });
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq))
      );
    } catch (err: any) {
      alert("Failed to update inquiry status: " + err.message);
    }
  };

  // Handle Inquiry Payment Status Change
  const handleInquiryPaymentChange = async (id: string, newPaymentStatus: any) => {
    try {
      await partnerInquiriesApi.update(id, { paymentStatus: newPaymentStatus });
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, paymentStatus: newPaymentStatus } : inq))
      );
    } catch (err: any) {
      alert("Failed to update payment status: " + err.message);
    }
  };

  // Delete Inquiry
  const handleDeleteInquiry = async (id: string, orgName: string) => {
    if (!confirm(`Are you sure you want to delete inquiry from ${orgName}?`)) return;
    try {
      await partnerInquiriesApi.delete(id);
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
    } catch (err: any) {
      alert("Failed to delete inquiry: " + err.message);
    }
  };

  // Plan Edit Handlers
  const handleOpenEditPlan = (plan: PartnerPlanItem) => {
    setEditingPlan(plan);
    const parsedFeatures = typeof plan.features === "string" ? plan.features : JSON.stringify(plan.features, null, 2);
    setPlanFormData({
      ...plan,
      features: parsedFeatures,
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSavingPlan(true);
    try {
      let formattedFeatures = planFormData.features;
      if (typeof formattedFeatures === "string") {
        try {
          JSON.parse(formattedFeatures);
        } catch {
          // If plain lines, convert to JSON array
          const lines = formattedFeatures.split("\n").map((l) => l.trim()).filter(Boolean);
          formattedFeatures = JSON.stringify(lines);
        }
      }

      const updated = await partnerPlansAdminApi.update(editingPlan.id, {
        price: planFormData.price,
        billing: planFormData.billing,
        tag: planFormData.tag,
        subheading: planFormData.subheading,
        features: formattedFeatures,
        ctaText: planFormData.ctaText,
        isActive: planFormData.isActive,
      });

      setPlans((prev) =>
        prev.map((p) => (p.id === editingPlan.id ? { ...p, ...updated } : p))
      );
      setPlanModalOpen(false);
    } catch (err: any) {
      alert("Failed to save plan: " + err.message);
    } finally {
      setSavingPlan(false);
    }
  };

  // Partner Logo Handlers
  const handleOpenCreatePartner = () => {
    setEditingPartner(null);
    setPartnerFormData({
      name: "",
      tier: "OFFICIAL PARTNER",
      category: "Tournament Platform",
      logoImage: "",
      cardImage: "",
      websiteUrl: "https://",
      sortOrder: partners.length + 1,
      isActive: true,
    });
    setPartnerModalOpen(true);
  };

  const handleOpenEditPartner = (part: PartnerItem) => {
    setEditingPartner(part);
    setPartnerFormData({
      name: part.name,
      tier: part.tier || "OFFICIAL PARTNER",
      category: part.category || "Gaming",
      logoImage: part.logoImage || "",
      cardImage: part.cardImage || "",
      websiteUrl: part.websiteUrl || "https://",
      sortOrder: part.sortOrder !== undefined ? part.sortOrder : 1,
      isActive: part.isActive !== undefined ? part.isActive : true,
    });
    setPartnerModalOpen(true);
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Logo image size must be under 10MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await adminApi.uploadImage(file);
      if (res && res.url) {
        setPartnerFormData((prev) => ({ ...prev, logoImage: res.url }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload image.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDirectCardLogoUpload = async (partnerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await adminApi.uploadImage(file);
      if (res && res.url) {
        await partnersApi.update(partnerId, { logoImage: res.url });
        setPartners((prev) =>
          prev.map((p) => (p.id === partnerId ? { ...p, logoImage: res.url } : p))
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to update logo");
    }
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerFormData.name?.trim()) {
      alert("Partner name is required");
      return;
    }

    setSavingPartner(true);
    try {
      const payload: Partial<PartnerItem> = {
        name: partnerFormData.name.trim(),
        tier: partnerFormData.tier || "OFFICIAL PARTNER",
        category: partnerFormData.category?.trim() || "Gaming Partner",
        logoImage: partnerFormData.logoImage?.trim() || null,
        cardImage: partnerFormData.cardImage?.trim() || null,
        websiteUrl: partnerFormData.websiteUrl?.trim() || null,
        sortOrder: Number(partnerFormData.sortOrder) || 0,
        isActive: partnerFormData.isActive ?? true,
      };

      if (editingPartner) {
        await partnersApi.update(editingPartner.id, payload);
      } else {
        await partnersApi.create(payload);
      }
      await loadPartners();
      setPartnerModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save partner");
    } finally {
      setSavingPartner(false);
    }
  };

  const handleTogglePartnerActive = async (part: PartnerItem) => {
    const nextState = !part.isActive;
    try {
      await partnersApi.update(part.id, { isActive: nextState });
      await loadPartners();
    } catch {
      await loadPartners();
    }
  };

  const handleDeletePartner = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await partnersApi.delete(id);
      setPartners((prev) => prev.filter((p) => p.id !== id));
      await loadPartners();
    } catch (err: any) {
      alert(err.message || "Failed to delete partner");
    }
  };

  // Helper to parse features
  const parseFeatures = (features: string | string[]): string[] => {
    if (Array.isArray(features)) return features;
    try {
      return JSON.parse(features);
    } catch {
      return [features];
    }
  };

  const pendingInquiriesCount = inquiries.filter((i) => i.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FFBE32] animate-ping" />
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-[#FFBE32]">
              Sponsorship &amp; Partner Management
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wider text-white">
            Partners &amp; Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-body mt-1">
            Manage inbound tier subscriptions, edit pricing plans, and configure public sponsor logos.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveTab("logos");
            handleOpenCreatePartner();
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#FFBE32] hover:bg-[#FFA000] transition-all cursor-pointer shadow-[0_0_20px_rgba(255,190,50,0.35)] shrink-0 group"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          <span>Add Brand Sponsor &amp; Logo</span>
        </button>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px">
        <button
          onClick={() => setActiveTab("inquiries")}
          className={`relative px-5 py-3 text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2.5 ${
            activeTab === "inquiries"
              ? "text-[#FFBE32] border-b-2 border-[#FFBE32]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Partner Applications</span>
          {pendingInquiriesCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-mono font-bold animate-pulse">
              {pendingInquiriesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("plans")}
          className={`relative px-5 py-3 text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2.5 ${
            activeTab === "plans"
              ? "text-[#FFBE32] border-b-2 border-[#FFBE32]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Subscription Plans &amp; Pricing</span>
          <span className="text-[10px] text-gray-500 font-mono">({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("logos")}
          className={`relative px-5 py-3 text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2.5 ${
            activeTab === "logos"
              ? "text-[#FFBE32] border-b-2 border-[#FFBE32]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Handshake className="h-4 w-4" />
          <span>Sponsor Wall &amp; Logos</span>
          <span className="text-[10px] text-gray-500 font-mono">({partners.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INQUIRIES & APPLICATIONS */}
      {/* ========================================================================= */}
      {activeTab === "inquiries" && (
        <div className="space-y-4">
          {/* Status Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0c0c10] border border-white/5 p-3.5 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-heading uppercase text-gray-400">
              <span>Filter Status:</span>
              {["ALL", "PENDING", "CONTACTED", "APPROVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setInquiryStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-heading font-bold uppercase transition-all cursor-pointer ${
                    inquiryStatusFilter === st
                      ? "bg-[#FFBE32] text-black shadow-[0_0_10px_rgba(255,190,50,0.3)]"
                      : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-500 font-mono">
              Total Inquiries: {inquiries.length}
            </span>
          </div>

          {/* Inquiries Table / Cards */}
          {inquiriesLoading ? (
            <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#FFBE32]" />
              <span>Loading partner applications...</span>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-[#0c0c10] border border-white/5 p-8">
              <Inbox className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="font-heading text-sm uppercase text-gray-400">No partner applications yet</p>
              <p className="text-xs text-gray-500 mt-1 font-body">Applications submitted on the "Partner with Us" page will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-5 rounded-2xl bg-[#0C0C10] border border-white/10 hover:border-[#FFBE32]/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                >
                  {/* Left: Org & Contact Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-display text-lg uppercase tracking-wider text-white">
                        {inq.orgName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFBE32]/10 border border-[#FFBE32]/30 text-[#FFBE32] text-xs font-heading font-bold uppercase">
                        {inq.planName} ({inq.planPrice})
                      </span>
                      <span className="text-xs font-mono text-gray-500">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400 font-body">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-gray-300 font-medium">{inq.contactName}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-gray-500" />
                        <a href={`mailto:${inq.email}`} className="hover:text-[#FFBE32] text-gray-300">
                          {inq.email}
                        </a>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-500" />
                        <a
                          href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-400 text-emerald-400/90 font-mono flex items-center gap-1"
                        >
                          {inq.phone}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </span>
                      {inq.discordTag && (
                        <span className="flex items-center gap-1.5 font-mono text-indigo-400">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {inq.discordTag}
                        </span>
                      )}
                    </div>

                    {inq.message && (
                      <p className="text-xs text-gray-400 font-body italic bg-black/40 p-2.5 rounded-lg border border-white/5 mt-2">
                        "{inq.message}"
                      </p>
                    )}
                  </div>

                  {/* Right: Status Controls & Actions */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap lg:flex-nowrap">
                    {/* Status Dropdown */}
                    <div>
                      <select
                        value={inq.status}
                        onChange={(e) => handleInquiryStatusChange(inq.id, e.target.value)}
                        className={`text-xs font-heading font-bold uppercase rounded-lg px-3 py-2 border focus:outline-none cursor-pointer ${
                          inq.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : inq.status === "CONTACTED"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                            : inq.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : "bg-[#FFBE32]/10 text-[#FFBE32] border-[#FFBE32]/30"
                        }`}
                      >
                        <option value="PENDING" className="bg-[#111] text-[#FFBE32]">PENDING</option>
                        <option value="CONTACTED" className="bg-[#111] text-cyan-400">CONTACTED</option>
                        <option value="APPROVED" className="bg-[#111] text-emerald-400">APPROVED</option>
                        <option value="REJECTED" className="bg-[#111] text-rose-400">REJECTED</option>
                      </select>
                    </div>

                    {/* Payment Status Dropdown */}
                    <div>
                      <select
                        value={inq.paymentStatus}
                        onChange={(e) => handleInquiryPaymentChange(inq.id, e.target.value)}
                        className={`text-xs font-heading font-bold uppercase rounded-lg px-3 py-2 border focus:outline-none cursor-pointer ${
                          inq.paymentStatus === "PAID"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        <option value="PENDING" className="bg-[#111] text-zinc-400">UNPAID</option>
                        <option value="PAID" className="bg-[#111] text-emerald-400">PAID</option>
                      </select>
                    </div>

                    {/* Quick WhatsApp Chat */}
                    <a
                      href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(inq.contactName)},%20thank%20you%20for%20applying%20for%20the%20${encodeURIComponent(inq.planName)}%20with%20Lord%20Esports!`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-black font-heading text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
                      title="Chat on WhatsApp"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Delete Inquiry */}
                    <button
                      onClick={() => handleDeleteInquiry(inq.id, inq.orgName)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Application"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PLANS & PRICING */}
      {/* ========================================================================= */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-body">
              These 5 plans are displayed live on the public <strong className="text-white">Partner with Us</strong> page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const featuresList = parseFeatures(plan.features);

              return (
                <div
                  key={plan.id}
                  className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 hover:border-[#FFBE32]/60 transition-all flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                >
                  <div>
                    {/* Badge & Status */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-heading font-bold uppercase bg-[#FFBE32]/10 text-[#FFBE32] border border-[#FFBE32]/30">
                        {plan.badge}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                        ACTIVE ON SITE
                      </span>
                    </div>

                    {/* Plan Name & Pricing */}
                    <h3 className="font-display text-2xl uppercase tracking-wider text-white mt-4">
                      {plan.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-extrabold text-white">
                        {plan.price}
                      </span>
                      <span className="font-body text-xs text-gray-400">
                        {plan.billing}
                      </span>
                    </div>

                    {plan.tag && (
                      <p className="text-xs text-[#FFBE32] font-semibold mt-2 font-heading">
                        {plan.tag}
                      </p>
                    )}

                    {/* Features checklist */}
                    <div className="mt-5 pt-4 border-t border-white/5 space-y-2">
                      <div className="text-[11px] font-heading uppercase text-gray-400 font-bold">
                        Included Features ({featuresList.length})
                      </div>
                      <ul className="space-y-1.5 text-xs text-gray-300">
                        {featuresList.map((f, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => handleOpenEditPlan(plan)}
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-[#FFBE32] text-white hover:text-black font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Plan Pricing &amp; Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SPONSOR WALL & LOGOS */}
      {/* ========================================================================= */}
      {activeTab === "logos" && (
        <div className="space-y-6">
          {/* Partners Grid */}
          {partnersLoading ? (
            <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#FFBE32]" />
              <span>Loading official brand partners &amp; logos...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-2xl bg-[#0C0C10] border transition-all flex flex-col justify-between group shadow-[0_10px_30px_rgba(0,0,0,0.7)] hover:shadow-[0_15px_40px_rgba(255,190,50,0.12)] overflow-hidden ${
                    p.isActive ? "border-white/10 hover:border-[#FFBE32]/60" : "border-white/5 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="px-2.5 py-1 rounded-md border text-[10px] font-heading font-bold uppercase tracking-wider bg-[#FFBE32]/10 text-[#FFBE32] border-[#FFBE32]/30">
                        {p.tier || "OFFICIAL PARTNER"}
                      </span>
                      <button
                        onClick={() => handleTogglePartnerActive(p)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold cursor-pointer transition-colors ${
                          p.isActive
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {p.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        <span>{p.isActive ? "ACTIVE" : "HIDDEN"}</span>
                      </button>
                    </div>

                    {/* Logo Display Box */}
                    <div className="mt-4 w-full h-32 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center p-4 relative overflow-hidden group-hover:border-[#FFBE32]/30 transition-colors group/logo">
                      {(() => {
                        const resolvedLogo = resolveAdminPartnerLogo(p.logoImage, p.name, p.id);
                        const resolvedCard = resolveAdminPartnerCard(p.cardImage, p.id);
                        if (resolvedLogo) {
                          return (
                            <img
                              src={resolvedLogo}
                              alt={p.name}
                              loading="lazy"
                              decoding="async"
                              className="max-h-20 max-w-[85%] object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                const fallback = resolveAdminPartnerLogo(null, p.name, p.id);
                                if (fallback && target.src !== fallback) {
                                  target.src = fallback;
                                }
                              }}
                            />
                          );
                        } else if (resolvedCard) {
                          return (
                            <img
                              src={resolvedCard}
                              alt={p.name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                const fallback = resolveAdminPartnerLogo(null, p.name, p.id);
                                if (fallback) {
                                  target.src = fallback;
                                  target.className = "max-h-20 max-w-[85%] object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]";
                                }
                              }}
                            />
                          );
                        } else {
                          return (
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <ImageIcon className="h-8 w-8 text-gray-600 mb-1" />
                              <span className="text-[10px] font-mono uppercase">No Logo Uploaded</span>
                            </div>
                          );
                        }
                      })()}

                      {/* Quick Upload Hover Overlay */}
                      <label
                        htmlFor={`card-logo-input-${p.id}`}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xs opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 cursor-pointer z-10"
                        title="Click to quickly upload / change logo"
                      >
                        <Upload className="h-5 w-5 text-[#FFBE32]" />
                        <span className="text-[10px] font-heading font-bold uppercase text-white tracking-wider">
                          Change Logo File
                        </span>
                        <input
                          type="file"
                          id={`card-logo-input-${p.id}`}
                          accept="image/*"
                          onChange={(e) => handleDirectCardLogoUpload(p.id, e)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-display text-xl uppercase tracking-wider text-white group-hover:text-[#FFBE32] transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-body mt-1">
                        {p.category || "Gaming Partner"}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-3.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-mono text-[11px]">Priority #{p.sortOrder || 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditPartner(p)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FFBE32] text-gray-300 hover:text-black transition-all cursor-pointer"
                        title="Edit Partner & Logo"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePartner(p.id, p.name)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
                        title="Delete Partner"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PLAN MODAL */}
      {/* ========================================================================= */}
      {planModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/40 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-[#FFBE32]">
                  Edit Subscription Tier
                </span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-white mt-0.5">
                  {editingPlan.name}
                </h3>
              </div>
              <button
                onClick={() => setPlanModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Plan Display Name
                </label>
                <input
                  type="text"
                  required
                  value={planFormData.name || ""}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Monthly Price (Display)
                  </label>
                  <input
                    type="text"
                    required
                    value={planFormData.price || ""}
                    onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Billing Cycle
                  </label>
                  <input
                    type="text"
                    required
                    value={planFormData.billing || "/month"}
                    onChange={(e) => setPlanFormData({ ...planFormData, billing: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Tier Subtitle / Descriptor
                </label>
                <input
                  type="text"
                  value={planFormData.subheading || ""}
                  onChange={(e) => setPlanFormData({ ...planFormData, subheading: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Features &amp; Deliverables (One per line)
                </label>
                <textarea
                  rows={5}
                  value={
                    Array.isArray(planFormData.features)
                      ? planFormData.features.join("\n")
                      : planFormData.features || ""
                  }
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      features: e.target.value.split("\n").filter((f) => f.trim().length > 0),
                    })
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="popular-plan-check"
                  checked={planFormData.isPopular || false}
                  onChange={(e) => setPlanFormData({ ...planFormData, isPopular: e.target.checked })}
                  className="rounded border-white/20 text-[#FFBE32] focus:ring-[#FFBE32] h-4 w-4 bg-black/60"
                />
                <label htmlFor="popular-plan-check" className="text-xs font-heading font-bold text-gray-300 cursor-pointer uppercase">
                  Mark as Most Popular Tier
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 text-xs font-heading font-bold text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-6 py-2.5 rounded-xl bg-[#FFBE32] text-black font-heading text-xs font-bold uppercase tracking-wider hover:bg-[#FFA000] transition-all flex items-center gap-2 cursor-pointer"
                >
                  {savingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Plan Tier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT PARTNER MODAL */}
      {/* ========================================================================= */}
      {partnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/40 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-[#FFBE32]">
                  {editingPartner ? "Edit Partner & Logo" : "New Sponsor Partner"}
                </span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-white mt-0.5">
                  {editingPartner ? "Edit Partner & Logo" : "Add Brand Sponsor"}
                </h3>
              </div>
              <button
                onClick={() => setPartnerModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Partner / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={partnerFormData.name}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, name: e.target.value })}
                  placeholder="e.g. LOGITECH G, RED BULL, MONSTER"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none uppercase"
                />
              </div>

              {/* Logo Upload & URL Section */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-bold uppercase text-[#FFBE32] flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Partner Logo Image *</span>
                  </label>
                  {partnerFormData.logoImage && (
                    <button
                      type="button"
                      onClick={() => setPartnerFormData({ ...partnerFormData, logoImage: "" })}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-mono transition-colors cursor-pointer"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* Live Logo Preview Box */}
                <div className="relative rounded-xl border border-white/15 bg-[#07070a] p-4 flex items-center justify-center min-h-[110px] overflow-hidden">
                  {partnerFormData.logoImage ? (
                    <>
                      <img
                        src={resolveAdminPartnerLogo(partnerFormData.logoImage, partnerFormData.name)}
                        alt="Logo preview"
                        className="max-h-20 max-w-[80%] object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
                        onError={(e) => {
                          const fallback = resolveAdminPartnerLogo(null, partnerFormData.name);
                          if (fallback) (e.currentTarget as HTMLImageElement).src = fallback;
                        }}
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[10px] font-heading font-bold uppercase cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center text-gray-400 cursor-pointer p-2 text-center"
                    >
                      <ImageIcon className="h-7 w-7 text-white/20 mb-1" />
                      <span className="text-xs font-heading font-bold text-white uppercase">Upload Logo from Device</span>
                      <span className="text-[10px] text-gray-500 font-mono">PNG / SVG with transparent background recommended</span>
                    </div>
                  )}
                </div>

                {/* Upload from device & URL input buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 hover:border-[#FFBE32]/60 bg-white/5 hover:bg-white/10 text-xs font-heading font-bold uppercase tracking-wider text-white transition-all cursor-pointer"
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#FFBE32]" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-[#FFBE32]" />
                        <span>Choose File / SVG</span>
                      </>
                    )}
                  </button>

                  <div className="relative">
                    <input
                      type="url"
                      value={partnerFormData.logoImage || ""}
                      onChange={(e) =>
                        setPartnerFormData({ ...partnerFormData, logoImage: e.target.value })
                      }
                      placeholder="Or paste Logo URL..."
                      className="w-full rounded-xl border border-white/15 bg-black/60 pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-gray-600 focus:border-[#FFBE32] focus:outline-none"
                    />
                    <LinkIcon className="h-3.5 w-3.5 text-gray-500 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Quick Preset Logos */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#FFBE32]" /> Quick Preset Brands:
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {PRESET_PARTNER_LOGOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setPartnerFormData({
                            ...partnerFormData,
                            name: partnerFormData.name || preset.name.toUpperCase(),
                            logoImage: preset.url,
                          })
                        }
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          partnerFormData.logoImage === preset.url
                            ? "bg-[#FFBE32]/20 border-[#FFBE32] text-[#FFBE32]"
                            : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Sponsorship Tier
                  </label>
                  <select
                    value={partnerFormData.tier}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, tier: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                  >
                    <option value="MAIN SPONSOR">MAIN SPONSOR</option>
                    <option value="OFFICIAL PARTNER">OFFICIAL PARTNER</option>
                    <option value="BROADCAST PARTNER">BROADCAST PARTNER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerFormData.category}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, category: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={partnerFormData.websiteUrl || ""}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, websiteUrl: e.target.value })}
                  placeholder="https://brand.com"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPartnerModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-white/15 text-xs font-heading font-bold uppercase text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPartner}
                  className="px-6 py-2 rounded-xl bg-[#FFBE32] text-black font-heading text-xs font-bold uppercase tracking-wider"
                >
                  {savingPartner ? "Saving..." : "Save Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
