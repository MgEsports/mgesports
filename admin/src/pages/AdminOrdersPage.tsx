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
} from "lucide-react";

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"LIST" | "USERS">("LIST");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderItem | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const [trackingForm, setTrackingForm] = useState({
    orderStatus: "PENDING",
    courierPartner: "Delhivery",
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
    setTrackingForm({
      orderStatus: ord.orderStatus || "PENDING",
      courierPartner: ord.courierPartner || "Delhivery",
      trackingNumber: ord.trackingNumber || "",
      expectedDeliveryDate: ord.expectedDeliveryDate || "",
      paymentStatus: ord.paymentStatus || "PENDING",
      adminNotes: ord.adminNotes || "",
    });
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

      setOrders((prev) =>
        prev.map((o) =>
          o.id === trackingModalOrder.id ? { ...o, ...trackingForm } as OrderItem : o
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-wider text-white">
          MERCHANDISE ORDER FULFILLMENT &amp; TRACKING
        </h1>
        <p className="text-xs text-gray-400 font-body">
          Manage customer apparel orders, verify UPI UTR numbers, assign couriers, and set expected delivery dates.
        </p>
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
                            <div className="text-[11px] font-mono text-gray-400">
                              Courier: {ord.courierPartner || "Standard"} • AWB: {ord.trackingNumber}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTrackingModal(ord);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#FFBE32]/10 hover:bg-[#FFBE32] text-[#FFBE32] hover:text-black border border-[#FFBE32]/30 text-xs font-heading font-bold uppercase transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Update Tracking</span>
                        </button>
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
                      <div className="flex items-center gap-1.5">
                        <span>AWB:</span>
                        <strong className="text-[#FFBE32]">{ord.trackingNumber}</strong>
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
                    )},%20update%20regarding%20your%20Lord%20Esports%20order%20${ord.orderNumber}:`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Manage Shipping & Tracking Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenTrackingModal(ord)}
                    className="px-4 py-2 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(255,190,50,0.3)] w-full sm:w-auto justify-center"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Manage Dispatch</span>
                  </button>

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

              {/* Courier Partner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Courier Partner
                  </label>
                  <input
                    type="text"
                    value={trackingForm.courierPartner}
                    onChange={(e) => setTrackingForm({ ...trackingForm, courierPartner: e.target.value })}
                    placeholder="Delhivery / BlueDart / DTDC"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-body"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Tracking / AWB Number
                  </label>
                  <input
                    type="text"
                    value={trackingForm.trackingNumber}
                    onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                    placeholder="e.g. DEL-9988112"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                  />
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
    </div>
  );
};
