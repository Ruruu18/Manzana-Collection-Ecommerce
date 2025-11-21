import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { uploadImage, validateImageFile, STORAGE_BUCKETS } from "../../utils/imageUpload";
import VariantManager from "../../components/VariantManager";
import "../../styles/dashboard-enhancement.css";

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  type: "size" | "color" | "style";
  value: string;
  stock_quantity: number;
  price_adjustment: number;
  sku_suffix: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discounted_price?: number;
  sku: string;
  category_id?: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  tags?: string[];
  brand?: string;
  created_at?: string;
  updated_at?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  category?: Category;
}

export default function Products() {
  const navigate = useNavigate();
  const { session, isAdminOrStaff, userRole } = useAuth();

  useEffect(() => {
    try {
      if (!session) {
        navigate("/admin/login");
        return;
      }

      if (!isAdminOrStaff) {
        console.error('Insufficient permissions:', userRole);
        navigate("/admin/login");
        return;
      }
    } catch (err) {
      console.error('Session check failed:', err);
      navigate("/admin/login");
    }
  }, [session, isAdminOrStaff, userRole, navigate]);

  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [discountedPrice, setDiscountedPrice] = useState<number | "">("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>("");
  const [brand, setBrand] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, is_active")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error('❌ Categories fetch error:', error);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error('💥 Unexpected error during categories load:', err);
    }
  }

  async function load() {
    console.log('📦 Starting to load products...');
    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      console.log('⏰ Load timeout - stopping loading state');
      setLoading(false);
      setError('Loading timed out. Please try again.');
    }, 10000);

    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, price, discounted_price, sku,
          category_id, stock_quantity, is_active,
          is_featured, tags, brand, created_at, updated_at,
          categories (id, name, description),
          product_images (id, url, alt_text, is_primary, sort_order),
          product_variants (id, product_id, name, type, value, stock_quantity, price_adjustment, sku_suffix, is_active)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      clearTimeout(timeoutId);

      if (error) {
        console.error('❌ Products fetch error:', error);
        setError(`Failed to load products: ${error.message}`);
        setItems([]);
      } else {
        console.log('✅ Products loaded successfully:', data?.length || 0);
        const mappedProducts = (data || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          discounted_price: product.discounted_price,
          sku: product.sku,
          category_id: product.category_id,
          stock_quantity: product.stock_quantity,
          is_active: product.is_active,
          is_featured: product.is_featured,
          tags: product.tags,
          brand: product.brand,
          created_at: product.created_at,
          updated_at: product.updated_at,
          category: product.categories,
          images: product.product_images || [],
          variants: product.product_variants || []
        }));
        setItems(mappedProducts);
        setError(null);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('💥 Unexpected error during product load:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setItems([]);
    }

    setLoading(false);
    console.log('📦 Product loading completed');
  }

  useEffect(() => {
    load();
    loadCategories();
  }, []);

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((item) => item.category_id === categoryFilter);
    }

    return filtered;
  }, [items, searchTerm, categoryFilter]);

  const canCreate = useMemo(
    () => !!name && !!price && quantity >= 0 && !!categoryId && (imageFile !== null || editingProduct !== null),
    [name, price, quantity, categoryId, imageFile, editingProduct],
  );

  // Auto-generate SKU
  const generateSku = () => {
    const category = categories.find(c => c.id === categoryId);
    const prefix = category ? category.name.substring(0, 3).toUpperCase() : 'PRD';
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${random}`;
  };

  function clearForm() {
    setName("");
    setPrice("");
    setDiscountedPrice("");
    setSku("");
    setQuantity(0);
    setCategoryId("");
    setBrand("");
    setIsFeatured(false);
    setIsActive(true);
    setTags("");
    setImageFile(null);
    setEditingProduct(null);
    setError(null);
    setShowAdvanced(false);
  }

  function startEdit(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setDiscountedPrice(product.discounted_price || "");
    setSku(product.sku);
    setQuantity(product.stock_quantity);
    setCategoryId(product.category_id || "");
    setBrand(product.brand || "");
    setIsFeatured(product.is_featured);
    setIsActive(product.is_active);
    setTags(product.tags?.join(", ") || "");
    setImageFile(null);
    setIsModalOpen(true);
  }

  // Function to refresh only the editing product's variants
  async function refreshEditingProductVariants() {
    if (!editingProduct) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, price, discounted_price, sku,
          category_id, stock_quantity, is_active,
          is_featured, tags, brand, created_at, updated_at,
          categories (id, name, description),
          product_images (id, url, alt_text, is_primary, sort_order),
          product_variants (id, product_id, name, type, value, stock_quantity, price_adjustment, sku_suffix, is_active)
        `)
        .eq("id", editingProduct.id)
        .single();

      if (error) throw error;

      const updatedProduct: Product = {
        id: data.id,
        name: data.name,
        price: data.price,
        discounted_price: data.discounted_price,
        sku: data.sku,
        category_id: data.category_id,
        stock_quantity: data.stock_quantity,
        is_active: data.is_active,
        is_featured: data.is_featured,
        tags: data.tags,
        brand: data.brand,
        created_at: data.created_at,
        updated_at: data.updated_at,
        category: data.categories,
        images: data.product_images || [],
        variants: data.product_variants || []
      };

      // Update editingProduct state
      setEditingProduct(updatedProduct);

      // Also update in items array
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === updatedProduct.id ? updatedProduct : item
        )
      );
    } catch (err) {
      console.error("Error refreshing product variants:", err);
    }
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingProduct || !canCreate) return;

    setUpdating(true);
    setError(null);

    if (imageFile) {
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        setError(validation.error || "Invalid image file");
        setUpdating(false);
        return;
      }
    }

    try {
      const productData = {
        name,
        price: Number(price),
        discounted_price: discountedPrice ? Number(discountedPrice) : null,
        sku: sku || generateSku(),
        category_id: categoryId || null,
        stock_quantity: Number(quantity),
        is_active: isActive,
        is_featured: isFeatured,
        brand: brand.trim() || null,
        tags: tags.trim() ? tags.split(",").map(tag => tag.trim()).filter(tag => tag) : null,
        updated_at: new Date().toISOString()
      };

      const { error: updateErr } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (updateErr) {
        setError(`Failed to update product: ${updateErr.message}`);
        setUpdating(false);
        return;
      }

      if (imageFile) {
        const existingImage = editingProduct.images?.find(img => img.is_primary);
        if (existingImage) {
          try {
            const url = new URL(existingImage.url);
            const pathParts = url.pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const filePath = `products/${fileName}`;

            await supabase.storage
              .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
              .remove([filePath]);
          } catch (error) {
            console.warn('Could not extract file path from URL for deletion:', error);
          }

          await supabase
            .from("product_images")
            .delete()
            .eq("id", existingImage.id);
        }

        const uploadResult = await uploadImage(imageFile, STORAGE_BUCKETS.PRODUCT_IMAGES, 'products');

        if (uploadResult.error) {
          setError(`Product updated but image upload failed: ${uploadResult.error}`);
        } else {
          const { error: insertImgErr } = await supabase
            .from("product_images")
            .insert({
              product_id: editingProduct.id,
              url: uploadResult.url,
              alt_text: name,
              is_primary: true,
              sort_order: 1
            });

          if (insertImgErr) {
            console.warn("Image uploaded but failed to create record:", insertImgErr);
          }
        }
      }

      clearForm();
      setIsModalOpen(false);
      setSuccessMessage("Product updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      await load();

    } catch (err) {
      console.error("Update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update product");
    }

    setUpdating(false);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    setCreating(true);
    setError(null);

    if (imageFile) {
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        setError(validation.error || "Invalid image file");
        setCreating(false);
        return;
      }
    }

    try {
      const productData = {
        name,
        price: Number(price),
        discounted_price: discountedPrice ? Number(discountedPrice) : null,
        sku: sku || generateSku(),
        category_id: categoryId || null,
        stock_quantity: Number(quantity),
        is_active: isActive,
        is_featured: isFeatured,
        brand: brand.trim() || null,
        tags: tags.trim() ? tags.split(",").map(tag => tag.trim()).filter(tag => tag) : null,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("products")
        .insert([productData])
        .select("id")
        .single();

      if (insertErr) {
        setError(`Failed to create product: ${insertErr.message}`);
        setCreating(false);
        return;
      }

      const newId = inserted!.id as string;

      if (imageFile) {
        const uploadResult = await uploadImage(imageFile, STORAGE_BUCKETS.PRODUCT_IMAGES, 'products');

        if (uploadResult.error) {
          setError(`Product created but image upload failed: ${uploadResult.error}`);
        } else {
          const { error: imgErr } = await supabase
            .from("product_images")
            .insert({
              product_id: newId,
              url: uploadResult.url,
              alt_text: name,
              is_primary: true,
              sort_order: 1
            });

          if (imgErr) {
            console.warn("Image uploaded but failed to create record:", imgErr);
          }
        }
      }

      clearForm();
      setIsModalOpen(false);
      setSuccessMessage("Product created successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      await load();

    } catch (err) {
      console.error("Create error:", err);
      setError(err instanceof Error ? err.message : "Failed to create product");
    }

    setCreating(false);
  }

  async function onDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product? It will be moved to trash.")) return;

    // Soft delete: Set deleted_at timestamp instead of permanently deleting
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setError(`Failed to delete product: ${error.message}`);
    } else {
      setSuccessMessage("Product moved to trash successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    await load();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    clearForm();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImageFile(e.dataTransfer.files[0]);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading products...</span>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">
            Manage your product catalog and inventory
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <span style={{ marginRight: "8px" }}>+</span>
          Add Product
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
            border: "1px solid #28a745",
            borderRadius: "12px",
            padding: "14px 18px",
            color: "#155724",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(40, 167, 69, 0.2)",
          }}
        >
          <span style={{ fontSize: "20px" }}>✓</span>
          <span style={{ fontWeight: "500" }}>{successMessage}</span>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Search products by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: "1 1 300px",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            fontSize: "14px",
            background: "white",
            color: "#1f2937",
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            flex: "0 1 200px",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            fontSize: "14px",
            background: "white",
            color: "#1f2937",
            cursor: "pointer",
          }}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {(searchTerm || categoryFilter) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("");
            }}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              color: "#6b7280",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header">
              <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <button className="modal-close" onClick={handleModalClose}>
                ✕
              </button>
            </div>

            <form onSubmit={editingProduct ? onUpdate : onCreate}>
              <div className="modal-body">
                {/* Required Fields */}
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "16px", color: "#374151" }}>
                    Required Information
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input
                      className="input"
                      placeholder="Enter product name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label className="form-label">Price (PHP) *</label>
                      <input
                        className="input"
                        placeholder="0.00"
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) =>
                          setPrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stock Quantity *</label>
                      <input
                        className="input"
                        placeholder="0"
                        type="number"
                        min="0"
                        step="1"
                        value={quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuantity(val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0));
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="input"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Image *</label>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      style={{
                        border: `2px dashed ${dragActive ? '#FF6B9D' : '#e5e7eb'}`,
                        borderRadius: "10px",
                        padding: "24px",
                        textAlign: "center",
                        background: dragActive ? '#fef1f6' : '#fafafa',
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        style={{ display: "none" }}
                      />
                      {imageFile ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          <span style={{ fontSize: "20px" }}>📷</span>
                          <span style={{ fontSize: "14px", color: "#374151" }}>{imageFile.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageFile(null);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "18px",
                              color: "#ef4444",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📤</div>
                          <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#374151" }}>
                            Drag & drop or click to upload
                          </p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                            JPEG, PNG, WebP • Max 5MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Advanced Fields (Collapsible) */}
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "0",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: showAdvanced ? "16px" : "0",
                    }}
                  >
                    <span style={{
                      transform: showAdvanced ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      fontSize: "12px",
                    }}>
                      ▶
                    </span>
                    Advanced Options (Optional)
                  </button>

                  {showAdvanced && (
                    <div style={{ paddingLeft: "20px" }}>
                      <div className="form-group">
                        <label className="form-label">SKU</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            className="input"
                            placeholder="Auto-generated if empty"
                            value={sku}
                            onChange={(e) => setSku(e.target.value.toUpperCase())}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setSku(generateSku())}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            Generate
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Discounted Price (PHP)</label>
                        <input
                          className="input"
                          placeholder="Leave empty if no discount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={discountedPrice}
                          onChange={(e) =>
                            setDiscountedPrice(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Brand</label>
                        <input
                          className="input"
                          placeholder="Enter brand name"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Tags (comma-separated)</label>
                        <input
                          className="input"
                          placeholder="e.g., summer, casual, trendy"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                          />
                          <span className="checkmark"></span>
                          Featured Product
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                          />
                          <span className="checkmark"></span>
                          Active
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Variants (Only for editing existing products) */}
                {editingProduct && (
                  <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
                    <VariantManager
                      productId={editingProduct.id}
                      variants={editingProduct.variants || []}
                      onUpdate={refreshEditingProductVariants}
                    />
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      color: "#dc2626",
                      fontSize: "14px",
                      padding: "12px 16px",
                      background: "#fee2e2",
                      borderRadius: "8px",
                      border: "1px solid #fecaca",
                      marginTop: "16px",
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
                  disabled={creating || updating}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={creating || updating || !canCreate}
                >
                  {creating || updating ? (
                    <>
                      <span
                        className="spinner"
                        style={{ width: 14, height: 14 }}
                      ></span>
                      {updating ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingProduct ? "Update Product" : "Create Product"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {filteredItems.length === 0 ? (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📦</div>
          <h3 style={{ marginBottom: "8px", color: "var(--text)" }}>
            {searchTerm ? "No products found" : "No products yet"}
          </h3>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            {searchTerm
              ? `No products match "${searchTerm}". Try a different search.`
              : "Start by adding your first product to the catalog."}
          </p>
          {!searchTerm && (
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <span style={{ marginRight: "8px" }}>+</span>
              Add First Product
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredItems.map((product) => (
            <div
              key={product.id}
              className="card"
              style={{
                padding: "0",
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
                e.currentTarget.style.borderColor = "#FF6B9D40";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              {/* Product Image */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  paddingBottom: "75%",
                  background: "linear-gradient(135deg, #fef1f6 0%, #f0f9ff 100%)",
                  overflow: "hidden",
                }}
              >
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images.find(img => img.is_primary)?.url || product.images[0]?.url}
                    alt={product.name}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "48px",
                      color: "#d1d5db",
                    }}
                  >
                    📷
                  </div>
                )}

                {/* Badges */}
                <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {product.is_featured && (
                    <span
                      style={{
                        background: "linear-gradient(135deg, #FF6B9D 0%, #C8E4FB 100%)",
                        color: "white",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "600",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      ⭐
                    </span>
                  )}
                  <span
                    style={{
                      background: product.is_active ? "#10b981" : "#6b7280",
                      color: "white",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "600",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    {product.is_active ? "✓" : "✕"}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div style={{ padding: "12px" }}>
                {/* Category Badge */}
                {product.category && (
                  <div style={{ marginBottom: "6px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: "linear-gradient(135deg, #fef1f6 0%, #f0f9ff 100%)",
                        color: "#FF6B9D",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "600",
                      }}
                    >
                      {product.category.name}
                    </span>
                  </div>
                )}

                {/* Product Name */}
                <h3
                  style={{
                    margin: "0 0 4px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#1f2937",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {product.name}
                </h3>

                {/* Brand */}
                {product.brand && (
                  <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#6b7280" }}>
                    {product.brand}
                  </p>
                )}

                {/* Price */}
                <div style={{ marginBottom: "8px" }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      background: "linear-gradient(135deg, #FF6B9D 0%, #C8E4FB 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {formatCurrency(product.price)}
                  </div>
                  {product.discounted_price && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        textDecoration: "line-through",
                      }}
                    >
                      {formatCurrency(product.discounted_price)}
                    </div>
                  )}
                </div>

                {/* Stock & SKU */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background:
                          product.stock_quantity > 10
                            ? "#10b981"
                            : product.stock_quantity > 0
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>
                      {product.stock_quantity}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#9ca3af",
                      background: "#f3f4f6",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontFamily: "monospace",
                    }}
                  >
                    {product.sku}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(product);
                    }}
                    style={{
                      flex: 1,
                      fontSize: "11px",
                      padding: "6px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(product.id);
                    }}
                    style={{
                      flex: 1,
                      fontSize: "11px",
                      padding: "6px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
