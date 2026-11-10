import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Truck,
  Check,
  Copy,
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  PackageCheck,
  RotateCcw,
  Sparkles,
  Phone,
  AlertCircle,
  ArrowRight,
  User,
} from "lucide-react";
import { merchandiseApi, type OrderItem } from "../api/merchandise";
import {
  courierApi,
  detectCourierSlug,
  getAftershipTrackingUrl,
  getCourierDirectUrl,
  type TrackingResponse,
} from "../api/courier";
import { useAuth } from "../context/AuthContext";
import { SEO } from "../components/common/SEO";

export const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Active view tab: "SEARCH" or "MY_ACCOUNT"
  const [activeTab, setActiveTab] = useState<"SEARCH" | "MY_ACCOUNT">("SEARCH");
  const [myOrders, setMyOrders] = useState<OrderItem[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);

  // Live AfterShip tracking state per order
  const [liveTrackingMap, setLiveTrackingMap] = useState<Record<string, TrackingResponse>>({});
  const [loadingTrackingMap, setLoadingTrackingMap] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Perform order search by orderNumber, phone, or email
  const executeSearch = async (queryToSearch: string) => {
    const clean = queryToSearch.trim();
    if (!clean) return;

    setLoading(true);
    setSearched(true);
    try {
      const results = await merchandiseApi.trackOrders(clean);
      setOrders(results || []);

      // Auto-fetch carrier checkpoints for orders with tracking numbers
      results.forEach((ord) => {
        if (ord.trackingNumber) {
          fetchLiveTracking(ord.id, ord.trackingNumber, ord.courierPartner);
        }
      });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time AfterShip carrier checkpoints
  const fetchLiveTracking = async (
    orderId: string,
    trackingNumber: string,
    courierPartner?: string | null
  ) => {
    if (loadingTrackingMap[orderId] || liveTrackingMap[orderId]) return;

    setLoadingTrackingMap((prev) => ({ ...prev, [orderId]: true }));
    try {
      const slug = detectCourierSlug(courierPartner);
      const data = await courierApi.track(trackingNumber, slug);
      setLiveTrackingMap((prev) => ({ ...prev, [orderId]: data }));

      // If AfterShip reports package as Delivered, auto-sync order status both locally and to database
      const isDeliveredByAftership =
        data.tag?.toLowerCase() === "delivered" ||
        data.subtagMessage?.toLowerCase()?.includes("delivered");

      if (isDeliveredByAftership) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  orderStatus: "DELIVERED",
                  expectedDeliveryDate:
                    o.expectedDeliveryDate || data.expectedDelivery || "Delivered",
                }
              : o
          )
        );
        setMyOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  orderStatus: "DELIVERED",
                  expectedDeliveryDate:
                    o.expectedDeliveryDate || data.expectedDelivery || "Delivered",
                }
              : o
          )
        );

        // Sync with backend API silently so database reflects DELIVERED
        merchandiseApi.updateOrderStatus(orderId, "DELIVERED").catch(() => {});
      }
    } catch {
      // Handled gracefully by courierApi
    } finally {
      setLoadingTrackingMap((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Load authenticated user orders
  const loadMyOrders = async () => {
    if (!isAuthenticated) return;
    setLoadingMyOrders(true);
    try {
      const data = await merchandiseApi.getMyOrders();
      setMyOrders(data || []);
      data.forEach((ord) => {
        if (ord.trackingNumber) {
          fetchLiveTracking(ord.id, ord.trackingNumber, ord.courierPartner);
        }
      });
    } catch {
      setMyOrders([]);
    } finally {
      setLoadingMyOrders(false);
    }
  };

  // Read URL query parameter on load (e.g. /track?order=MG-2026-1042 or /track?q=...)
  useEffect(() => {
    const queryFromUrl =
      searchParams.get("order") ||
      searchParams.get("q") ||
      searchParams.get("awb") ||
      searchParams.get("id");

    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
      executeSearch(queryFromUrl);
    } else if (isAuthenticated && user?.email) {
      setSearchQuery(user.email);
      executeSearch(user.email);
    }
  }, [searchParams, isAuthenticated, user]);

  useEffect(() => {
    if (activeTab === "MY_ACCOUNT") {
      loadMyOrders();
    }
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const displayedOrders = activeTab === "MY_ACCOUNT" ? myOrders : orders;

  return (
    <>
      <SEO
        title="Track Order | MG ESPORTS Official Store & Fulfillment"
        description="Track your MG ESPORTS merchandise orders, India Post tracking numbers, dispatch estimates, and doorstep delivery updates."
        canonicalPath="/track"
      />

      <div className="relative min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[350px] bg-[#fc8100]/8 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[300px] bg-amber-500/5 blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto space-y-8">
          {/* Header & Breadcrumb */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#fc8100] uppercase tracking-wider">
              <Truck className="h-3.5 w-3.5 text-[#fc8100]" />
              <span>Real-Time Courier Tracking • India Post &amp; Global</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl uppercase tracking-wider text-white">
              TRACK YOUR <span className="text-[#fc8100]">ORDER</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 font-body max-w-2xl mx-auto">
              Look up your MG Esports combat jersey, apparel, and merchandise dispatches. Enter your Order Number (<code className="text-[#fc8100]">MG-2026-XXXX</code>), registered mobile number, or email.
            </p>
          </div>

          {/* Tab Selector: Search vs My Account */}
          {isAuthenticated && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("SEARCH")}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "SEARCH"
                    ? "bg-[#fc8100] text-black shadow-[0_0_15px_rgba(252, 129, 0,0.3)]"
                    : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                Search Order
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("MY_ACCOUNT")}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "MY_ACCOUNT"
                    ? "bg-[#fc8100] text-black shadow-[0_0_15px_rgba(252, 129, 0,0.3)]"
                    : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>My Account Orders ({myOrders.length})</span>
              </button>
            </div>
          )}

          {/* Search Box Card */}
          {activeTab === "SEARCH" && (
            <div className="rounded-2xl border border-white/10 bg-[#0E0E12] p-5 sm:p-7 shadow-2xl space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter Order # (e.g. MG-2026-1042), Mobile Number, or Email..."
                      className="w-full rounded-xl border border-white/15 bg-black/60 pl-10 pr-4 py-3 text-sm text-white focus:border-[#fc8100] focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(252, 129, 0,0.3)] shrink-0 disabled:opacity-50 transition-all"
                  >
                    {loading ? "Searching..." : "Track Shipment"}
                  </button>
                </div>

                {/* Quick search pills */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 font-mono">
                  <span>Try examples:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("MG-2026-1042");
                      executeSearch("MG-2026-1042");
                    }}
                    className="text-[#fc8100] hover:underline cursor-pointer"
                  >
                    MG-2026-1042
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("CL510579225IN");
                      executeSearch("CL510579225IN");
                    }}
                    className="text-[#fc8100] hover:underline cursor-pointer"
                  >
                    CL510579225IN (India Post)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("rahul.v@gmail.com");
                      executeSearch("rahul.v@gmail.com");
                    }}
                    className="text-[#fc8100] hover:underline cursor-pointer"
                  >
                    rahul.v@gmail.com
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loading Indicator */}
          {(loading || loadingMyOrders) && (
            <div className="py-16 text-center space-y-3">
              <div className="h-8 w-8 border-2 border-[#fc8100] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400 font-mono">Querying MG Esports shipment database...</p>
            </div>
          )}

          {/* No Orders Found */}
          {!loading && searched && activeTab === "SEARCH" && orders.length === 0 && (
            <div className="py-16 text-center bg-black/40 rounded-2xl border border-white/10 p-8 space-y-3">
              <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
              <h3 className="font-heading text-base font-bold uppercase text-white">
                No Orders Found In Database
              </h3>
              <p className="text-xs text-gray-400 font-mono max-w-md mx-auto">
                We could not find any active orders matching "<span className="text-white font-bold">{searchQuery}</span>". Please double-check your Order Reference Number or phone number.
              </p>
              <div className="pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-heading font-bold uppercase text-white"
                >
                  <span>Browse Combat Store</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Orders Results List */}
          {!loading && displayedOrders.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-gray-300">
                  {displayedOrders.length} {displayedOrders.length === 1 ? "Order Found" : "Orders Found"}
                </h2>
                <span className="text-xs font-mono text-gray-500">Live Status Verified</span>
              </div>

              {displayedOrders.map((ord) => {
                const liveData = liveTrackingMap[ord.id];
                const isLoadingTracking = loadingTrackingMap[ord.id];
                const courierSlug = detectCourierSlug(ord.courierPartner);

                // Auto-sync status with AfterShip live verification
                const isCarrierDelivered =
                  liveData?.tag?.toLowerCase() === "delivered" ||
                  liveData?.subtagMessage?.toLowerCase()?.includes("delivered");

                const effectiveStatus =
                  ord.orderStatus === "DELIVERED" || isCarrierDelivered
                    ? "DELIVERED"
                    : ord.orderStatus;

                const isDelivered = effectiveStatus === "DELIVERED";
                const isShipped = effectiveStatus === "SHIPPED" || isDelivered;
                const isProcessing = effectiveStatus === "PROCESSING" || isShipped;
                const isCancelled = effectiveStatus === "CANCELLED";

                return (
                  <div
                    key={ord.id}
                    className="rounded-2xl border border-white/10 bg-[#0E0E12] p-5 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden"
                  >
                    {/* Top Order Metadata Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-[#fc8100]">
                            {ord.orderNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(ord.orderNumber, ord.id)}
                            className="text-gray-400 hover:text-white cursor-pointer"
                            title="Copy Order Number"
                          >
                            {copiedText === ord.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                          Placed on: {new Date(ord.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                            effectiveStatus === "DELIVERED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : effectiveStatus === "SHIPPED"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : effectiveStatus === "PROCESSING"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                              : effectiveStatus === "CANCELLED"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          }`}
                        >
                          {effectiveStatus}
                        </span>
                      </div>
                    </div>

                    {/* Progress Stepper */}
                    {!isCancelled ? (
                      <div className="py-2">
                        <div className="relative">
                          {/* Progress Line */}
                          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2" />
                          <div
                            className="absolute top-1/2 left-0 h-0.5 bg-[#fc8100] -translate-y-1/2 transition-all duration-700"
                            style={{
                              width: isDelivered
                                ? "100%"
                                : isShipped
                                ? "66%"
                                : isProcessing
                                ? "33%"
                                : "0%",
                            }}
                          />

                          {/* Steps */}
                          <div className="relative flex justify-between">
                            {/* Step 1: Placed */}
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full bg-[#fc8100] text-black flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(252, 129, 0,0.5)]">
                                <Check className="h-4 w-4" />
                              </div>
                              <span className="text-[11px] font-heading font-bold text-white uppercase mt-2">
                                Placed
                              </span>
                            </div>

                            {/* Step 2: Processing */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                  isProcessing
                                    ? "bg-[#fc8100] text-black shadow-[0_0_10px_rgba(252, 129, 0,0.5)]"
                                    : "bg-black/80 border border-white/20 text-gray-500"
                                }`}
                              >
                                <Sparkles className="h-4 w-4" />
                              </div>
                              <span
                                className={`text-[11px] font-heading font-bold uppercase mt-2 ${
                                  isProcessing ? "text-white" : "text-gray-500"
                                }`}
                              >
                                Printing
                              </span>
                            </div>

                            {/* Step 3: Shipped */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                  isShipped
                                    ? "bg-[#fc8100] text-black shadow-[0_0_10px_rgba(252, 129, 0,0.5)]"
                                    : "bg-black/80 border border-white/20 text-gray-500"
                                }`}
                              >
                                <Truck className="h-4 w-4" />
                              </div>
                              <span
                                className={`text-[11px] font-heading font-bold uppercase mt-2 ${
                                  isShipped ? "text-white" : "text-gray-500"
                                }`}
                              >
                                Dispatched
                              </span>
                            </div>

                            {/* Step 4: Delivered */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                  isDelivered
                                    ? "bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                    : "bg-black/80 border border-white/20 text-gray-500"
                                }`}
                              >
                                <PackageCheck className="h-4 w-4" />
                              </div>
                              <span
                                className={`text-[11px] font-heading font-bold uppercase mt-2 ${
                                  isDelivered ? "text-emerald-400 font-extrabold" : "text-gray-500"
                                }`}
                              >
                                Delivered
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono text-center">
                        This order has been cancelled. Please contact clan support for assistance.
                      </div>
                    )}

                    {/* Delivery & Expected Date Card */}
                    <div
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono transition-colors ${
                        isDelivered
                          ? "bg-gradient-to-r from-emerald-500/15 via-black/60 to-black/60 border-emerald-500/40"
                          : "bg-gradient-to-r from-amber-500/10 via-black/60 to-black/60 border-amber-500/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 text-white font-bold font-heading">
                          <Calendar
                            className={`h-4 w-4 ${isDelivered ? "text-emerald-400" : "text-[#fc8100]"}`}
                          />
                          <span>{isDelivered ? "DELIVERY CONFIRMED:" : "EXPECTED DELIVERY:"}</span>
                          <span
                            className={
                              isDelivered
                                ? "text-emerald-400 text-sm font-bold"
                                : "text-[#fc8100] text-sm"
                            }
                          >
                            {isDelivered
                              ? ord.expectedDeliveryDate ||
                                liveData?.expectedDelivery ||
                                "Package Delivered to Recipient"
                              : ord.expectedDeliveryDate || "Dispatched in 48-72h"}
                          </span>
                        </div>
                        {ord.courierPartner && (
                          <div className="flex flex-wrap items-center gap-2 text-gray-300 mt-1">
                            <span>
                              Carrier: <strong className="text-white">{ord.courierPartner}</strong>
                            </span>
                            {ord.trackingNumber && (
                              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-white/15 text-white">
                                <span>
                                  AWB: <strong>{ord.trackingNumber}</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(ord.trackingNumber!, `awb-${ord.id}`)}
                                  className="text-gray-400 hover:text-white cursor-pointer ml-1"
                                  title="Copy AWB Number"
                                >
                                  {copiedText === `awb-${ord.id}` ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-gray-400">Payment: </span>
                        <span className="text-white font-bold">{ord.paymentMethod}</span>
                        <span className="text-gray-400 text-[11px] block">
                          Status: <strong className="text-emerald-400">{ord.paymentStatus}</strong>
                        </span>
                        {ord.utrNumber && (
                          <p className="text-[#fc8100] text-[11px]">UTR: {ord.utrNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Live Carrier Checkpoints & Journey */}
                    {ord.trackingNumber && (
                      <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-white">
                            <Clock className="h-4 w-4 text-[#fc8100]" />
                            <span>Live Carrier Checkpoints (AfterShip Integration)</span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              fetchLiveTracking(ord.id, ord.trackingNumber!, ord.courierPartner)
                            }
                            disabled={isLoadingTracking}
                            className="text-[11px] font-mono text-gray-400 hover:text-[#fc8100] flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className={`h-3 w-3 ${isLoadingTracking ? "animate-spin" : ""}`} />
                            <span>Refresh</span>
                          </button>
                        </div>

                        {isLoadingTracking ? (
                          <div className="py-6 text-center text-xs font-mono text-gray-400">
                            Retrieving latest carrier scan updates...
                          </div>
                        ) : liveData ? (
                          <div className="space-y-4">
                            {/* Carrier Status Tag */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                              <div>
                                <span className="text-gray-400">Carrier Status: </span>
                                <strong className="text-white">
                                  {liveData.subtagMessage || liveData.tag || "In Transit"}
                                </strong>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  liveData.tag === "Delivered"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                }`}
                              >
                                {liveData.tag || "In Transit"}
                              </span>
                            </div>

                            {/* Checkpoints Timeline */}
                            {liveData.checkpoints && liveData.checkpoints.length > 0 ? (
                              <div className="space-y-3 border-l-2 border-white/10 ml-2 pl-4 py-1">
                                {liveData.checkpoints
                                  .slice()
                                  .reverse()
                                  .map((cp, idx) => (
                                    <div key={idx} className="relative">
                                      <div
                                        className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-black ${
                                          idx === 0
                                            ? "bg-[#fc8100] ring-2 ring-[#fc8100]/40"
                                            : "bg-gray-600"
                                        }`}
                                      />
                                      <div className="text-xs">
                                        <span className="font-bold text-white block">
                                          {cp.message || cp.subtag_message || "Checkpoint Update"}
                                        </span>
                                        <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                                          {cp.location && (
                                            <span className="flex items-center gap-1 text-[#fc8100]">
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
                              <div className="text-xs text-gray-400 font-mono py-2">
                                Package registered with carrier. Initial hub scan pending.
                              </div>
                            )}

                            {/* External Tracking Links */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5 text-xs font-mono">
                              <a
                                href={
                                  liveData.courierTrackingUrl ||
                                  getCourierDirectUrl(courierSlug, ord.trackingNumber)
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 rounded-lg bg-[#fc8100] hover:bg-[#e07200] text-black font-bold uppercase tracking-wider flex items-center gap-1"
                              >
                                <span>Carrier Website</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <a
                                href={
                                  liveData.aftershipTrackingUrl ||
                                  getAftershipTrackingUrl(courierSlug, ord.trackingNumber)
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-gray-300 hover:text-white flex items-center gap-1"
                              >
                                <span>AfterShip Portal</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-gray-400">Carrier Scan: Registered with courier</span>
                            <a
                              href={getCourierDirectUrl(courierSlug, ord.trackingNumber)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#fc8100] hover:underline flex items-center gap-1"
                            >
                              <span>Track on Carrier Website</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{ord.productName}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-300">
                          Size: <strong>{ord.size}</strong>
                        </span>
                        {ord.customIgn && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-[#fc8100] font-bold flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              IGN: {ord.customIgn} #{ord.customNumber || "00"}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="font-mono font-bold text-white text-sm">₹{ord.totalAmount}</span>
                    </div>

                    {/* Address & Clan Support */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs font-mono">
                      <div className="text-gray-400">
                        <span>Ship To: </span>
                        <strong className="text-white">{ord.customerName}</strong>
                        {ord.city && ` • ${ord.city}, ${ord.state} - ${ord.pincode}`}
                      </div>

                      <a
                        href={`https://wa.me/919876543210?text=Hello%20MG%20Esports,%20I%20have%20an%20inquiry%20regarding%20my%20order%20${ord.orderNumber}:`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#fc8100] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                      >
                        <Phone className="h-3 w-3" />
                        <span>Clan Support WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Need Help Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-black/80 via-[#0E0E12] to-black/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
            <div className="space-y-1">
              <h4 className="font-heading font-bold text-white uppercase tracking-wider text-sm">
                Need Help With Order Fulfillment?
              </h4>
              <p className="text-gray-400 max-w-xl">
                For custom IGN print changes, courier rerouting, or UPI payment verification inquiries, reach out directly to clan support.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="mailto:contact@mgesports.gg"
                className="px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 text-white font-heading font-bold uppercase text-xs"
              >
                Email Support
              </a>
              <Link
                to="/products"
                className="px-4 py-2 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading font-bold uppercase text-xs shadow-[0_0_15px_rgba(252, 129, 0,0.3)]"
              >
                Store Armory
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
