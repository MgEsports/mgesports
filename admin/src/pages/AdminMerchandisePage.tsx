import React, { useState, useEffect, useRef } from "react";
import { merchandiseApi, type ProductItem } from "../api/merchandise";
import { adminApi } from "../api/admin";
import { settingsApi } from "../api/settings";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  QrCode,
  Sparkles,
  Search,
  Image as ImageIcon,
  ShoppingBag,
  Banknote,
  Check,
} from "lucide-react";
import { optimizeCloudinaryUrl } from "../utils/imageOptimizer";

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const CATEGORIES = ["JERSEY", "HOODIE", "ACCESSORY", "GEAR", "APPAREL"];

export const AdminMerchandisePage: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);
  const [togglingCod, setTogglingCod] = useState(false);
  const [codNotice, setCodNotice] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<ProductItem>>({
    name: "",
    slug: "",
    subtitle: "",
    description: "",
    tag: "OFFICIAL ATHLETE SPEC",
    price: 1299,
    originalPrice: 1999,
    stock: 100,
    category: "JERSEY",
    sizes: JSON.stringify(["S", "M", "L", "XL", "2XL"]),
    frontImage: "",
    upiId: "mgesports@upi",
    upiQrImage: "",
    hasCustomIgn: true,
    specs: "100% Breathable Micro-Poly\nOfficial Clan Squad IGN & Number Print\nFade-Resistant Sublimation Art",
    isAvailable: true,
    isFeatured: true,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await merchandiseApi.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    settingsApi
      .getSettings()
      .then((s) => {
        if (s.codEnabled !== undefined) {
          setCodEnabled(s.codEnabled !== "false");
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleCod = async () => {
    const nextVal = !codEnabled;
    setTogglingCod(true);
    setCodNotice(null);
    try {
      await settingsApi.updateSettings({ codEnabled: String(nextVal) });
      setCodEnabled(nextVal);
      setCodNotice(
        nextVal
          ? "Cash On Delivery (COD) is now ENABLED across the store."
          : "Cash On Delivery (COD) is now DISABLED. Store is Prepaid UPI only."
      );
      setTimeout(() => setCodNotice(null), 4000);
    } catch (err: any) {
      alert("Failed to update COD setting: " + (err.message || "Unknown error"));
    } finally {
      setTogglingCod(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      slug: "",
      subtitle: "Official MG Esports Merchandise",
      description: "Tournament-grade competition gear engineered with Dravidian battle flame aesthetics.",
      tag: "OFFICIAL ATHLETE SPEC",
      price: 1299,
      originalPrice: 1999,
      stock: 100,
      category: "JERSEY",
      sizes: JSON.stringify(["S", "M", "L", "XL", "2XL"]),
      frontImage: "",
      upiId: "mgesports@upi",
      upiQrImage: "",
      hasCustomIgn: true,
      specs: "100% Breathable Micro-Poly\nOfficial Clan Squad IGN & Number Print\nTournament-Certified Anti-Static Fit",
      isAvailable: true,
      isFeatured: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setFormData({
      ...p,
      sizes: p.sizes || JSON.stringify(["S", "M", "L", "XL"]),
      upiId: p.upiId || "mgesports@upi",
      hasCustomIgn: p.hasCustomIgn ?? (p.category === "JERSEY"),
    });
    setModalOpen(true);
  };

  const handleToggleSize = (sz: string) => {
    let currentSizes: string[] = [];
    try {
      currentSizes = JSON.parse(formData.sizes || "[]");
    } catch {
      currentSizes = [];
    }

    const updated = currentSizes.includes(sz)
      ? currentSizes.filter((s) => s !== sz)
      : [...currentSizes, sz];

    setFormData({ ...formData, sizes: JSON.stringify(updated) });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isQr: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isQr) setUploadingQr(true);
    else setUploadingImage(true);

    try {
      const res = await adminApi.uploadImage(file);
      if (res?.url) {
        if (isQr) {
          setFormData((prev) => ({ ...prev, upiQrImage: res.url }));
        } else {
          setFormData((prev) => ({ ...prev, frontImage: res.url }));
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload image. You can also paste an image URL directly.");
    } finally {
      if (isQr) setUploadingQr(false);
      else setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanName = formData.name?.trim() || "NEW PRODUCT";
      const slug =
        formData.slug?.trim() ||
        cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const payload: Partial<ProductItem> = {
        name: cleanName,
        slug,
        subtitle: formData.subtitle || null,
        description: formData.description || null,
        tag: formData.tag || "OFFICIAL ATHLETE SPEC",
        price: Number(formData.price) || 999,
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        stock: Number(formData.stock) ?? 100,
        category: formData.category || "JERSEY",
        sizes: formData.sizes || JSON.stringify(["S", "M", "L", "XL"]),
        frontImage: formData.frontImage || null,
        upiId: formData.upiId?.trim() || "mgesports@upi",
        upiQrImage: formData.upiQrImage || null,
        hasCustomIgn: !!formData.hasCustomIgn,
        specs: formData.specs || null,
        isAvailable: formData.isAvailable !== false,
        isFeatured: formData.isFeatured !== false,
      };

      if (editingProduct) {
        const updated = await merchandiseApi.updateProduct(editingProduct.id, payload);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? (updated ? { ...p, ...updated } : ({ ...p, ...payload } as ProductItem)) : p
          )
        );
      } else {
        const created = await merchandiseApi.createProduct(payload);
        const finalProduct: ProductItem = created || {
          id: `prod-${Date.now()}`,
          ...(payload as any),
        };
        setProducts((prev) => [finalProduct, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save merchandise product to database");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this merchandise product?")) return;
    try {
      await merchandiseApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete product from database");
    }
  };

  const handleDeleteAll = async () => {
    if (products.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ALL ${products.length} products? This will completely clear all merchandise and demo data from the catalog.`
      )
    ) {
      return;
    }
    try {
      try {
        await merchandiseApi.deleteAllProducts();
      } catch {
        await Promise.all(products.map((p) => merchandiseApi.deleteProduct(p.id).catch(() => {})));
      }
      setProducts([]);
    } catch (err: any) {
      alert(err.message || "Failed to delete products");
    }
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const parsedSizes: string[] = (() => {
    try {
      return JSON.parse(formData.sizes || "[]");
    } catch {
      return [];
    }
  })();

  const effectiveQr =
    formData.upiQrImage ||
    (formData.upiId
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(
          formData.upiId
        )}%26pn=MG%20Esports%26am=${formData.price || 1299}%26cu=INR`
      : null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-white">
            MERCHANDISE &amp; STORE MANAGEMENT
          </h1>
          <p className="text-xs text-gray-400 font-body">
            Control apparel stock, pricing, custom IGN athlete print settings, UPI QR codes, and website catalog.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {products.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shrink-0"
              title="Delete all merchandise products and demo data"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All ({products.length})</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#fc8100] hover:bg-[#e07200] transition-all cursor-pointer shadow-[0_0_15px_rgba(252, 129, 0,0.3)] shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* COD (Cash on Delivery) Store Checkout Toggle Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          codEnabled
            ? "bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
            : "bg-rose-950/20 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
              codEnabled
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                : "bg-rose-500/20 border-rose-500/40 text-rose-400"
            }`}
          >
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
                Cash On Delivery (COD) Checkout
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  codEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                }`}
              >
                {codEnabled ? "ENABLED / ACTIVE" : "DISABLED (PREPAID ONLY)"}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-body mt-0.5">
              {codEnabled
                ? "Customers can choose either Cash On Delivery or Prepaid UPI at checkout."
                : "COD option is hidden at checkout. Customers can only purchase via Prepaid UPI."}
            </p>
            {codNotice && (
              <p className="text-[11px] font-mono text-emerald-400 mt-1 flex items-center gap-1 animate-pulse">
                <Check className="h-3 w-3" /> {codNotice}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleCod}
          disabled={togglingCod}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
            codEnabled
              ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-500/60"
              : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500/60"
          }`}
        >
          {togglingCod ? (
            <span>Updating...</span>
          ) : codEnabled ? (
            <span>Disable COD</span>
          ) : (
            <span>Enable COD</span>
          )}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0D0D12] border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {["ALL", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#fc8100] text-black shadow-[0_0_10px_rgba(252, 129, 0,0.3)] font-extrabold"
                  : "bg-black/50 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product name, category..."
            className="w-full rounded-xl border border-white/10 bg-black/60 pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#fc8100] focus:outline-none"
          />
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-mono text-xs animate-pulse">
          Loading merchandise catalog...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 px-4 text-center bg-[#0C0C10] rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
              {products.length === 0 ? "Merchandise Catalog is Empty" : "No Matching Products Found"}
            </h3>
            <p className="text-xs text-gray-400 font-body max-w-md mx-auto">
              {products.length === 0
                ? "All demo merchandise products have been removed. No dummy items are active on your website. Click below to add a real product whenever you wish."
                : "No products matched your search or category filter. Try clearing filters or search terms."}
            </p>
          </div>
          {products.length === 0 && (
            <button
              onClick={handleOpenCreate}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-black bg-[#fc8100] hover:bg-[#e07200] transition-all cursor-pointer shadow-[0_0_15px_rgba(252, 129, 0,0.3)]"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            let productSizes: string[] = [];
            try {
              productSizes = JSON.parse(p.sizes || "[]");
            } catch {}

            return (
              <div
                key={p.id}
                className="rounded-2xl bg-[#0C0C10] border border-white/10 hover:border-[#fc8100]/60 transition-all flex flex-col justify-between group shadow-[0_10px_25px_rgba(0,0,0,0.7)] overflow-hidden"
              >
                <div>
                  {/* Product Image Banner */}
                  <div className="aspect-[4/3] w-full bg-black relative overflow-hidden flex items-center justify-center">
                    {p.frontImage ? (
                      <img
                        src={optimizeCloudinaryUrl(p.frontImage, 500)}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-600 space-y-1">
                        <ImageIcon className="h-10 w-10 stroke-[1.5]" />
                        <span className="text-[10px] font-mono uppercase">Official Product Photo</span>
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-black/80 border border-white/15 text-[10px] font-heading font-bold text-[#fc8100] uppercase backdrop-blur-md">
                        {p.category}
                      </span>
                      {p.tag && (
                        <span className="px-2 py-0.5 rounded-lg bg-[#fc8100]/20 border border-[#fc8100]/40 text-[#fc8100] text-[9px] font-heading font-bold uppercase tracking-wider backdrop-blur-md">
                          {p.tag}
                        </span>
                      )}
                    </div>

                    <span
                      className={`absolute top-2.5 right-2.5 z-10 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase backdrop-blur-md ${
                        p.stock > 10 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {p.stock} IN STOCK
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-display text-lg uppercase tracking-wider text-white group-hover:text-[#fc8100] transition-colors leading-snug line-clamp-1 font-bold">
                        {p.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-body mt-1 line-clamp-2">
                        {p.subtitle || p.description}
                      </p>
                    </div>

                    {/* Price Box */}
                    <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex items-baseline justify-between font-mono">
                      <div>
                        <span className="text-xl font-bold text-[#fc8100]">₹{p.price.toLocaleString("en-IN")}</span>
                        {p.originalPrice && (
                          <span className="ml-2 text-xs text-gray-500 line-through">
                            ₹{p.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 uppercase font-heading font-bold">
                        {p.isAvailable ? "Available Online" : "Sold Out"}
                      </span>
                    </div>

                    {/* UPI & Size Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-gray-400">
                      {productSizes.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                          Sizes: {productSizes.join(", ")}
                        </span>
                      )}
                      {p.hasCustomIgn && (
                        <span className="px-2 py-0.5 rounded bg-[#fc8100]/10 border border-[#fc8100]/30 text-[#fc8100]">
                          ★ Custom IGN
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 truncate max-w-[170px]" title={p.upiId || "mgesports@upi"}>
                        UPI: {p.upiId || "mgesports@upi"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 pt-3 border-t border-white/10 flex items-center justify-between bg-[#0C0C10]">
                  <span className="text-[11px] text-gray-500 font-mono truncate max-w-[180px]">
                    /{p.slug}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-[#fc8100] cursor-pointer transition-colors"
                      title="Edit Product"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 cursor-pointer transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0D0D12] border border-[#fc8100]/40 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-[#fc8100]">
                  STORE INVENTORY SETUP
                </span>
                <h3 className="font-display text-2xl uppercase tracking-wider text-white mt-0.5">
                  {editingProduct ? "Edit Merchandise Product" : "Add Merchandise Product"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="MG PRO COMBAT JERSEY 2026"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#fc8100] focus:outline-none"
                />
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#fc8100] focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Tag / Badge (e.g. OFFICIAL ATHLETE SPEC)
                  </label>
                  <input
                    type="text"
                    value={formData.tag || ""}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="OFFICIAL ATHLETE SPEC"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-[#fc8100] focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="1299"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Original / MRP Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice || ""}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    placeholder="1999"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock ?? 100}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    placeholder="100"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Product Image URL or File Upload */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/15 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-bold uppercase text-white flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-[#fc8100]" />
                    <span>Product Image</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-[#fc8100] font-mono cursor-pointer transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploadingImage ? "Uploading..." : "Upload File"}</span>
                  </button>
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={(e) => handleImageUpload(e, false)}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <input
                  type="text"
                  value={formData.frontImage || ""}
                  onChange={(e) => setFormData({ ...formData, frontImage: e.target.value })}
                  placeholder="https://... or /uploads/..."
                  className="w-full rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 text-xs text-white focus:border-[#fc8100] focus:outline-none font-mono"
                />

                {formData.frontImage && (
                  <div className="mt-2 flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                    <img
                      src={optimizeCloudinaryUrl(formData.frontImage, 200)}
                      alt="Preview"
                      className="h-12 w-12 object-contain rounded bg-black"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="text-[11px] text-gray-400 font-mono truncate">
                      Image attached successfully
                    </span>
                  </div>
                )}
              </div>

              {/* Sizes Selection */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1.5">
                  Available Sizes (Apparel / Jersey)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((sz) => {
                    const isSelected = parsedSizes.includes(sz);
                    return (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => handleToggleSize(sz)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#fc8100] text-black shadow-[0_0_10px_rgba(252, 129, 0,0.3)] font-extrabold"
                            : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Athlete IGN Toggle */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/15 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className={`h-4 w-4 ${formData.hasCustomIgn ? "text-[#fc8100]" : "text-gray-400"}`} />
                    <span className="text-xs font-heading font-bold uppercase text-white">
                      Custom Athlete IGN Print
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-body mt-0.5">
                    Allow players to enter their custom squad IGN and two-digit number for customized jerseys.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!formData.hasCustomIgn}
                    onChange={(e) => setFormData({ ...formData, hasCustomIgn: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fc8100] peer-checked:after:bg-black"></div>
                </label>
              </div>

              {/* ======================================================== */}
              {/* UPI PAYMENT & QR CODE SETUP */}
              {/* ======================================================== */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#0C0C14] to-black border border-[#fc8100]/35 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-[#fc8100]" />
                    <span className="text-xs font-heading font-bold uppercase text-white">
                      UPI Payment &amp; QR Settings
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                    Live Player Checkout
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-heading font-bold uppercase text-gray-300 mb-1">
                      Merchant UPI ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.upiId || "mgesports@upi"}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                      placeholder="e.g. lordzesports@okaxis"
                      className="w-full rounded-lg border border-white/15 bg-black/70 px-3 py-2 text-xs text-white focus:border-[#fc8100] focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Shown to buyers in checkout with 1-click copy button.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-heading font-bold uppercase text-gray-300">
                        Custom UPI QR Image URL
                      </label>
                      <button
                        type="button"
                        onClick={() => qrInputRef.current?.click()}
                        disabled={uploadingQr}
                        className="text-[10px] text-[#fc8100] hover:underline cursor-pointer"
                      >
                        {uploadingQr ? "Uploading..." : "Upload QR"}
                      </button>
                      <input
                        type="file"
                        ref={qrInputRef}
                        onChange={(e) => handleImageUpload(e, true)}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <input
                      type="text"
                      value={formData.upiQrImage || ""}
                      onChange={(e) => setFormData({ ...formData, upiQrImage: e.target.value })}
                      placeholder="Optional custom QR image URL"
                      className="w-full rounded-lg border border-white/15 bg-black/70 px-3 py-2 text-xs text-white focus:border-[#fc8100] focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Leave blank to auto-generate scan QR from UPI ID.
                    </p>
                  </div>
                </div>

                {/* QR Code Live Preview */}
                {effectiveQr && (
                  <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 flex items-center gap-3">
                    <div className="h-16 w-16 bg-white p-1 rounded-md shrink-0 flex items-center justify-center">
                      <img
                        src={effectiveQr}
                        alt="UPI QR Code"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-heading font-bold text-white uppercase">
                        QR Code Ready
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                        Will appear on checkout for instant scan &amp; pay
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitle & Specs */}
              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={formData.subtitle || ""}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Official 2026-27 Athlete Edition • Black & Gold Temple Dravidian Edition"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#fc8100] focus:outline-none font-body"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold uppercase text-gray-300 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="High-performance esports gear crafted with breathable micro-poly..."
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-[#fc8100] focus:outline-none font-body resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 text-xs font-heading font-bold uppercase text-gray-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl bg-[#fc8100] hover:bg-[#e07200] text-black font-heading text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(252, 129, 0,0.3)]"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
