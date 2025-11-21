import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard-enhancement.css";

type PromotionType = "percentage" | "fixed_amount" | "buy_x_get_y" | "custom";

type Promotion = {
  id: string;
  title: string;
  promotion_type: PromotionType;
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  image_url?: string;
  created_at?: string;
  description?: string;
  min_purchase_amount?: number;
  usage_limit?: number;
  applicable_to?: "all" | "category" | "product";
  applicable_ids?: string[];
};

type Product = {
  id: string;
  name: string;
  price: number;
  category_id: string;
  images?: { url: string }[];
};

export default function Promotions() {
  const navigate = useNavigate();
  const { session, isAdmin, userRole } = useAuth();
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PromotionType>("percentage");
  const [value, setValue] = useState<number | "">("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [minOrderValue, setMinOrderValue] = useState<number | "">("");
  const [maxUses, setMaxUses] = useState<number | "">("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"standard" | "custom">("standard");
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Product selection state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [applyTo, setApplyTo] = useState<"all" | "product">("all");

  // Role-based access control - Admin only
  useEffect(() => {
    if (!session) {
      navigate("/admin/login");
      return;
    }

    if (!isAdmin) {
      console.error('Insufficient permissions - Admin only:', userRole);
      navigate("/admin");
      return;
    }
  }, [session, isAdmin, userRole, navigate]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("promotions")
      .select(
        "id, title, promotion_type, discount_value, start_date, end_date, is_active, image_url, created_at, description, min_purchase_amount, usage_limit",
      )
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error loading promotions:", error);
      setError(error.message);
    } else {
      console.log("Loaded promotions:", data);
    }
    setItems((data || []) as Promotion[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, category_id, images:product_images(url)")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error loading products:", error);
    } else {
      setProducts((data || []) as Product[]);
    }
  }

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [items, searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!productSearchTerm) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()),
    );
  }, [products, productSearchTerm]);

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const canCreate = useMemo(() => {
    const basicRequirements = !!title && !!start && !!end;
    
    if (!basicRequirements) return false;
    
    // Validate based on active tab and promotion type
    switch (activeTab) {
      case "custom":
        return !!description;
      case "standard":
      default:
        return !!value;
    }
  }, [title, value, start, end, activeTab, description, minOrderValue]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    setCreating(true);
    setError(null);

    let image_url: string | undefined;
    if (imageFile) {
      const filename = `${crypto.randomUUID()}-${imageFile.name}`;
      const { error: upErr } = await supabase.storage
        .from("promotion-images")
        .upload(filename, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });
      if (upErr) {
        setError(`Image upload failed: ${upErr.message}`);
        setCreating(false);
        return;
      } else {
        const { data } = supabase.storage
          .from("promotion-images")
          .getPublicUrl(filename);
        image_url = data.publicUrl;
      }
    }

    // Determine promotion type based on active tab
    let finalPromotionType: PromotionType;
    switch (activeTab) {
      case "custom":
        finalPromotionType = "custom";
        break;
      case "standard":
      default:
        finalPromotionType = type; // Use the selected type from dropdown
    }

    // Prepare promotion data based on type
    const promotionData: any = {
      title,
      promotion_type: finalPromotionType,
      start_date: new Date(start).toISOString(),
      end_date: new Date(end).toISOString(),
      is_active: true,
    };

    // Only update image_url if a new image was uploaded
    if (image_url) {
      promotionData.image_url = image_url;
    } else if (!isEditMode) {
      // For new promotions, set image_url to null if no image
      promotionData.image_url = null;
    }

    // Handle different promotion types
    switch (activeTab) {
      case "custom":
        promotionData.discount_value = Number(value) || 0;
        promotionData.description = description;
        break;
      case "standard":
      default:
        promotionData.discount_value = Number(value);
    }

    if (maxUses) {
      promotionData.usage_limit = Number(maxUses);
    }

    // Add product selection
    promotionData.applicable_to = applyTo;
    if (applyTo === "product" && selectedProductIds.length > 0) {
      promotionData.applicable_ids = selectedProductIds;
    } else {
      promotionData.applicable_ids = [];
    }

    let result;
    if (isEditMode && editingPromotion) {
      // Update existing promotion
      result = await supabase
        .from("promotions")
        .update(promotionData)
        .eq("id", editingPromotion.id);
    } else {
      // Create new promotion
      result = await supabase.from("promotions").insert([promotionData]);
    }

    if (result.error) {
      setError(result.error.message);
      setCreating(false);
      return;
    }

    // Reset form
    setTitle("");
    setType("percentage");
    setValue("");
    setStart("");
    setEnd("");
    setImageFile(null);
    setDescription("");
    setMinOrderValue("");
    setMaxUses("");
    setActiveTab("standard");
    setApplyTo("all");
    setSelectedProductIds([]);
    setProductSearchTerm("");
    setIsModalOpen(false);
    setEditingPromotion(null);
    setIsEditMode(false);
    await load();
    setCreating(false);
  }

  async function onDelete(id: string) {
    if (!confirm("Are you sure you want to delete this promotion?")) return;

    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) setError(error.message);
    await load();
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("promotions")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (error) setError(error.message);
    await load();
  }

  const getPromotionIcon = (type: PromotionType) => {
    const icons = {
      percentage: "💯",
      fixed_amount: "💰",
      buy_x_get_y: "🎁",
      custom: "⚙️",
    };
    return icons[type] || "🏷️";
  };

  const getPromotionTypeLabel = (type: PromotionType) => {
    const labels = {
      percentage: "Percentage Off",
      fixed_amount: "Fixed Amount",
      buy_x_get_y: "Buy X Get Y",
      custom: "Custom Promotion",
    };
    return labels[type] || "Unknown Type";
  };

  const formatValue = (type: PromotionType, value: number, promotion?: Promotion) => {
    switch (type) {
      case "percentage":
        return `${value}% off`;
      case "fixed_amount":
        return `₱${value.toFixed(2)} off`;
      case "buy_x_get_y":
        return `Buy ${value} Get 1`;
      case "custom":
        return promotion?.description || "Custom offer";
      default:
        return value.toString();
    }
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);
    return promotion.is_active && now >= startDate && now <= endDate;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTitle("");
    setType("percentage");
    setValue("");
    setStart("");
    setEnd("");
    setImageFile(null);
    setDescription("");
    setMinOrderValue("");
    setMaxUses("");
    setActiveTab("standard");
    setApplyTo("all");
    setSelectedProductIds([]);
    setProductSearchTerm("");
    setError(null);
    setEditingPromotion(null);
    setIsEditMode(false);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setIsEditMode(true);
    setTitle(promotion.title);
    setType(promotion.promotion_type);
    setValue(promotion.discount_value);
    setStart(new Date(promotion.start_date).toISOString().slice(0, 16));
    setEnd(new Date(promotion.end_date).toISOString().slice(0, 16));
    setDescription(promotion.description || "");
    setMinOrderValue(promotion.min_purchase_amount || "");
    setMaxUses(promotion.usage_limit || "");

    // Set product selection - filter out 'category' as it's not currently supported in UI
    const applicableTo = promotion.applicable_to || "all";
    setApplyTo(applicableTo === "category" ? "all" : applicableTo);
    setSelectedProductIds(promotion.applicable_ids || []);

    // Set active tab based on promotion type
    if (promotion.promotion_type === "custom") {
      setActiveTab("custom");
    } else {
      setActiveTab("standard");
    }

    setIsModalOpen(true);
  };

  return (
    <div className="promotions-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Promotions Management</h1>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              // Set default dates: start = now, end = 7 days from now
              const now = new Date();
              const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              setStart(now.toISOString().slice(0, 16));
              setEnd(endDate.toISOString().slice(0, 16));
              setIsModalOpen(true);
            }}
          >
            🏷️ Create Promotion
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar" style={{ marginBottom: "var(--spacing-lg)" }}>
        <div className="search">
          <input
            type="text"
            placeholder="🔍 Search promotions by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ color: "#1f2937" }}
          />
        </div>
      </div>

      {/* Create Promotion Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? "Edit Promotion" : "Create New Promotion"}</h2>
              <button className="modal-close" onClick={handleModalClose}>
                ✕
              </button>
            </div>

            <form onSubmit={onCreate}>
              <div className="modal-body">
                {/* Promotion Type Tabs */}
                <div style={{ marginBottom: "var(--spacing-lg)" }}>
                  <div 
                    style={{ 
                      display: "flex", 
                      borderBottom: "2px solid var(--border)",
                      marginBottom: "var(--spacing-lg)"
                    }}
                  >
              <button
                type="button"
                onClick={() => {
                  setActiveTab("standard");
                  setType("percentage");
                  setValue("");
                  setDescription("");
                }}
                style={{
                  padding: "var(--spacing-sm) var(--spacing)",
                  border: "none",
                  background: activeTab === "standard" ? "var(--primary)" : "transparent",
                  color: activeTab === "standard" ? "white" : "var(--text)",
                  borderRadius: "var(--radius) var(--radius) 0 0",
                  cursor: "pointer",
                  fontWeight: activeTab === "standard" ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
                  transition: "all 0.2s ease",
                  borderBottom: activeTab === "standard" ? "2px solid var(--primary)" : "2px solid transparent",
                  marginBottom: "-2px"
                }}
              >
                💯 Standard Discounts
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("custom");
                  setValue("");
                }}
                style={{
                  padding: "var(--spacing-sm) var(--spacing)",
                  border: "none",
                  background: activeTab === "custom" ? "var(--primary)" : "transparent",
                  color: activeTab === "custom" ? "white" : "var(--text)",
                  borderRadius: "var(--radius) var(--radius) 0 0",
                  cursor: "pointer",
                  fontWeight: activeTab === "custom" ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
                  transition: "all 0.2s ease",
                  borderBottom: activeTab === "custom" ? "2px solid var(--primary)" : "2px solid transparent",
                  marginBottom: "-2px"
                }}
              >
                ⚙️ Custom Promotions
                  </button>
                </div>
              </div>
            {/* Common Fields */}
            <div className="form-group">
              <label className="form-label">Promotion Title</label>
              <input
                className="input"
                placeholder="Enter promotion title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Standard Discounts Tab */}
            {activeTab === "standard" && (
              <>
                <div className="grid cols-2">
                  <div className="form-group">
                    <label className="form-label">Discount Type</label>
                    <select
                      className="select"
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value as PromotionType);
                        setValue("");
                      }}
                    >
                      <option value="percentage">💯 Percentage Off</option>
                      <option value="fixed_amount">💰 Fixed Amount Off</option>
                      <option value="buy_x_get_y">🎁 Buy X Get Y</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {type === "percentage"
                        ? "Percentage (%)"
                        : type === "fixed_amount"
                          ? "Amount (₱)"
                          : "Quantity to Buy"}
                    </label>
                    <input
                      className="input"
                      placeholder={
                        type === "percentage"
                          ? "10"
                          : type === "fixed_amount"
                            ? "5.00"
                            : "2"
                      }
                      type="number"
                      min="0"
                      max={type === "percentage" ? "100" : undefined}
                      step={
                        type === "percentage" || type === "buy_x_get_y"
                          ? "1"
                          : "0.01"
                      }
                      value={value}
                      onChange={(e) =>
                        setValue(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Custom Promotions Tab */}
            {activeTab === "custom" && (
              <>
                <div className="form-group">
                  <label className="form-label">Custom Description</label>
                  <textarea
                    className="input"
                    placeholder="Describe your custom promotion (e.g., 'Buy 2 shirts, get 1 free hat', 'Free gift with purchase over ₱100')"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    required
                    style={{ resize: "vertical", minHeight: "80px" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Custom Value (Optional)</label>
                  <input
                    className="input"
                    placeholder="Enter numeric value if applicable (e.g., gift value, minimum order)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={(e) =>
                      setValue(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  />
                  <small style={{ color: "var(--muted)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                    Optional: Add a numeric value for tracking or display purposes
                  </small>
                </div>
              </>
            )}

            {/* Date Range */}
            <div className="grid cols-2">
              <div className="form-group">
                <label className="form-label">Start Date & Time</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  onFocus={(e) => e.target.showPicker()}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  onFocus={(e) => e.target.showPicker()}
                  required
                />
              </div>
            </div>

            {/* Product Selection */}
            <div style={{ marginTop: "var(--spacing-lg)", marginBottom: "var(--spacing-lg)", padding: "var(--spacing)", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              <h3 style={{ marginBottom: "var(--spacing)", fontSize: "1rem", fontWeight: "var(--font-weight-semibold)" }}>Apply To</h3>

              <div style={{ display: "flex", gap: "var(--spacing-sm)", marginBottom: "var(--spacing)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--spacing-xs)", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="applyTo"
                    value="all"
                    checked={applyTo === "all"}
                    onChange={() => {
                      setApplyTo("all");
                      setSelectedProductIds([]);
                    }}
                  />
                  <span>All Products</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "var(--spacing-xs)", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="applyTo"
                    value="product"
                    checked={applyTo === "product"}
                    onChange={() => setApplyTo("product")}
                  />
                  <span>Specific Products</span>
                </label>
              </div>

              {applyTo === "product" && (
                <div>
                  <input
                    type="text"
                    className="input"
                    placeholder="🔍 Search products..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    style={{ marginBottom: "var(--spacing-sm)", color: "#1f2937" }}
                  />

                  <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "var(--spacing-sm)" }}>
                    {filteredProducts.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--spacing)" }}>No products found</p>
                    ) : (
                      filteredProducts.map((product) => (
                        <label
                          key={product.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--spacing-sm)",
                            padding: "var(--spacing-sm)",
                            cursor: "pointer",
                            borderRadius: "var(--radius-sm)",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "var(--font-weight-medium)", fontSize: "0.9rem" }}>{product.name}</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>₱{product.price.toFixed(2)}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  {selectedProductIds.length > 0 && (
                    <div style={{ marginTop: "var(--spacing-sm)", padding: "var(--spacing-sm)", background: "var(--primary-light)", borderRadius: "var(--radius)", fontSize: "0.9rem" }}>
                      <strong>{selectedProductIds.length}</strong> product{selectedProductIds.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Optional Fields */}
            <div className="grid cols-2">
              <div className="form-group">
                <label className="form-label">Maximum Uses (Optional)</label>
                <input
                  className="input"
                  placeholder="Leave empty for unlimited uses"
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) =>
                    setMaxUses(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Promotion Banner (Optional)</label>
                <div className="image-upload-container">
                  {/* Show current image if editing and has image */}
                  {isEditMode && editingPromotion?.image_url && !imageFile && (
                    <div className="current-image-preview" style={{ marginBottom: "var(--spacing-sm)" }}>
                      <img 
                        src={editingPromotion.image_url} 
                        alt="Current promotion banner"
                        style={{
                          width: "100%",
                          maxWidth: "200px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--border)"
                        }}
                      />
                      <small style={{ color: "var(--muted)", fontSize: "12px", display: "block", marginTop: "4px" }}>
                        Current image (upload a new one to replace)
                      </small>
                    </div>
                  )}
                  
                  {/* Show preview of new image */}
                  {imageFile && (
                    <div className="new-image-preview" style={{ marginBottom: "var(--spacing-sm)" }}>
                      <img 
                        src={URL.createObjectURL(imageFile)} 
                        alt="New promotion banner preview"
                        style={{
                          width: "100%",
                          maxWidth: "200px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--primary)"
                        }}
                      />
                      <small style={{ color: "var(--primary)", fontSize: "12px", display: "block", marginTop: "4px" }}>
                        New image preview
                      </small>
                    </div>
                  )}
                  
                  <input
                    className="file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  <small style={{ color: "var(--muted)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                    Recommended: 800x400px or similar aspect ratio
                  </small>
                </div>
              </div>
            </div>

            {error && (
              <div
                className="error-message"
                style={{
                  color: "var(--danger)",
                  fontSize: "14px",
                  padding: "var(--spacing-sm) var(--spacing)",
                  background: "var(--danger-light)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--danger)",
                }}
              >
                ⚠️ {error}
              </div>
            )}

              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleModalClose}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={creating || !canCreate}
                >
                  {creating ? (
                    <>
                      <span
                        className="spinner"
                        style={{ width: 14, height: 14 }}
                      ></span>
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    isEditMode ? "Update Promotion" : "Create Promotion"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Promotions Summary */}
      {!loading && items.length > 0 && (
        <div
          className="grid cols-4"
          style={{ marginBottom: "var(--spacing-lg)" }}
        >
          <div className="metric-card success">
            <div className="metric-header">
              <h3 className="metric-title">
                <span className="metric-icon">✅</span>
                Active Promotions
              </h3>
            </div>
            <div className="metric-value">
              {items.filter(isPromotionActive).length}
            </div>
          </div>
          <div className="metric-card info">
            <div className="metric-header">
              <h3 className="metric-title">
                <span className="metric-icon">📅</span>
                Scheduled
              </h3>
            </div>
            <div className="metric-value">
              {
                items.filter((p) => {
                  const now = new Date();
                  const startDate = new Date(p.start_date);
                  return p.is_active && now < startDate;
                }).length
              }
            </div>
          </div>
          <div className="metric-card warning">
            <div className="metric-header">
              <h3 className="metric-title">
                <span className="metric-icon">⏰</span>
                Expired
              </h3>
            </div>
            <div className="metric-value">
              {
                items.filter((p) => {
                  const now = new Date();
                  const endDate = new Date(p.end_date);
                  return now > endDate;
                }).length
              }
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <h3 className="metric-title">
                <span className="metric-icon">📊</span>
                Total
              </h3>
            </div>
            <div className="metric-value">{items.length}</div>
          </div>
        </div>
      )}

      {/* Promotions List */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          <h3 style={{ margin: 0 }}>All Promotions ({filteredItems.length})</h3>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Loading promotions...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <div
              style={{
                textAlign: "center",
                padding: "var(--spacing-2xl)",
                color: "var(--muted)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "var(--spacing)" }}>
                🏷️
              </div>
              <h3
                style={{
                  margin: "0 0 var(--spacing-sm)",
                  color: "var(--text)",
                }}
              >
                {searchTerm ? "No promotions found" : "No promotions yet"}
              </h3>
              <p style={{ margin: 0 }}>
                {searchTerm
                  ? `No promotions match "${searchTerm}". Try a different search term.`
                  : "Start by creating your first promotional campaign."}
              </p>
              {!searchTerm && (
                <button
                  className="btn btn-primary"
                  style={{ marginTop: "var(--spacing)" }}
                  onClick={() => {
                    // Set default dates: start = now, end = 7 days from now
                    const now = new Date();
                    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    setStart(now.toISOString().slice(0, 16));
                    setEnd(endDate.toISOString().slice(0, 16));
                    setIsModalOpen(true);
                  }}
                >
                  🏷️ Create First Promotion
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Promotion</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((promotion) => (
                  <tr key={promotion.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--spacing-sm)",
                        }}
                      >
                        <span style={{ fontSize: "18px" }}>
                          {getPromotionIcon(promotion.promotion_type)}
                        </span>
                        <div>
                          <div
                            style={{
                              fontWeight: "var(--font-weight-semibold)",
                              color: "var(--text)",
                            }}
                          >
                            {promotion.title}
                          </div>
                          {promotion.image_url && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--muted)",
                              }}
                            >
                              📷 Has banner
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge info" style={{ fontSize: "11px" }}>
                        {getPromotionTypeLabel(promotion.promotion_type)}
                      </span>
                    </td>
                    <td
                      style={{
                        fontWeight: "var(--font-weight-semibold)",
                        color: "var(--success)",
                      }}
                    >
                      {formatValue(
                        promotion.promotion_type,
                        promotion.discount_value,
                        promotion,
                      )}
                    </td>
                    <td style={{ fontSize: "14px" }}>
                      <div>{formatDate(promotion.start_date)}</div>
                      <div style={{ color: "var(--muted)" }}>
                        to {formatDate(promotion.end_date)}
                      </div>
                    </td>
                    <td>
                      {isPromotionActive(promotion) ? (
                        <span className="badge success">🟢 Active</span>
                      ) : new Date() < new Date(promotion.start_date) ? (
                        <span className="badge warning">⏳ Scheduled</span>
                      ) : new Date() > new Date(promotion.end_date) ? (
                        <span className="badge danger">⏰ Expired</span>
                      ) : !promotion.is_active ? (
                        <span
                          className="badge"
                          style={{
                            background: "var(--border)",
                            color: "var(--muted)",
                          }}
                        >
                          ⏸️ Paused
                        </span>
                      ) : (
                        <span className="badge">❓ Unknown</span>
                      )}
                    </td>
                    <td>
                      <div
                        style={{ display: "flex", gap: "var(--spacing-sm)" }}
                      >
                        <button
                          className="btn btn-secondary"
                          style={{
                            fontSize: "12px",
                            padding: "6px 10px",
                            minWidth: "auto",
                          }}
                          onClick={() =>
                            toggleStatus(
                              promotion.id,
                              promotion.is_active || false,
                            )
                          }
                          title={
                            promotion.is_active
                              ? "Pause promotion"
                              : "Activate promotion"
                          }
                        >
                          {promotion.is_active ? "⏸️" : "▶️"}
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{
                            fontSize: "12px",
                            padding: "6px 10px",
                            minWidth: "auto",
                          }}
                          onClick={() => handleEditPromotion(promotion)}
                          title="Edit promotion"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{
                            fontSize: "12px",
                            padding: "6px 10px",
                            minWidth: "auto",
                          }}
                          onClick={() => onDelete(promotion.id)}
                          title="Delete promotion"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
