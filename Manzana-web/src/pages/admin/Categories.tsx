import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { uploadImage, deleteImage, validateImageFile, STORAGE_BUCKETS } from "../../utils/imageUpload";

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    is_active: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading categories:", error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async () => {
    if (editingCategory?.image_url && formData.image_url) {
      // Extract path from URL for deletion
      const urlParts = formData.image_url.split('/');
      const path = urlParts.slice(-2).join('/'); // Get folder/filename
      
      const { error } = await deleteImage(STORAGE_BUCKETS.CATEGORY_IMAGES, path);
      if (error) {
        console.error('Error deleting image:', error);
      }
    }
    
    setSelectedFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let imageUrl = formData.image_url;

      // Handle image upload if a new file is selected
      if (selectedFile) {
        const uploadResult = await uploadImage(
          selectedFile,
          STORAGE_BUCKETS.CATEGORY_IMAGES,
          "categories"
        );

        if (uploadResult.error) {
          alert("Failed to upload image: " + uploadResult.error);
          setUploading(false);
          return;
        }

        imageUrl = uploadResult.url;
      }

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name,
            description: formData.description || null,
            image_url: imageUrl || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCategory.id);

        if (error) {
          console.error("Error updating category:", error);
          alert("Failed to update category: " + error.message);
          setUploading(false);
          return;
        }
      } else {
        // Create new category
        const { error } = await supabase
          .from("categories")
          .insert([
            {
              name: formData.name,
              description: formData.description || null,
              image_url: imageUrl || null,
              is_active: formData.is_active,
            },
          ]);

        if (error) {
          console.error("Error creating category:", error);
          alert("Failed to create category: " + error.message);
          setUploading(false);
          return;
        }
      }

      // Reset form and reload categories
      setFormData({ name: "", description: "", image_url: "", is_active: true });
      setSelectedFile(null);
      setImagePreview(null);
      setEditingCategory(null);
      setIsModalOpen(false);
      await loadCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("Failed to save category. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active,
    });
    setSelectedFile(null);
    setImagePreview(category.image_url);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting category:", error);
        alert("Failed to delete category: " + error.message);
        return;
      }

      await loadCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", category.id);

      if (error) {
        console.error("Error updating category status:", error);
        return;
      }

      await loadCategories();
    } catch (error) {
      console.error("Failed to update category status:", error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "", image_url: "", is_active: true });
    setSelectedFile(null);
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="categories-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">
            Manage product categories and organization
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          ➕ Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="card">
        <div className="table-container">
                      <table className="table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
                          <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="category-image">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              borderRadius: "var(--radius-sm)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "50px",
                              height: "50px",
                              backgroundColor: "var(--border-light)",
                              borderRadius: "var(--radius-sm)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--muted)",
                              fontSize: "12px",
                            }}
                          >
                            📂
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: "var(--font-weight-semibold)" }}>
                        {category.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                        {category.description || "No description"}
                      </div>
                    </td>
                  <td>
                    <button
                      className={`badge ${
                        category.is_active ? "success" : "danger"
                      }`}
                      onClick={() => handleToggleStatus(category)}
                      style={{
                        cursor: "pointer",
                        border: "none",
                        background: "transparent",
                      }}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "14px" }}>
                    {new Date(category.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(category)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <h3>No categories found</h3>
              <p>Start by creating your first product category.</p>
              <button
                className="btn btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                Add Category
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? "Edit Category" : "Add New Category"}</h2>
              <button className="modal-close" onClick={handleModalClose}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="name">Category Name*</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter category description"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Category Image</label>
                  {imagePreview && (
                    <div className="image-preview">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "var(--radius)",
                          marginBottom: "var(--spacing-sm)",
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={handleRemoveImage}
                        style={{ marginLeft: "var(--spacing-sm)" }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{
                      width: "100%",
                      padding: "12px var(--spacing)",
                      border: "2px dashed var(--border)",
                      borderRadius: "var(--radius)",
                      background: "var(--surface-hover)",
                      cursor: "pointer",
                    }}
                  />
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "var(--spacing-sm)" }}>
                    Upload JPEG, PNG, or WebP images (max 5MB)
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                    />
                    <span className="checkmark"></span>
                    Active Category
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleModalClose}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
