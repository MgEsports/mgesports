import React, { useState, useEffect, useMemo } from "react";
import { merchandiseApi, type OrderItem } from "../api/merchandise";
import {
  Search,
  Phone,
  MapPin,
  Sparkles,
  Truck,
  Calendar,
  CreditCard,
  Copy,
  Check,
  Edit3,
  X,
  Users,
  ChevronDown,
  ChevronUp,
  Mail,
  Trash2,
  ExternalLink,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  courierApi,
  POPULAR_COURIERS,
  detectCourierSlug,
  getAftershipTrackingUrl,
  getCourierDirectUrl,
  type TrackingResponse,
} from "../api/courier";

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"LIST" | "USERS">("LIST");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderItem | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Live Courier Tracking State
  const [liveTrackingOrder, setLiveTrackingOrder] = useState<OrderItem | null>(null);
  const [liveTrackingLoading, setLiveTrackingLoading] = useState(false);
  const [liveTrackingData, setLiveTrackingData] = useState<TrackingResponse | null>(null);

  // AfterShip Sync inside Fulfillment Modal
  const [selectedCourierSlug, setSelectedCourierSlug] = useState("india-post");
  const [syncingAftership, setSyncingAftership] = useState(false);
  const [aftershipSyncMessage, setAftershipSyncMessage] = useState<string | null>(null);

  const [trackingForm, setTrackingForm] = useState({
    orderStatus: "PENDING",
    courierPartner: "India Post Domestic",
    trackingNumber: "",
    expectedDeliveryDate: "",
    paymentStatus: "PENDING",
    adminNotes: "",
  });

  const customerGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        totalSpent: number;
        orders: OrderItem[];
      }
    >();

    orders.forEach((ord) => {
      const email = ord.customerEmail?.toLowerCase().trim() || "";
      const phone = ord.customerPhone?.replace(/[^0-9]/g, "") || "";
      const key = email || phone || ord.customerName;

      if (!map.has(key)) {
        map.set(key, {
          key,
          customerName: ord.customerName,
          customerEmail: ord.customerEmail,
          customerPhone: ord.customerPhone,
          totalSpent: 0,
          orders: [],
        });
      }
      const grp = map.get(key)!;
      grp.totalSpent += ord.totalAmount;
      grp.orders.push(ord);
    });

    return Array.from(map.values());
  }, [orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await merchandiseApi.getOrders({
        status: statusFilter,
        search: searchQuery,
      });
      setOrders(data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, searchQuery]);

  const handleOpenTrackingModal = (ord: OrderItem) => {
    setTrackingModalOrder(ord);
    const partner = ord.courierPartner || "India Post Domestic";
    const slug = detectCourierSlug(partner);
    setSelectedCourierSlug(slug);
    setAftershipSyncMessage(null);
    setTrackingForm({
      orderStatus: ord.orderStatus || "PENDING",
      courierPartner: partner,
      trackingNumber: ord.trackingNumber || "",
      expectedDeliveryDate: ord.expectedDeliveryDate || "",
      paymentStatus: ord.paymentStatus || "PENDING",
      adminNotes: ord.adminNotes || "",
    });
  };

  const handleSyncAftershipNow = async () => {
    if (!trackingForm.trackingNumber?.trim()) {
      alert("Please enter a Tracking / AWB number first");
      return;
    }
    setSyncingAftership(true);
    setAftershipSyncMessage(null);
    try {
      const res = await courierApi.create(
        trackingForm.trackingNumber.trim(),
        selectedCourierSlug,
        trackingModalOrder?.orderNumber
      );
      setAftershipSyncMessage(res.message || "Tracking registered on AfterShip!");
    } catch (err: any) {
      setAftershipSyncMessage(err.message || "Failed to register on AfterShip");
    } finally {
      setSyncingAftership(false);
    }
  };

  const handleOpenLiveTracking = async (ord: OrderItem) => {
    if (!ord.trackingNumber) return;
    setLiveTrackingOrder(ord);
    setLiveTrackingLoading(true);
    setLiveTrackingData(null);
    try {
      const slug = detectCourierSlug(ord.courierPartner);
      const data = await courierApi.track(ord.trackingNumber, slug);
      setLiveTrackingData(data);
    } catch {
      // Gracefully handled by courierApi
    } finally {
      setLiveTrackingLoading(false);
    }
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder) return;

    try {
      await merchandiseApi.updateOrderStatus(trackingModalOrder.id, {
        orderStatus: trackingForm.orderStatus,
        courierPartner: trackingForm.courierPartner || null,
        trackingNumber: trackingForm.trackingNumber || null,
        expectedDeliveryDate: trackingForm.expectedDeliveryDate || null,
        paymentStatus: trackingForm.paymentStatus || null,
        adminNotes: trackingForm.adminNotes || null,
      });

      // Automatically register with AfterShip in background if tracking number is provided
      if (trackingForm.trackingNumber?.trim()) {
        courierApi
          .create(
            trackingForm.trackingNumber.trim(),
            selectedCourierSlug,
            trackingModalOrder.orderNumber
          )
          .catch(() => {});
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === trackingModalOrder.id ? ({ ...o, ...trackingForm } as OrderItem) : o
        )
      );

      setTrackingModalOrder(null);
    } catch (err: any) {
      alert(err.message || "Failed to update order tracking details");
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      await merchandiseApi.updateOrderStatus(id, { orderStatus: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? ({ ...o, orderStatus: newStatus as any } as OrderItem) : o))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(id);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleDeleteOrder = async (id: string, orderNumber?: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await merchandiseApi.deleteOrder(id, orderNumber);
    } catch (err: any) {
      console.warn("Delete order notice:", err?.message);
    } finally {
      setOrders((prev) =>
        prev.filter(
          (o) => o.id !== id && o.orderNumber !== id && (orderNumber ? o.orderNumber !== orderNumber : true)
        )
      );
    }
  };

  const handleDeleteAllOrders = async () => {
    if (orders.length === 0) return;
    if (!confirm(`Are you sure you want to delete ALL ${orders.length} orders? This will wipe all demo and customer orders.`)) return;
    const currentOrders = [...orders];
    try {
      try {
        await merchandiseApi.deleteAllOrders(currentOrders);
      } catch {
        await Promise.all(
          currentOrders.map((o) => merchandiseApi.deleteOrder(o.id, o.orderNumber).catch(() => {}))
        );
      }
    } catch (err: any) {
      console.warn("Delete all orders notice:", err?.message);
    } finally {
      setOrders([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-white">
            MERCHANDISE ORDER FULFILLMENT &amp; TRACKING
          </h1>
          <p className="text-xs text-gray-400 font-body">
            Manage customer apparel orders, verify UPI UTR numbers, assign couriers, and set expected delivery dates.
          </p>
        </div>

        {orders.length > 0 && (
          <button
            onClick={handleDeleteAllOrders}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shrink-0"
            title="Delete all demo and customer orders"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete All Orders ({orders.length})</span>
          </button>
        )}
      </div>

      {/* View Mode & Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-black/60 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-[#FFBE32] text-black shadow-[0_0_10px_rgba(255,190,50,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>All Orders ({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("USERS")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "USERS"
                  ? "bg-[#FFBE32] text-black shadow-[0_0_10px_rgba(255,190,50,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Customer Order Histories ({customerGroups.length})</span>
            </button>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-mono text-[#FFBE32] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3 w-3" /> Clear user filter ({searchQuery})
            </button>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-[#0D0D12] border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#FFBE32] text-black shadow-[0_0_10px_rgba(255,190,50,0.3)] font-extrabold"
                    : "bg-black/50 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer email, phone..."
              className="w-full rounded-xl border border-white/10 bg-black/60 pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FFBE32] focus:outline-none font-body"
            />
          </div>
        </div>
      </div>

      {/* Orders View */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse">
          Loading merchandise orders from database...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-gray-400 font-mono text-xs bg-[#0C0C10] rounded-2xl border border-white/10">
          No orders found matching the criteria.
        </div>
      ) : viewMode === "USERS" ? (
        /* CUSTOMER GROUPED VIEW */
        <div className="space-y-4">
          {customerGroups.map((grp) => {
            const isExpanded = expandedCustomer === grp.key;

            return (
              <div
                key={grp.key}
                className="rounded-2xl bg-[#0C0C10] border border-white/10 overflow-hidden shadow-lg"
              >
                {/* Customer Group Header */}
                <div
                  onClick={() => setExpandedCustomer(isExpanded ? null : grp.key)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#FFBE32] to-[#FFE082] text-black font-display font-bold flex items-center justify-center text-lg shadow-md shrink-0">
                      {grp.customerName.slice(0, 2).toUpperCase() || "CU"}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-white uppercase text-base flex items-center gap-2">
                        {grp.customerName}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FFBE32]/10 text-[#FFBE32] border border-[#FFBE32]/30">
                          {grp.orders.length} {grp.orders.length === 1 ? "Order" : "Orders"}
                        </span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400 mt-0.5">
                        {grp.customerEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-[#FFBE32]" />
                            {grp.customerEmail}
                          </span>
                        )}
                        {grp.customerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-[#FFBE32]" />
                            {grp.customerPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-left sm:text-right font-mono">
                      <span className="text-gray-400 text-xs block">Total Spend:</span>
                      <strong className="text-emerald-400 text-sm">₹{grp.totalSpent}</strong>
                    </div>

                    <button
                      type="button"
                      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Customer Orders List */}
                {isExpanded && (
                  <div className="p-5 pt-0 space-y-3 border-t border-white/5 mt-2">
                    <div className="text-xs font-mono text-gray-400 pt-3">
                      Order History for <strong>{grp.customerName}</strong> ({grp.orders.length} orders):
                    </div>
                    {grp.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-[#FFBE32]">
                              {ord.orderNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-heading font-bold uppercase ${
                                ord.orderStatus === "SHIPPED"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : ord.orderStatus === "PROCESSING"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : ord.orderStatus === "DELIVERED"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : ord.orderStatus === "CANCELLED"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {ord.orderStatus}
                            </span>
                            <span className="text-[11px] font-mono text-gray-400">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-gray-300">
                            {ord.productName} • Size: {ord.size}
                            {ord.customIgn ? ` • IGN: ${ord.customIgn} #${ord.customNumber || "00"}` : ""} • ₹{ord.totalAmount}
                          </div>
                          {ord.trackingNumber && (
                            <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
                              <span>
                                Courier: {ord.courierPartner || "India Post"} • AWB:{" "}
                                <strong className="text-white">{ord.trackingNumber}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenLiveTracking(ord);
                                }}
                                className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                              >
                                <Truck className="h-3 w-3" />
                                <span>Track Live</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTrackingModal(ord);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#FFBE32]/10 hover:bg-[#FFBE32] text-[#FFBE32] hover:text-black border border-[#FFBE32]/30 text-xs font-heading font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Update Tracking</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(ord.id, ord.orderNumber);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 cursor-pointer transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD ALL ORDERS LIST */
        <div className="space-y-4">
          {orders.map((ord) => {
            const phoneClean = ord.customerPhone?.replace(/[^0-9]/g, "") || "";

            return (
              <div
                key={ord.id}
                className="p-5 rounded-2xl bg-[#0C0C10] border border-white/10 hover:border-[#FFBE32]/40 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-5 group shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
              >
                {/* Order Identity & Customer Info */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#FFBE32] px-2.5 py-0.5 rounded bg-[#FFBE32]/10 border border-[#FFBE32]/30">
                      {ord.orderNumber}
                    </span>
                    <span className="font-heading font-bold text-white text-base">
                      {ord.customerName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider ${
                        ord.orderStatus === "SHIPPED"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : ord.orderStatus === "PROCESSING"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : ord.orderStatus === "DELIVERED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : ord.orderStatus === "CANCELLED"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {ord.orderStatus}
                    </span>

                    <span className="text-[11px] font-mono text-gray-400">
                      {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Product & Print Specs */}
                  <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-wrap items-center gap-3 text-xs font-mono">
                    <span className="text-white font-bold">{ord.productName}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-300">
                      Size: <strong className="text-white">{ord.size}</strong>
                    </span>
                    {ord.customIgn && (
                      <>
                        <span className="text-gray-400">|</span>
                        <span className="text-[#FFBE32] flex items-center gap-1 font-bold">
                          <Sparkles className="h-3 w-3" />
                          IGN: {ord.customIgn} #{ord.customNumber || "00"}
                        </span>
                      </>
                    )}
                    <span className="text-gray-400">|</span>
                    <span className="text-emerald-400 font-bold">
                      ₹{ord.totalAmount}
                    </span>
                  </div>

                  {/* Payment Details: UPI & UTR Number */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span
                      className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                        ord.paymentMethod === "UPI"
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>{ord.paymentMethod === "UPI" ? "UPI PAYMENT" : "CASH ON DELIVERY"}</span>
                    </span>

                    {ord.paymentMethod === "UPI" && ord.utrNumber ? (
                      <span className="px-2.5 py-1 rounded-md bg-[#FFBE32]/10 border border-[#FFBE32]/30 text-[#FFBE32] flex items-center gap-2">
                        <span>UTR: <strong>{ord.utrNumber}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(ord.utrNumber!, ord.id)}
                          className="hover:text-white cursor-pointer"
                          title="Copy UTR Number"
                        >
                          {copiedUtr === ord.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </span>
                    ) : ord.paymentMethod === "UPI" ? (
                      <span className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px]">
                        ⚠️ UTR Not Submitted
                      </span>
                    ) : null}

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-heading font-bold ${
                        ord.paymentStatus === "PAID" || ord.paymentStatus === "VERIFIED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </div>

                  {/* Shipping & Delivery Partner Status */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-[#FFBE32]" />
                      <span>
                        Courier:{" "}
                        <strong className="text-white">{ord.courierPartner || "Not assigned"}</strong>
                      </span>
                    </div>

                    {ord.trackingNumber && (
                      <div className="flex items-center gap-2">
                        <span>AWB:</span>
                        <strong className="text-[#FFBE32]">{ord.trackingNumber}</strong>
                        <button
                          type="button"
                          onClick={() => handleOpenLiveTracking(ord)}
                          className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Truck className="h-3 w-3" />
                          <span>Track Live</span>
                        </button>
                      </div>
                    )}

                    {ord.expectedDeliveryDate && (
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Expected Delivery: {ord.expectedDeliveryDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer Address */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                    <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span>
                      {ord.address}, {ord.city}, {ord.state} - {ord.pincode} ({ord.customerPhone})
                    </span>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end gap-3 pt-3 xl:pt-0 border-t xl:border-t-0 border-white/5 shrink-0">
                  {/* WhatsApp Customer */}
                  <a
                    href={`https://wa.me/${phoneClean}?text=Hello%20${encodeURIComponent(
                      ord.customerName
                    )},%20update%20regarding%20your%20MG%20Esports%20order%20${ord.orderNumber}:`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Manage Shipping & Tracking Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenTrackingModal(ord)}
                      className="px-4 py-2 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(255,190,50,0.3)] flex-1 sm:flex-initial justify-center"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Fulfill / Tracking</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(ord.id, ord.orderNumber)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 cursor-pointer transition-colors"
                      title="Delete Order"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Quick Status Select */}
                  <select
                    value={ord.orderStatus}
                    onChange={(e) => handleQuickStatusChange(ord.id, e.target.value)}
                    className="rounded-xl border border-white/15 bg-black px-3 py-2 text-xs font-heading font-bold text-white focus:border-[#FFBE32] focus:outline-none cursor-pointer w-full sm:w-auto"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispatch & Tracking Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/40 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-[#FFBE32]">
                  ORDER DISPATCH &amp; SHIPPING
                </span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-white mt-0.5">
                  Order {trackingModalOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="space-y-4">
              {/* Order Status */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Order Status *
                </label>
                <select
                  value={trackingForm.orderStatus}
                  onChange={(e) => setTrackingForm({ ...trackingForm, orderStatus: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-heading font-bold"
                >
                  <option value="PENDING">PENDING (Order Placed)</option>
                  <option value="PROCESSING">PROCESSING (Printing / Customization)</option>
                  <option value="SHIPPED">SHIPPED (In Transit)</option>
                  <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Courier Partner & AWB */}
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                      Courier Partner (Carrier) *
                    </label>
                    <select
                      value={selectedCourierSlug}
                      onChange={(e) => {
                        const slug = e.target.value;
                        setSelectedCourierSlug(slug);
                        const match = POPULAR_COURIERS.find((c) => c.slug === slug);
                        setTrackingForm({
                          ...trackingForm,
                          courierPartner: match?.name || "India Post Domestic",
                        });
                      }}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-body"
                    >
                      <option value="india-post">🇮🇳 India Post Domestic (india-post) — Recommended</option>
                      <option value="india-post-int">🌍 India Post International (india-post-int)</option>
                      <option value="delhivery">📦 Delhivery (delhivery)</option>
                      <option value="bluedart">⚡ Blue Dart Express (bluedart)</option>
                      <option value="dtdc">📫 DTDC India (dtdc)</option>
                      <option value="shadowfax">🚀 Shadowfax (shadowfax)</option>
                      <option value="ecom-express">🚚 Ecom Express (ecom-express)</option>
                      <option value="xpressbees">🐝 XpressBees (xpressbees)</option>
                      <option value="dhl">✈️ DHL Express (dhl)</option>
                      <option value="fedex">🌐 FedEx (fedex)</option>
                      <option value="other">⚙️ Other / Custom Carrier</option>
                    </select>

                    {selectedCourierSlug === "other" && (
                      <input
                        type="text"
                        value={trackingForm.courierPartner}
                        onChange={(e) => setTrackingForm({ ...trackingForm, courierPartner: e.target.value })}
                        placeholder="Enter courier name"
                        className="mt-2 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-[#FFBE32] focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                      Tracking / AWB Number *
                    </label>
                    <input
                      type="text"
                      value={trackingForm.trackingNumber}
                      onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                      placeholder="e.g. CL510579225IN or DEL-9988112"
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono tracking-wider font-bold"
                    />
                  </div>
                </div>

                {/* AfterShip 1-Click Sync & Tracking Link Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSyncAftershipNow}
                      disabled={syncingAftership || !trackingForm.trackingNumber.trim()}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${syncingAftership ? "animate-spin" : ""}`} />
                      <span>{syncingAftership ? "Syncing..." : "Sync to AfterShip"}</span>
                    </button>

                    {aftershipSyncMessage && (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {aftershipSyncMessage}
                      </span>
                    )}
                  </div>

                  {trackingForm.trackingNumber.trim() && (
                    <a
                      href={getAftershipTrackingUrl(selectedCourierSlug, trackingForm.trackingNumber)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#FFBE32] hover:underline font-mono flex items-center gap-1"
                    >
                      <span>Preview Live Tracking URL</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Expected Delivery Date (Will Show on Player's Tracking) *
                </label>
                <input
                  type="text"
                  value={trackingForm.expectedDeliveryDate}
                  onChange={(e) => setTrackingForm({ ...trackingForm, expectedDeliveryDate: e.target.value })}
                  placeholder="e.g. 26 Sep 2026 or 3-5 Business Days"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-body"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  This date is displayed directly in the user's "Track My Order" section.
                </p>
              </div>

              {/* Payment Verification Status */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Payment Verification Status
                </label>
                <select
                  value={trackingForm.paymentStatus}
                  onChange={(e) => setTrackingForm({ ...trackingForm, paymentStatus: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-body"
                >
                  <option value="PAID">PAID / VERIFIED</option>
                  <option value="PENDING_VERIFICATION">PENDING VERIFICATION (Check UTR)</option>
                  <option value="COD_PENDING">COD PENDING (Pay on Delivery)</option>
                  <option value="FAILED">FAILED / REJECTED</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setTrackingModalOrder(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 text-xs font-heading font-bold uppercase text-gray-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)]"
                >
                  Update Order Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LIVE COURIER CHECKPOINTS MODAL ================= */}
      {liveTrackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-[#FFBE32]" />
                <div>
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
                    Live Courier Tracking
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Order #{liveTrackingOrder.orderNumber} • AWB: {liveTrackingOrder.trackingNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLiveTrackingOrder(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {liveTrackingLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <RefreshCw className="h-8 w-8 text-[#FFBE32] animate-spin" />
                  <p className="text-xs text-gray-400 font-mono">Fetching latest checkpoints from carrier...</p>
                </div>
              ) : liveTrackingData ? (
                <>
                  {/* Status Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-black/60 to-black/60 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                        Carrier Status
                      </span>
                      <h4 className="text-lg font-heading font-black uppercase tracking-wider text-white">
                        {liveTrackingData.subtagMessage || liveTrackingData.tag || "In Transit"}
                      </h4>
                      <p className="text-xs text-gray-300 font-mono mt-0.5">
                        Courier: <strong className="text-[#FFBE32]">{liveTrackingData.courierName}</strong>
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border self-start sm:self-center ${
                        liveTrackingData.tag === "Delivered"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : liveTrackingData.tag === "OutForDelivery"
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {liveTrackingData.tag || "In Transit"}
                    </span>
                  </div>

                  {/* Route & Expected Delivery */}
                  {(liveTrackingData.originLocation ||
                    liveTrackingData.destinationLocation ||
                    liveTrackingData.expectedDelivery) && (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono">
                      <div>
                        <span className="text-gray-500 block text-[10px]">ORIGIN / DESTINATION</span>
                        <span className="text-white">
                          {liveTrackingData.originLocation || "Origin"} →{" "}
                          {liveTrackingData.destinationLocation || "Destination"}
                        </span>
                      </div>
                      {liveTrackingData.expectedDelivery && (
                        <div>
                          <span className="text-gray-500 block text-[10px]">ESTIMATED DELIVERY</span>
                          <span className="text-emerald-400 font-bold">{liveTrackingData.expectedDelivery}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkpoints Timeline */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-heading font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#FFBE32]" />
                      <span>Shipment Journey ({liveTrackingData.checkpoints?.length || 0} Checkpoints)</span>
                    </h5>

                    {liveTrackingData.checkpoints && liveTrackingData.checkpoints.length > 0 ? (
                      <div className="space-y-3 border-l-2 border-white/10 ml-2 pl-4 py-1">
                        {liveTrackingData.checkpoints
                          .slice()
                          .reverse()
                          .map((cp, idx) => (
                            <div key={idx} className="relative">
                              <div
                                className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-black ${
                                  idx === 0 ? "bg-[#FFBE32] ring-2 ring-[#FFBE32]/40" : "bg-gray-600"
                                }`}
                              />
                              <div className="text-xs">
                                <span className="font-bold text-white block">
                                  {cp.message || cp.subtag_message || "Checkpoint Update"}
                                </span>
                                <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                                  {cp.location && (
                                    <span className="flex items-center gap-1 text-[#FFBE32]">
                                      <MapPin className="h-3 w-3" />
                                      {cp.location}
                                    </span>
                                  )}
                                  {cp.checkpoint_time && (
                                    <span>
                                      {new Date(cp.checkpoint_time).toLocaleString("en-IN", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center text-xs font-mono text-gray-400">
                        Package registered with carrier. Initial depot scan pending.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400 font-mono">
                  Could not retrieve checkpoints. Please use the carrier's direct tracking link below.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5 flex flex-wrap items-center justify-between gap-3">
              <a
                href={
                  liveTrackingData?.courierTrackingUrl ||
                  getCourierDirectUrl(
                    detectCourierSlug(liveTrackingOrder.courierPartner),
                    liveTrackingOrder.trackingNumber!
                  )
                }
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,190,50,0.3)] cursor-pointer"
              >
                <span>Carrier Website</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <a
                href={
                  liveTrackingData?.aftershipTrackingUrl ||
                  getAftershipTrackingUrl(
                    detectCourierSlug(liveTrackingOrder.courierPartner),
                    liveTrackingOrder.trackingNumber!
                  )
                }
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl border border-white/15 hover:border-white/30 text-xs text-gray-300 hover:text-white flex items-center gap-1.5"
              >
                <span>AfterShip Tracker</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
