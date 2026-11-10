import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Check,
  CheckCircle2,
  X,
  Truck,
  RotateCcw,
  Loader2,
  QrCode,
  Copy,
  Search,
  Banknote,
  ArrowRight,
  ArrowLeft,
  Calendar,
  User,
  RefreshCw,
  PackageCheck,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Clock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { merchandiseApi, type ProductItem as ApiProductItem, type OrderItem } from "../api/merchandise";
import { settingsApi } from "../api/settings";
import {
  courierApi,
  detectCourierSlug,
  getAftershipTrackingUrl,
  getCourierDirectUrl,
  type TrackingResponse,
} from "../api/courier";
import { useAuth } from "../context/AuthContext";
import { SEO } from "../components/common/SEO";
import { SITE_URL } from "../config/seo";

// Fallback Product Assets
// import jerseyFrontImg from "../assets/jersey-front.jpg";
// import hoodieImg from "../assets/product-hoodie.jpg";
// import mousepadImg from "../assets/product-mousepad.jpg";
// import capImg from "../assets/product-cap.jpg";
// import sleeveImg from "../assets/product-sleeve.jpg";
import { LazyProductImage } from "../components/common/LazyProductImage";
import { getProductFallbackImage, optimizeCloudinaryUrl } from "../utils/imageOptimizer";

export interface LocalProductItem {
  id: string;
  name: string;
  category: string;
  tag: string;
  price: number;
  originalPrice: number;
  image: string;
  description: string;
  specs: string[];
  sizes: string[];
  hasCustomIgn?: boolean;
  upiId?: string;
  upiQrImage?: string;
}

const fallbackCatalog: LocalProductItem[] = [
  
];

function resolveProductImage(p: ApiProductItem): string {
  if (p.frontImage) return optimizeCloudinaryUrl(p.frontImage, 800);
  return getProductFallbackImage(p.name);
}

function parseSpecs(specsString?: string | null): string[] {
  if (!specsString) return ["Official Certified Spec", "Official MG Clan Merchandise"];
  try {
    const parsed = JSON.parse(specsString);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return specsString.split("\n").filter((s) => s.trim().length > 0);
}

function parseSizes(sizesString?: string | null): string[] {
  if (!sizesString) return ["M", "L", "XL"];
  try {
    const parsed = JSON.parse(sizesString);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return ["M", "L", "XL"];
}

export const ProductsPage = () => {
  const [products, setProducts] = useState<LocalProductItem[]>(fallbackCatalog);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LocalProductItem | null>(null);

  // Multi-step checkout states
  const [checkoutStep, setCheckoutStep] = useState<"DETAILS" | "PAYMENT" | "CONFIRMED">("DETAILS");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "COD">("UPI");
  const [codEnabled, setCodEnabled] = useState(true);

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((s) => {
        if (s.codEnabled !== undefined) {
          const isEnabled = s.codEnabled !== "false";
          setCodEnabled(isEnabled);
          if (!isEnabled) {
            setPaymentMode("UPI");
          }
        }
      })
      .catch(() => {});
  }, []);
  const [utrNumber, setUtrNumber] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderItem | null>(null);

  const { user, isAuthenticated } = useAuth();

  // User Order History & Tab States
  const [myOrders, setMyOrders] = useState<OrderItem[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [trackViewTab, setTrackViewTab] = useState<"MY_ORDERS" | "SEARCH">("MY_ORDERS");

  // Tracking Modal states
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<OrderItem[]>([]);
  const [trackSearched, setTrackSearched] = useState(false);

  // Checkout Form Details
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    city: "Kochi",
    state: "Keralam",
    pincode: "",
    size: "L",
    customIgn: "BEAST",
    customNumber: "00",
  });

  const loadUserOrders = async () => {
    if (!isAuthenticated) return;
    setLoadingMyOrders(true);
    try {
      const data = await merchandiseApi.getMyOrders();
      setMyOrders(data || []);
    } catch {
      setMyOrders([]);
    } finally {
      setLoadingMyOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUserOrders();
      setTrackViewTab("MY_ORDERS");
    } else {
      setTrackViewTab("SEARCH");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || user.fullName || user.username || "",
        customerEmail: prev.customerEmail || user.email || "",
        customerPhone: prev.customerPhone || user.phone || "",
        customIgn: prev.customIgn === "BEAST" && user.ign ? user.ign : prev.customIgn,
      }));
    }
  }, [user]);

  const groupedOrders = useMemo(() => {
    const map = new Map<
      string,
      { customerName: string; customerEmail: string; customerPhone: string; orders: OrderItem[] }
    >();

    trackedOrders.forEach((ord) => {
      const email = ord.customerEmail?.toLowerCase().trim() || "";
      const phone = ord.customerPhone?.replace(/[^0-9]/g, "") || "";
      const key = email || phone || ord.orderNumber;

      if (!map.has(key)) {
        map.set(key, {
          customerName: ord.customerName,
          customerEmail: ord.customerEmail,
          customerPhone: ord.customerPhone,
          orders: [],
        });
      }
      map.get(key)!.orders.push(ord);
    });

    return Array.from(map.values());
  }, [trackedOrders]);

  const loadProducts = () => {
    merchandiseApi
      .getProducts()
      .then((data) => {
        if (Array.isArray(data)) {
          if (data.length === 0) {
            setProducts([]);
            return;
          }
          const mapped: LocalProductItem[] = data.map((p) => {
            const rawCat = (p.category || "JERSEY").toUpperCase();
            let cat = "JERSEYS";
            if (rawCat === "HOODIE" || rawCat === "APPAREL") cat = "APPAREL";
            else if (rawCat === "ACCESSORY" || rawCat === "GEAR") cat = "GEAR";
            else cat = "JERSEYS";

            return {
              id: p.id,
              name: p.name,
              category: cat,
              tag: p.tag || "OFFICIAL ATHLETE SPEC",
              price: p.price,
              originalPrice: p.originalPrice || Math.round(p.price * 1.4),
              image: resolveProductImage(p),
              description: p.description || p.subtitle || "Engineered for high-pressure competitive gaming.",
              specs: parseSpecs(p.specs),
              sizes: parseSizes(p.sizes),
              hasCustomIgn: p.hasCustomIgn ?? (rawCat === "JERSEY"),
              upiId: p.upiId || "mgesports@upi",
              upiQrImage: p.upiQrImage || undefined,
            };
          });
          setProducts(mapped);
        }
      })
      .catch(() => {
        setProducts([]);
      });
  };

  useEffect(() => {
    loadProducts();

    // Re-fetch on tab focus so additions in admin portal reflect immediately
    window.addEventListener("focus", loadProducts);
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadProducts();
      }
    }, 45000);

    return () => {
      window.removeEventListener("focus", loadProducts);
      clearInterval(interval);
    };
  }, []);

  const handleOpenBuy = (product: LocalProductItem) => {
    setSelectedProduct(product);
    setFormData((prev) => ({
      ...prev,
      size: product.sizes[0] || "L",
    }));
    setCheckoutStep("DETAILS");
    setPaymentMode("UPI");
    setUtrNumber("");
    setConfirmedOrder(null);
    setOrderModalOpen(true);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep("PAYMENT");
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (paymentMode === "UPI" && !utrNumber.trim()) {
      alert("Please enter the 12-digit UPI UTR / Transaction Reference Number after completing payment.");
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || "fan@mgesports.in",
        customerPhone: formData.customerPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        size: formData.size,
        customIgn: selectedProduct.hasCustomIgn ? formData.customIgn.toUpperCase() : null,
        customNumber: selectedProduct.hasCustomIgn ? formData.customNumber : null,
        totalAmount: selectedProduct.price,
        paymentMethod: paymentMode,
        utrNumber: paymentMode === "UPI" ? utrNumber.trim() : null,
        paymentStatus: paymentMode === "UPI" ? "PENDING_VERIFICATION" : "COD_PENDING",
      };

      const res = await merchandiseApi.createOrder(orderPayload);
      const created = res || {
        id: `ord-${Date.now()}`,
        orderNumber: `MG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        ...orderPayload,
        orderStatus: "PENDING" as const,
        createdAt: new Date().toISOString(),
      };

      setConfirmedOrder(created);
      setCheckoutStep("CONFIRMED");
      loadUserOrders();

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#FFBE32", "#FFFFFF", "#F59E0B"],
        });
      } catch {}
    } catch {
      // Graceful offline fallback
      const offlineOrder: OrderItem = {
        id: `ord-${Date.now()}`,
        orderNumber: `MG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        productName: selectedProduct.name,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || "fan@mgesports.in",
        customerPhone: formData.customerPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        size: formData.size,
        customIgn: formData.customIgn,
        customNumber: formData.customNumber,
        totalAmount: selectedProduct.price,
        paymentMethod: paymentMode,
        paymentStatus: paymentMode === "UPI" ? "PENDING_VERIFICATION" : "COD_PENDING",
        utrNumber: paymentMode === "UPI" ? utrNumber.trim() : null,
        orderStatus: "PENDING",
        createdAt: new Date().toISOString(),
      };
      setConfirmedOrder(offlineOrder);
      setCheckoutStep("CONFIRMED");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyUpi = (upi: string) => {
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSearchTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    setTrackingLoading(true);
    setTrackSearched(true);
    try {
      const orders = await merchandiseApi.trackOrders(trackQuery.trim());
      setTrackedOrders(orders || []);
    } catch {
      setTrackedOrders([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Live Courier Checkpoints Tracking Modal
  const [liveTrackingOrder, setLiveTrackingOrder] = useState<OrderItem | null>(null);
  const [liveTrackingLoading, setLiveTrackingLoading] = useState(false);
  const [liveTrackingData, setLiveTrackingData] = useState<TrackingResponse | null>(null);

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
      // Handled gracefully
    } finally {
      setLiveTrackingLoading(false);
    }
  };

  const handleCopyTracking = (trackNum: string, orderId: string) => {
    navigator.clipboard.writeText(trackNum);
    setCopiedTracking(orderId);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const renderOrderCard = (ord: OrderItem) => {
    const isShipped = ord.orderStatus === "SHIPPED" || ord.orderStatus === "DELIVERED";
    const isDelivered = ord.orderStatus === "DELIVERED";
    const isProcessing = ord.orderStatus === "PROCESSING" || isShipped;
    const isCancelled = ord.orderStatus === "CANCELLED";

    return (
      <div
        key={ord.id}
        className="p-5 rounded-2xl bg-black/80 border border-white/10 hover:border-[#FFBE32]/40 transition-all space-y-4 shadow-lg"
      >
        {/* Order Identity Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <span className="font-mono text-sm font-bold text-[#FFBE32] px-2.5 py-0.5 rounded bg-[#FFBE32]/10 border border-[#FFBE32]/30">
              {ord.orderNumber}
            </span>
            <span className="text-gray-400 font-mono text-xs ml-3">
              {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider ${
              ord.orderStatus === "DELIVERED"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : ord.orderStatus === "SHIPPED"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                : ord.orderStatus === "PROCESSING"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : ord.orderStatus === "CANCELLED"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            }`}
          >
            {ord.orderStatus}
          </span>
        </div>

        {/* Visual 4-Stage Progress Tracker */}
        {!isCancelled ? (
          <div className="py-2">
            <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px]">
              <div>
                <div className="w-7 h-7 rounded-full mx-auto mb-1.5 flex items-center justify-center font-bold bg-[#FFBE32] text-black shadow-[0_0_10px_#FFBE32]">
                  ✓
                </div>
                <span className="text-white font-bold">Placed</span>
              </div>
              <div>
                <div
                  className={`w-7 h-7 rounded-full mx-auto mb-1.5 flex items-center justify-center font-bold transition-all ${
                    isProcessing
                      ? "bg-[#FFBE32] text-black shadow-[0_0_10px_#FFBE32]"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {isProcessing ? "✓" : "2"}
                </div>
                <span className={isProcessing ? "text-white font-bold" : "text-gray-500"}>
                  Customizing
                </span>
              </div>
              <div>
                <div
                  className={`w-7 h-7 rounded-full mx-auto mb-1.5 flex items-center justify-center font-bold transition-all ${
                    isShipped
                      ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {isShipped ? "✓" : "3"}
                </div>
                <span className={isShipped ? "text-blue-400 font-bold" : "text-gray-500"}>
                  Shipped
                </span>
              </div>
              <div>
                <div
                  className={`w-7 h-7 rounded-full mx-auto mb-1.5 flex items-center justify-center font-bold transition-all ${
                    isDelivered
                      ? "bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {isDelivered ? "✓" : "4"}
                </div>
                <span className={isDelivered ? "text-emerald-400 font-bold" : "text-gray-500"}>
                  Delivered
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono text-center">
            This order has been cancelled. If you need assistance, please reach out to clan support.
          </div>
        )}

        {/* Dispatch & Courier Details */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#FFBE32]/10 via-[#0E0E12] to-[#0E0E12] border border-[#FFBE32]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div>
            <div className="flex items-center gap-2 text-white font-bold font-heading">
              <Calendar className="h-4 w-4 text-[#FFBE32]" />
              <span>EXPECTED DELIVERY:</span>
              <span className="text-[#FFBE32] text-sm">
                {ord.expectedDeliveryDate || "Dispatched in 48-72h"}
              </span>
            </div>
            {ord.courierPartner && (
              <div className="flex flex-wrap items-center gap-2 text-gray-300 mt-1">
                <span>Courier: <strong className="text-white">{ord.courierPartner}</strong></span>
                {ord.trackingNumber && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-white/15 text-white">
                      <span>AWB: <strong>{ord.trackingNumber}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopyTracking(ord.trackingNumber!, ord.id)}
                        className="text-gray-400 hover:text-white cursor-pointer ml-1"
                        title="Copy Tracking Number"
                      >
                        {copiedTracking === ord.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenLiveTracking(ord)}
                      className="px-2.5 py-1 rounded bg-[#FFBE32]/15 hover:bg-[#FFBE32]/25 border border-[#FFBE32]/40 text-[#FFBE32] text-[11px] font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(255,190,50,0.2)] transition-all"
                    >
                      <Truck className="h-3 w-3" />
                      <span>Live Courier Tracking</span>
                    </button>
                  </div>
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
              <p className="text-[#FFBE32] text-[11px]">UTR: {ord.utrNumber}</p>
            )}
          </div>
        </div>

        {/* Item & Custom Print Details */}
        <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{ord.productName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-300">Size: <strong>{ord.size}</strong></span>
            {ord.customIgn && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-[#FFBE32] font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  IGN: {ord.customIgn} #{ord.customNumber || "00"}
                </span>
              </>
            )}
          </div>
          <span className="font-mono font-bold text-white text-sm">₹{ord.totalAmount}</span>
        </div>

        {/* Shipping Address */}
        {ord.address && (
          <div className="text-[11px] text-gray-400 font-mono flex items-start gap-1.5 pt-1">
            <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0 mt-0.5" />
            <span>
              Shipping to: {ord.customerName}, {ord.address}, {ord.city}, {ord.state} - {ord.pincode}
            </span>
          </div>
        )}
      </div>
    );
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "ALL") return true;
    return product.category === selectedCategory;
  });

  const activeUpiId = selectedProduct?.upiId || "mgesports@upi";
  const activeQrCodeUrl =
    selectedProduct?.upiQrImage ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(
      activeUpiId
    )}%26pn=MG%20Esports%26am=${selectedProduct?.price || 1299}%26cu=INR`;

  const productsSchema = useMemo(() => {
    return products.slice(0, 10).map((p) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description,
      image: p.image?.startsWith("http") ? p.image : `${SITE_URL}${p.image}`,
      brand: {
        "@type": "Brand",
        name: "MG ESPORTS",
      },
      offers: {
        "@type": "Offer",
        price: p.price,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/products`,
      },
    }));
  }, [products]);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-24 w-full max-w-full overflow-x-hidden relative">
      <SEO
        title="MG ESPORTS Official Merchandise | Pro Combat Jerseys &amp; Gaming Gear"
        description="Shop official MG ESPORTS pro merchandise. High-performance tournament combat jerseys with custom gamer tags, heavyweight hoodies, XXL gaming mousepads, and esports gear."
        canonicalPath="/products"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Products", item: "/products" },
        ]}
        structuredData={productsSchema}
      />

      {/* Ambient Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] max-w-[100vw] h-[500px] bg-radial from-[#FFBE32]/10 via-transparent to-transparent blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFBE32]/10 border border-[#FFBE32]/30">
                <Sparkles className="h-3.5 w-3.5 text-[#FFBE32]" />
                <span className="font-heading text-xs font-bold uppercase tracking-widest text-[#FFBE32]">
                  OFFICIAL CLAN ARMORY &amp; APPAREL
                </span>
              </div>

              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-[#FFBE32]/20 border border-white/20 hover:border-[#FFBE32]/50 text-white hover:text-[#FFBE32] text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <Truck className="h-3.5 w-3.5 text-[#FFBE32]" />
                <span>
                  {isAuthenticated
                    ? `My Orders ${myOrders.length > 0 ? `(${myOrders.length})` : ""}`
                    : "Track My Order"}
                </span>
              </Link>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-wide text-white leading-[1.1]">
              MG ESPORTS <span className="text-gold-gradient">Products</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-gray-400 font-body leading-relaxed max-w-2xl mx-auto">
              Engineered for tournament champions and die-hard fans. Wear the black and gold standard crafted with Dravidian combat aesthetics.
            </p>
          </motion.div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {[
            { label: "ALL PRODUCTS", key: "ALL" },
            { label: "PRO JERSEYS", key: "JERSEYS" },
            { label: "CLAN APPAREL", key: "APPAREL" },
            { label: "GAMING GEAR & ACCESSORIES", key: "GEAR" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === tab.key
                  ? "bg-[#FFBE32] text-black shadow-[0_0_20px_rgba(255,190,50,0.35)] font-extrabold"
                  : "bg-[#0f0f14] text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 px-4 text-center rounded-2xl bg-[#0D0D12] border border-white/10 flex flex-col items-center justify-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#FFBE32]/10 border border-[#FFBE32]/30 flex items-center justify-center text-[#FFBE32]">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg uppercase tracking-wider text-white">
                Official Drops Coming Soon
              </h3>
              <p className="text-xs text-gray-400 font-body max-w-md mx-auto">
                No merchandise items are currently listed in the store. Stay tuned for our upcoming tournament combat jerseys, hoodies, and athlete gear.
              </p>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl bg-[#0D0D12] border border-white/10 hover:border-[#FFBE32]/60 overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.8)] hover:shadow-[0_15px_40px_rgba(255,190,50,0.15)]"
            >
              {/* Product Image Container */}
              <div className="relative h-56 xs:h-64 sm:h-80 w-full overflow-hidden bg-black/60 flex items-center justify-center p-4">
                <div className="absolute top-4 left-4 z-20">
                  <span className="px-3 py-1 rounded-md bg-black/85 border border-[#FFBE32]/40 text-[10px] font-heading font-bold uppercase tracking-wider text-[#FFBE32]">
                    {product.tag}
                  </span>
                </div>

                <LazyProductImage
                  src={product.image}
                  alt={product.name}
                  fallbackSrc={getProductFallbackImage(product.name)}
                  className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
                  width={800}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D12] via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Content */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-500">
                      {product.category}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>IN STOCK</span>
                    </span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wider text-white group-hover:text-[#FFBE32] transition-colors leading-tight">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-xs text-gray-400 font-body line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="mt-3.5 space-y-1.5">
                    {product.specs.slice(0, 2).map((sp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-[11px] text-gray-300 font-body"
                      >
                        <Check className="h-3 w-3 text-[#FFBE32] shrink-0" />
                        <span className="truncate">{sp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl font-extrabold text-[#FFBE32]">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-gray-500 line-through font-mono">
                        ₹{product.originalPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">
                      {codEnabled ? "UPI / Cash on Delivery" : "Prepaid UPI Payment"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenBuy(product)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)] group-hover:shadow-[0_0_25px_rgba(255,190,50,0.5)]"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Order Now</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}

        {/* Armory Trust Badges */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 sm:p-8 rounded-2xl bg-[#0D0D12] border border-white/10 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFBE32]/10 border border-[#FFBE32]/30 flex items-center justify-center shrink-0 text-[#FFBE32]">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                Pan-India Express Dispatch
              </h4>
              <p className="text-xs text-gray-400 font-body mt-0.5">
                Shipped within 48h from Chennai warehouse.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFBE32]/10 border border-[#FFBE32]/30 flex items-center justify-center shrink-0 text-[#FFBE32]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                100% Authentic Pro Gear
              </h4>
              <p className="text-xs text-gray-400 font-body mt-0.5">
                Official tournament spec &amp; sublimation print.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFBE32]/10 border border-[#FFBE32]/30 flex items-center justify-center shrink-0 text-[#FFBE32]">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                Hassle-Free Size Exchange
              </h4>
              <p className="text-xs text-gray-400 font-body mt-0.5">
                7-day exchange support for all apparel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MULTI-STEP CHECKOUT MODAL WITH UPI QR & UTR */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {orderModalOpen && selectedProduct && (
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-[#FFBE32]">
                      OFFICIAL DISPATCH RESERVATION
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      • STEP {checkoutStep === "DETAILS" ? "1 OF 2" : checkoutStep === "PAYMENT" ? "2 OF 2" : "COMPLETE"}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl uppercase tracking-wider text-white mt-0.5 truncate">
                    {selectedProduct.name}
                  </h3>
                </div>
                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* STEP 3: ORDER CONFIRMED */}
              {checkoutStep === "CONFIRMED" && confirmedOrder ? (
                <div className="py-6 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-display text-2xl uppercase tracking-wider text-white">
                      Order Confirmed!
                    </h4>
                    <p className="text-xs text-gray-400 font-body max-w-md mx-auto leading-relaxed mt-1">
                      Your order has been registered in our database. Our dispatch team will review your payment and courier your gear!
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/60 border border-[#FFBE32]/40 space-y-2 text-left max-w-md mx-auto font-mono text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-gray-400">Order Reference:</span>
                      <strong className="text-[#FFBE32] text-sm">{confirmedOrder.orderNumber}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Payment Mode:</span>
                      <span className="text-white font-bold">{confirmedOrder.paymentMethod}</span>
                    </div>
                    {confirmedOrder.utrNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">UTR / Ref:</span>
                        <span className="text-emerald-400">{confirmedOrder.utrNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Amount:</span>
                      <span className="text-white font-bold">₹{confirmedOrder.totalAmount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Deliver To:</span>
                      <span className="text-gray-300 truncate max-w-[200px]">{confirmedOrder.customerName}, {confirmedOrder.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderModalOpen(false);
                        setTrackQuery(confirmedOrder.orderNumber);
                        setTrackModalOpen(true);
                        merchandiseApi.trackOrders(confirmedOrder.orderNumber).then((orders) => {
                          setTrackedOrders(orders);
                          setTrackSearched(true);
                        });
                      }}
                      className="px-6 py-2.5 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)]"
                    >
                      Track My Order Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-white/15 text-xs font-heading font-bold uppercase text-gray-300 hover:text-white cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              ) : checkoutStep === "DETAILS" ? (
                /* STEP 1: CUSTOMER & SIZE DETAILS */
                <form onSubmit={handleProceedToPayment} className="space-y-4">
                  {/* Selected Product Pill */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0">
                        <LazyProductImage
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          fallbackSrc={getProductFallbackImage(selectedProduct.name)}
                          className="h-12 w-12 object-contain"
                          width={200}
                        />
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold uppercase text-white truncate max-w-[220px]">
                          {selectedProduct.name}
                        </h4>
                        <span className="text-xs font-bold text-[#FFBE32] font-mono">
                          ₹{selectedProduct.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                      IN STOCK
                    </span>
                  </div>

                  {/* Size Selector */}
                  {selectedProduct.sizes.length > 1 && (
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1.5">
                        Select Apparel Size *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.sizes.map((sz) => (
                          <button
                            type="button"
                            key={sz}
                            onClick={() => setFormData({ ...formData, size: sz })}
                            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              formData.size === sz
                                ? "bg-[#FFBE32] text-black shadow-[0_0_12px_rgba(255,190,50,0.3)] font-extrabold"
                                : "bg-white/5 text-gray-300 hover:text-white border border-white/10"
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Jersey Custom IGN & Squad Number */}
                  {selectedProduct.hasCustomIgn && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-white/5 border border-[#FFBE32]/30">
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-[#FFBE32] mb-1">
                          Custom Athlete IGN *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.customIgn}
                          onChange={(e) =>
                            setFormData({ ...formData, customIgn: e.target.value })
                          }
                          placeholder="BEAST"
                          className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-[#FFBE32] focus:outline-none font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-heading font-bold uppercase text-[#FFBE32] mb-1">
                          Squad Number (00-99)
                        </label>
                        <input
                          type="text"
                          maxLength={2}
                          value={formData.customNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, customNumber: e.target.value })
                          }
                          placeholder="00"
                          className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-[#FFBE32] focus:outline-none font-mono text-center"
                        />
                      </div>
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({ ...formData, customerName: e.target.value })
                        }
                        placeholder="Karthik R"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-[#FFBE32] focus:outline-none font-body"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                        Phone Number (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, customerPhone: e.target.value })
                        }
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                      Delivery Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Street address, flat / apartment number..."
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-[#FFBE32] focus:outline-none font-body"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="Chennai"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-[#FFBE32] focus:outline-none font-body"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        placeholder="Tamil Nadu"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-[#FFBE32] focus:outline-none font-body"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={formData.pincode}
                        onChange={(e) =>
                          setFormData({ ...formData, pincode: e.target.value })
                        }
                        placeholder="600001"
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-white/15 text-xs font-heading font-bold uppercase text-gray-300 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(255,190,50,0.35)]"
                    >
                      <span>Next: Payment Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 2: PAYMENT (UPI / COD) & UTR NUMBER */
                <form onSubmit={handleConfirmOrder} className="space-y-4">
                  {/* Order Summary Line */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 font-body">Amount Payable:</span>
                      <h4 className="font-display text-xl font-bold text-[#FFBE32]">
                        ₹{selectedProduct.price.toLocaleString("en-IN")}
                      </h4>
                    </div>
                    <div className="text-right text-xs font-mono text-gray-300">
                      <p className="font-bold text-white">{selectedProduct.name}</p>
                      <p className="text-gray-400">Size: {formData.size} {formData.customIgn ? `• IGN: ${formData.customIgn}` : ""}</p>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-2">
                      Choose Payment Method *
                    </label>
                    <div className={`grid gap-3 ${codEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
                      <button
                        type="button"
                        onClick={() => setPaymentMode("UPI")}
                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          paymentMode === "UPI"
                            ? "bg-[#FFBE32]/10 border-[#FFBE32] text-white shadow-[0_0_15px_rgba(255,190,50,0.2)]"
                            : "bg-black/60 border-white/10 text-gray-400 hover:text-white hover:border-white/25"
                        }`}
                      >
                        <QrCode className={`h-5 w-5 mt-0.5 ${paymentMode === "UPI" ? "text-[#FFBE32]" : "text-gray-400"}`} />
                        <div>
                          <h5 className="font-heading text-xs font-bold uppercase text-white">
                            UPI QR / ID {!codEnabled && "(Only Available Mode)"}
                          </h5>
                          <p className="text-[11px] text-gray-400 font-body mt-0.5">
                            GPay, PhonePe, Paytm, BHIM {!codEnabled && "• Instant verification"}
                          </p>
                        </div>
                      </button>

                      {codEnabled && (
                        <button
                          type="button"
                          onClick={() => setPaymentMode("COD")}
                          className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                            paymentMode === "COD"
                              ? "bg-[#FFBE32]/10 border-[#FFBE32] text-white shadow-[0_0_15px_rgba(255,190,50,0.2)]"
                              : "bg-black/60 border-white/10 text-gray-400 hover:text-white hover:border-white/25"
                          }`}
                        >
                          <Banknote className={`h-5 w-5 mt-0.5 ${paymentMode === "COD" ? "text-[#FFBE32]" : "text-gray-400"}`} />
                          <div>
                            <h5 className="font-heading text-xs font-bold uppercase text-white">
                              Cash On Delivery
                            </h5>
                            <p className="text-[11px] text-gray-400 font-body mt-0.5">
                              Pay upon doorstep delivery
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* UPI QR & UTR BOX */}
                  {paymentMode === "UPI" ? (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#0D0D15] to-black border border-[#FFBE32]/40 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* QR Code Container */}
                        <div className="h-32 w-32 bg-white p-2 rounded-xl shrink-0 flex items-center justify-center shadow-lg border border-white/20">
                          <img
                            src={activeQrCodeUrl}
                            alt="Scan UPI QR"
                            className="h-full w-full object-contain"
                          />
                        </div>

                        {/* UPI Instructions & Copy */}
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                          <div className="flex items-center gap-1.5 justify-center sm:justify-start text-[#FFBE32] text-xs font-heading font-bold">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>SCAN WITH ANY UPI APP</span>
                          </div>
                          <p className="text-xs text-gray-300 font-body">
                            Scan QR with Google Pay, PhonePe, Paytm or transfer to UPI ID:
                          </p>

                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black border border-white/15 font-mono text-xs text-white">
                            <span>{activeUpiId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyUpi(activeUpiId)}
                              className="text-[#FFBE32] hover:text-white transition-colors cursor-pointer"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* UTR Input Field */}
                      <div className="pt-3 border-t border-white/10 space-y-1.5">
                        <label className="block text-xs font-heading font-bold uppercase text-[#FFBE32]">
                          Enter 12-Digit UPI UTR / Transaction ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                          placeholder="e.g. 423819283746"
                          className="w-full rounded-xl border border-[#FFBE32]/50 bg-black/80 px-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono tracking-wider"
                        />
                        <p className="text-[11px] text-gray-400 font-body">
                          💡 You can find the 12-digit UTR/UPI Ref in your payment receipt on GPay, PhonePe, or Paytm.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* COD INFO */
                    <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 text-emerald-400 space-y-1 text-xs font-mono">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span>CASH ON DELIVERY VERIFIED</span>
                      </div>
                      <p className="text-gray-400 font-body">
                        Pay exact cash of ₹{selectedProduct.price} to the courier partner upon arrival at your doorstep.
                      </p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("DETAILS")}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 text-xs font-heading font-bold uppercase text-gray-300 hover:text-white cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(255,190,50,0.35)] disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Placing Order...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>Confirm Order (₹{selectedProduct.price})</span>
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

      {/* ================= PUBLIC LIVE COURIER CHECKPOINTS MODAL ================= */}
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
                  <p className="text-xs text-gray-400 font-mono">Connecting to courier network...</p>
                </div>
              ) : liveTrackingData ? (
                <>
                  {/* Status Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-black/60 to-black/60 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                        Current Status
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
                          {liveTrackingData.originLocation || "Dispatched"} →{" "}
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
                      <span>Shipment Journey ({liveTrackingData.checkpoints?.length || 0} Updates)</span>
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
                                  {cp.message || cp.subtag_message || "In Transit"}
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

      {/* ========================================================================= */}
      {/* LIVE ORDER TRACKING & USER ORDER HISTORY MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {trackModalOpen && (
          <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl rounded-2xl bg-[#0D0D12] border border-[#FFBE32]/40 p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-[#FFBE32]/10 border border-[#FFBE32]/30 flex items-center justify-center text-[#FFBE32] shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-wider text-white">
                      Merchandise Order Tracking
                    </h3>
                    <p className="text-xs text-gray-400 font-body">
                      Track live delivery stages from DB for your account or any order reference.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTrackModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-xl bg-black/60 border border-white/10">
                <div className="flex gap-2">
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => setTrackViewTab("MY_ORDERS")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        trackViewTab === "MY_ORDERS"
                          ? "bg-[#FFBE32] text-black shadow-[0_0_12px_rgba(255,190,50,0.35)]"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>My Order History ({myOrders.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTrackViewTab("SEARCH")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      trackViewTab === "SEARCH"
                        ? "bg-[#FFBE32] text-black shadow-[0_0_12px_rgba(255,190,50,0.35)]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Search Any Order</span>
                  </button>
                </div>

                {isAuthenticated && trackViewTab === "MY_ORDERS" && (
                  <button
                    type="button"
                    disabled={loadingMyOrders}
                    onClick={loadUserOrders}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono text-gray-400 hover:text-[#FFBE32] hover:bg-white/5 cursor-pointer transition-colors"
                    title="Refresh orders from database"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingMyOrders ? "animate-spin text-[#FFBE32]" : ""}`} />
                    <span>Refresh</span>
                  </button>
                )}
              </div>

              {/* ================= TAB 1: MY ORDER HISTORY ================= */}
              {trackViewTab === "MY_ORDERS" && isAuthenticated && (
                <div className="space-y-4">
                  {/* Athlete Card Header */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#FFBE32]/10 via-[#0A0A0E] to-black border border-[#FFBE32]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFBE32] text-black font-display font-bold text-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,190,50,0.3)]">
                        {user?.ign?.slice(0, 2).toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || "LZ"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-white uppercase text-sm">
                            {user?.ign || user?.username}
                          </span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            VERIFIED ATHLETE
                          </span>
                        </div>
                        <p className="text-gray-400 font-mono text-[11px]">
                          {user?.email} {user?.phone ? `• ${user.phone}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#FFBE32]">
                      {myOrders.length} {myOrders.length === 1 ? "Order Found" : "Orders Found"}
                    </span>
                  </div>

                  {loadingMyOrders ? (
                    <div className="py-16 text-center text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-[#FFBE32]" />
                      <span>Fetching your order history from database...</span>
                    </div>
                  ) : myOrders.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 font-mono text-xs bg-black/40 rounded-xl border border-white/5 space-y-3">
                      <PackageCheck className="h-8 w-8 text-gray-500 mx-auto" />
                      <p className="text-white font-heading font-bold text-sm">No Merchandise Orders Yet</p>
                      <p>You haven't placed any clan gear orders under this account yet.</p>
                      <button
                        type="button"
                        onClick={() => setTrackModalOpen(false)}
                        className="px-5 py-2 rounded-lg bg-[#FFBE32] text-black font-heading text-xs font-bold uppercase cursor-pointer"
                      >
                        Explore Clan Gear Catalog
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myOrders.map((ord) => renderOrderCard(ord))}
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 2: SEARCH ANY ORDER / USER ================= */}
              {trackViewTab === "SEARCH" && (
                <div className="space-y-5">
                  {/* Search Form */}
                  <form onSubmit={handleSearchTracking} className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={trackQuery}
                          onChange={(e) => setTrackQuery(e.target.value)}
                          placeholder="Search Order # (e.g. MG-2026-1042), Mobile Phone, or Email..."
                          className="w-full rounded-xl border border-white/15 bg-black/70 pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#FFBE32] focus:outline-none font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={trackingLoading}
                        className="px-6 py-2.5 rounded-xl bg-[#FFBE32] hover:bg-[#FFA000] text-black font-heading text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(255,190,50,0.3)] shrink-0 disabled:opacity-50"
                      >
                        {trackingLoading ? "Searching DB..." : "Track Order"}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 font-mono">
                      <span>Quick examples:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTrackQuery("MG-2026-1042");
                        }}
                        className="text-[#FFBE32] hover:underline cursor-pointer"
                      >
                        MG-2026-1042
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTrackQuery("rahul.v@gmail.com");
                        }}
                        className="text-[#FFBE32] hover:underline cursor-pointer"
                      >
                        rahul.v@gmail.com
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTrackQuery("9789033445");
                        }}
                        className="text-[#FFBE32] hover:underline cursor-pointer"
                      >
                        9789033445
                      </button>
                    </div>
                  </form>

                  {/* No Orders Found */}
                  {trackSearched && trackedOrders.length === 0 && !trackingLoading && (
                    <div className="py-12 text-center text-gray-400 font-mono text-xs bg-black/40 rounded-xl border border-white/5 space-y-2">
                      <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
                      <p className="text-white font-heading font-bold text-sm">No Orders Found In Database</p>
                      <p>
                        We could not find any orders matching "<span className="text-white font-bold">{trackQuery}</span>".
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Please verify your Order Reference Number (e.g. MG-2026-XXXX), Phone Number, or Email address.
                      </p>
                    </div>
                  )}

                  {/* Grouped By Separate User / Customer */}
                  {groupedOrders.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
                        <span className="text-gray-400">
                          Found <strong>{trackedOrders.length}</strong> orders across{" "}
                          <strong className="text-[#FFBE32]">{groupedOrders.length}</strong> user account
                          {groupedOrders.length > 1 ? "s" : ""}:
                        </span>
                      </div>

                      {groupedOrders.map((customerGroup, cIdx) => (
                        <div
                          key={cIdx}
                          className="rounded-2xl bg-black/50 border border-white/15 p-5 space-y-4 shadow-xl"
                        >
                          {/* Separate User Identity Header Card */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#FFBE32] to-[#FFE082] text-black font-display font-bold flex items-center justify-center text-lg shadow-md">
                                {customerGroup.customerName.slice(0, 2).toUpperCase() || "CU"}
                              </div>
                              <div>
                                <h4 className="font-heading font-bold text-white uppercase text-base flex items-center gap-2">
                                  {customerGroup.customerName}
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FFBE32]/10 text-[#FFBE32] border border-[#FFBE32]/30">
                                    {customerGroup.orders.length} {customerGroup.orders.length === 1 ? "Order" : "Orders"}
                                  </span>
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400 mt-0.5">
                                  {customerGroup.customerEmail && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3 text-[#FFBE32]" />
                                      {customerGroup.customerEmail}
                                    </span>
                                  )}
                                  {customerGroup.customerPhone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3 text-[#FFBE32]" />
                                      {customerGroup.customerPhone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Orders of this Separate User */}
                          <div className="space-y-4">
                            {customerGroup.orders.map((ord) => renderOrderCard(ord))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= PUBLIC LIVE COURIER CHECKPOINTS MODAL ================= */}
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
                  <p className="text-xs text-gray-400 font-mono">Connecting to courier network...</p>
                </div>
              ) : liveTrackingData ? (
                <>
                  {/* Status Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-black/60 to-black/60 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                        Current Status
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
                          {liveTrackingData.originLocation || "Dispatched"} →{" "}
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
                      <span>Shipment Journey ({liveTrackingData.checkpoints?.length || 0} Updates)</span>
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
                                  {cp.message || cp.subtag_message || "In Transit"}
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
