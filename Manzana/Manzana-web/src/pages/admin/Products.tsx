import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { uploadImage, validateImageFile, STORAGE_BUCKETS } from "../../utils/imageUpload";



interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  file_path?: string;
  file_size?: number;
  file_type?: string;
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
  description?: string;
  price: number;
  discounted_price?: number;
  sku: string;
  category_id?: string;
  stock_quantity: number;
  min_stock_level?: number;
  is_active: boolean;
  is_featured: boolean;
  tags?: string[];
  brand?: string;
  material?: string;
  care_instructions?: string;
  weight?: number;
  dimensions?: any;
  created_at?: string;
  updated_at?: string;
  images?: ProductImage[];
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
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [discountedPrice, setDiscountedPrice] = useState<number | "">("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [minStockLevel, setMinStockLevel] = useState<number>(5);
  const [categoryId, setCategoryId] = useState<string>("");
  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    
    // Simple timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Load timeout - stopping loading state');
      setLoading(false);
      setError('Loading timed out. Please try again.');
    }, 10000);
    
    try {
      // Load products with complete data including category information
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, description, price, discounted_price, sku, 
          category_id, stock_quantity, min_stock_level, is_active, 
          is_featured, tags, brand, material, care_instructions, 
          weight, created_at, updated_at,
          categories (id, name, description)
        `)
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
          description: product.description,
          price: product.price,
          discounted_price: product.discounted_price,
          sku: product.sku,
          category_id: product.category_id,
          stock_quantity: product.stock_quantity,
          min_stock_level: product.min_stock_level,
          is_active: product.is_active,
          is_featured: product.is_featured,
          tags: product.tags,
          brand: product.brand,
          material: product.material,
          care_instructions: product.care_instructions,
          weight: product.weight,
          created_at: product.created_at,
          updated_at: product.updated_at,
          category: product.categories,
          images: [] // Will be loaded separately if needed
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
    // Start loading immediately
    load();
    loadCategories();
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [items, searchTerm]);

  const canCreate = useMemo(
    () => !!name && !!price && !!sku && quantity >= 0,
    [name, price, sku, quantity],
  );

  function clearForm() {
    setName("");
    setDescription("");
    setPrice("");
    setDiscountedPrice("");
    setSku("");
    setQuantity(0);
    setMinStockLevel(5);
    setCategoryId("");
    setBrand("");
    setMaterial("");
    setCareInstructions("");
    setWeight("");
    setIsFeatured(false);
    setIsActive(true);
    setTags("");
    setImageFile(null);
    setEditingProduct(null);
    setError(null);
  }

  function startEdit(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price);
    setDiscountedPrice(product.discounted_price || "");
    setSku(product.sku);
    setQuantity(product.stock_quantity);
    setMinStockLevel(product.min_stock_level || 5);
    setCategoryId(product.category_id || "");
    setBrand(product.brand || "");
    setMaterial(product.material || "");
    setCareInstructions(product.care_instructions || "");
    setWeight(product.weight || "");
    setIsFeatured(product.is_featured);
    setIsActive(product.is_active);
    setTags(product.tags?.join(", ") || "");
    setImageFile(null);
    setIsModalOpen(true);
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingProduct || !canCreate) return;
    
    setUpdating(true);
    setError(null);

    // Validate image file if provided
    if (imageFile) {
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        setError(validation.error || "Invalid image file");
        setUpdating(false);
        return;
      }
    }

    try {
      // Prepare product data for update
      const productData = {
        name,
        description: description.trim() || null,
        price: Number(price),
        discounted_price: discountedPrice ? Number(discountedPrice) : null,
        sku,
        category_id: categoryId || null,
        stock_quantity: Number(quantity),
        min_stock_level: Number(minStockLevel),
        is_active: isActive,
        is_featured: isFeatured,
        brand: brand.trim() || null,
        material: material.trim() || null,
        care_instructions: careInstructions.trim() || null,
        weight: weight ? Number(weight) : null,
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

      // Handle image upload if provided
      if (imageFile) {
        // Delete existing primary image if any
        const existingImage = editingProduct.images?.find(img => img.is_primary);
        if (existingImage?.file_path) {
          // Delete from storage
          await supabase.storage
            .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
            .remove([existingImage.file_path]);
          
          // Delete image record
          await supabase
            .from("product_images")
            .delete()
            .eq("id", existingImage.id);
        }

        // Upload new image
        const uploadResult = await uploadImage(imageFile, STORAGE_BUCKETS.PRODUCT_IMAGES, 'products');
        
        if (uploadResult.error) {
          setError(`Product updated but image upload failed: ${uploadResult.error}`);
        } else {
          // Create new image record
          const { error: insertImgErr } = await supabase
            .from("product_images")
            .insert({
              product_id: editingProduct.id,
              url: uploadResult.url,
              file_path: uploadResult.path,
              alt_text: name,
              is_primary: true,
              sort_order: 1,
              file_size: imageFile.size,
              file_type: imageFile.type
            });

          if (insertImgErr) {
            console.warn("Image uploaded but failed to create record:", insertImgErr);
          }
        }
      }

      // Success - clear form and reload
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

    // Validate image file if provided
    if (imageFile) {
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        setError(validation.error || "Invalid image file");
        setCreating(false);
        return;
      }
    }

    try {
      // Prepare product data for creation
      const productData = {
        name,
        description: description.trim() || null,
        price: Number(price),
        discounted_price: discountedPrice ? Number(discountedPrice) : null,
        sku,
        category_id: categoryId || null,
        stock_quantity: Number(quantity),
        min_stock_level: Number(minStockLevel),
        is_active: isActive,
        is_featured: isFeatured,
        brand: brand.trim() || null,
        material: material.trim() || null,
        care_instructions: careInstructions.trim() || null,
        weight: weight ? Number(weight) : null,
        tags: tags.trim() ? tags.split(",").map(tag => tag.trim()).filter(tag => tag) : null,
      };

      // Insert product
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

      // Handle image upload if provided
      if (imageFile) {
        const uploadResult = await uploadImage(imageFile, STORAGE_BUCKETS.PRODUCT_IMAGES, 'products');
        
        if (uploadResult.error) {
          setError(`Product created but image upload failed: ${uploadResult.error}`);
        } else {
          // Create image record
          const { error: imgErr } = await supabase
            .from("product_images")
            .insert({
              product_id: newId,
              url: uploadResult.url,
              file_path: uploadResult.path,
              alt_text: name,
              is_primary: true,
              sort_order: 1,
              file_size: imageFile.size,
              file_type: imageFile.type
            });
          
          if (imgErr) {
            console.warn("Image uploaded but failed to create record:", imgErr);
          }
        }
      }

      // Success - clear form and reload
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
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      setError(`Failed to delete product: ${error.message}`);
    } else {
      setSuccessMessage("Product deleted successfully!");
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



  return (
    <div className="products-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Products Management</h1>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            ➕ Add Product
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            background: "var(--success-light)",
            border: "1px solid var(--success)",
            borderRadius: "var(--radius)",
            padding: "var(--spacing-sm) var(--spacing)",
            color: "var(--success)",
            marginBottom: "var(--spacing-lg)",
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-sm)"
          }}
        >
          <span>✅</span>
          {successMessage}
        </div>
      )}

      {/* Search Bar */}
      <div className="search-bar" style={{ marginBottom: "var(--spacing-lg)" }}>
        <div className="search">
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <button className="modal-close" onClick={handleModalClose}>
                ✕
              </button>
            </div>

            <form onSubmit={editingProduct ? onUpdate : onCreate}>
              <div className="modal-body">
            {/* Basic Information */}
            <div className="grid cols-2">
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
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input
                  className="input"
                  placeholder="Enter unique SKU"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="input"
                placeholder="Enter product description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            {/* Pricing */}
            <div className="grid cols-2">
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
                <label className="form-label">Discounted Price (PHP)</label>
                <input
                  className="input"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountedPrice}
                  onChange={(e) =>
                    setDiscountedPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Inventory */}
            <div className="grid cols-3">
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
              <div className="form-group">
                <label className="form-label">Minimum Stock Level</label>
                <input
                  className="input"
                  placeholder="5"
                  type="number"
                  min="0"
                  step="1"
                  value={minStockLevel}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMinStockLevel(val === "" ? 5 : Math.max(0, parseInt(val, 10) || 5));
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Details */}
            <div className="grid cols-3">
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
                <label className="form-label">Material</label>
                <input
                  className="input"
                  placeholder="e.g., Cotton, Polyester"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  className="input"
                  placeholder="0.0"
                  type="number"
                  min="0"
                  step="0.1"
                  value={weight}
                  onChange={(e) =>
                    setWeight(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Care Instructions</label>
              <textarea
                className="input"
                placeholder="e.g., Machine wash cold, hang dry"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                rows={2}
                style={{ resize: 'vertical', minHeight: '60px' }}
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

            {/* Status Toggles */}
            <div className="grid cols-2">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Product is Active</span>
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <span>Featured Product</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product Image (Optional)</label>
              <input
                className="file"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Supported formats: JPEG, PNG, WebP. Max size: 5MB
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

      {/* Products List */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          <h3 style={{ margin: 0, color: "white" }}>
            Product Catalog ({filteredItems.length})
          </h3>
          {items.length > 0 && (
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>
              Total value:{" "}
              {formatCurrency(items.reduce((sum, item) => sum + item.price, 0))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Loading products...</span>
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
                📦
              </div>
              <h3
                style={{
                  margin: "0 0 var(--spacing-sm)",
                  color: "var(--text)",
                }}
              >
                {searchTerm ? "No products found" : "No products yet"}
              </h3>
              <p style={{ margin: 0 }}>
                {searchTerm
                  ? `No products match "${searchTerm}". Try a different search term.`
                  : "Start by adding your first product to the catalog."}
              </p>
              {!searchTerm && (
                <button
                  className="btn btn-primary"
                  style={{ marginTop: "var(--spacing)" }}
                  onClick={() => setIsModalOpen(true)}
                >
                  ➕ Add First Product
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div>
                        <div
                          style={{
                            fontWeight: "var(--font-weight-semibold)",
                            color: "var(--text)",
                            marginBottom: "2px"
                          }}
                        >
                          {product.name}
                        </div>
                        {product.brand && (
                          <div style={{ 
                            fontSize: "12px", 
                            color: "var(--muted)" 
                          }}>
                            {product.brand}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge info" style={{ fontSize: "11px" }}>
                        {product.sku}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px" }}>
                      {product.category?.name || "—"}
                    </td>
                    <td>
                      <div>
                        <div
                          style={{
                            fontWeight: "var(--font-weight-semibold)",
                            color: "var(--success)",
                          }}
                        >
                          {formatCurrency(product.price)}
                        </div>
                        {product.discounted_price && (
                          <div style={{ 
                            fontSize: "12px", 
                            color: "var(--warning)",
                            textDecoration: "line-through"
                          }}>
                            {formatCurrency(product.discounted_price)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ 
                          fontWeight: "var(--font-weight-medium)",
                          color: product.stock_quantity > (product.min_stock_level || 5) 
                            ? "var(--success)" 
                            : product.stock_quantity > 0 
                            ? "var(--warning)" 
                            : "var(--danger)"
                        }}>
                          {product.stock_quantity}
                        </span>
                        {product.stock_quantity <= (product.min_stock_level || 5) && product.stock_quantity > 0 && (
                          <span style={{ fontSize: "12px" }}>⚠️</span>
                        )}
                        {product.stock_quantity === 0 && (
                          <span style={{ fontSize: "12px" }}>🔴</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        <span 
                          className="badge" 
                          style={{ 
                            fontSize: "10px",
                            backgroundColor: product.is_active ? "var(--success-light)" : "var(--muted-light)",
                            color: product.is_active ? "var(--success)" : "var(--muted)"
                          }}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                        {product.is_featured && (
                          <span 
                            className="badge" 
                            style={{ 
                              fontSize: "10px",
                              backgroundColor: "var(--primary-light)",
                              color: "var(--primary)"
                            }}
                          >
                            Featured
                          </span>
                        )}
                      </div>
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
                          title="Edit product"
                          onClick={() => startEdit(product)}
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
                          onClick={() => onDelete(product.id)}
                          title="Delete product"
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
