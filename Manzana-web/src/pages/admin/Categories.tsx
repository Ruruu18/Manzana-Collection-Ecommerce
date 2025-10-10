import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getCategoryIcon } from "../../utils/categoryIcons";
import "../../styles/dashboard-enhancement.css";

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_category_id: string | null;
  level: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  parent_name?: string;
  subcategories?: Category[];
}

export default function Categories() {
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_category_id: "",
    level: 0,
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Load all categories with parent info
      const { data, error } = await supabase
        .from("categories")
        .select(`
          *,
          parent:parent_category_id (
            name
          )
        `)
        .order("level", { ascending: true })
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error loading categories:", error);
        return;
      }

      const allCategories = (data || []).map((cat: any) => ({
        ...cat,
        parent_name: cat.parent?.name || null,
      }));

      // Organize into hierarchical structure
      const parents = allCategories.filter((cat: any) => cat.level === 0);
      const children = allCategories.filter((cat: any) => cat.level === 1);

      // Add subcategories to parents
      const hierarchical = parents.map((parent: any) => ({
        ...parent,
        subcategories: children.filter(
          (child: any) => child.parent_category_id === parent.id
        ),
      }));

      setParentCategories(parents);
      setHierarchicalCategories(hierarchical);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const parentId = formData.parent_category_id || null;
      const level = parentId ? 1 : 0;

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name,
            description: formData.description || null,
            parent_category_id: parentId,
            level: level,
            display_order: formData.display_order || 0,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCategory.id);

        if (error) {
          console.error("Error updating category:", error);
          alert("Failed to update category: " + error.message);
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
              parent_category_id: parentId,
              level: level,
              display_order: formData.display_order || 0,
              is_active: formData.is_active,
            },
          ]);

        if (error) {
          console.error("Error creating category:", error);
          alert("Failed to create category: " + error.message);
          return;
        }
      }

      // Reset form and reload categories
      setFormData({
        name: "",
        description: "",
        parent_category_id: "",
        level: 0,
        display_order: 0,
        is_active: true,
      });
      setEditingCategory(null);
      setIsModalOpen(false);
      await loadCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("Failed to save category. Please try again.");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      parent_category_id: category.parent_category_id || "",
      level: category.level,
      display_order: category.display_order,
      is_active: category.is_active,
    });
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
    setFormData({
      name: "",
      description: "",
      parent_category_id: "",
      level: 0,
      display_order: 0,
      is_active: true,
    });
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
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
            Organize your products into categories and collections
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <span style={{ marginRight: "8px" }}>+</span>
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {hierarchicalCategories.length === 0 ? (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📂</div>
          <h3 style={{ marginBottom: "8px", color: "var(--text)" }}>No categories yet</h3>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            Start by creating your first product category.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <span style={{ marginRight: "8px" }}>+</span>
            Add Category
          </button>
        </div>
      ) : (
        <div style={{
          maxHeight: "calc(100vh - 250px)",
          overflowY: "auto",
          paddingRight: "4px"
        }}>
          <div style={{ display: "grid", gap: "16px" }}>
            {hierarchicalCategories.map((parent) => {
              const isExpanded = expandedCategories.has(parent.id);
              const hasSubcategories = parent.subcategories && parent.subcategories.length > 0;

              return (
                <div
                  key={parent.id}
                  className="card"
                  style={{
                    padding: "0",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* Parent Category */}
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: hasSubcategories && isExpanded ? "1px solid #f3f4f6" : "none",
                      background: "linear-gradient(135deg, #fef1f6 0%, #f0f9ff 100%)",
                    }}
                  >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      background: "linear-gradient(135deg, #FF6B9D 0%, #C8E4FB 100%)",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      flexShrink: 0,
                      boxShadow: "0 4px 6px rgba(255, 107, 157, 0.2)",
                    }}
                  >
                    {getCategoryIcon(parent.name)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "600", color: "#1f2937" }}>
                        {parent.name}
                      </h3>
                      <span
                        className={`badge ${parent.is_active ? "success" : "danger"}`}
                        onClick={() => handleToggleStatus(parent)}
                        style={{
                          cursor: "pointer",
                          fontSize: "11px",
                          padding: "3px 10px",
                          fontWeight: "500",
                        }}
                      >
                        {parent.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "#6b7280" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "14px" }}>🗂️</span> Parent
                      </span>
                      {hasSubcategories && (
                        <>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "14px" }}>📦</span> {parent.subcategories!.length} {parent.subcategories!.length === 1 ? 'collection' : 'collections'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCategoryExpanded(parent.id);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "13px",
                              color: "#FF6B9D",
                              fontWeight: "500",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 107, 157, 0.1)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            {isExpanded ? "▼ Hide" : "▶ Show"}
                          </button>
                        </>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "14px" }}>📅</span> {new Date(parent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(parent)}
                      style={{
                        minWidth: "70px",
                        fontSize: "13px",
                        padding: "6px 12px",
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(parent.id)}
                      style={{
                        minWidth: "80px",
                        fontSize: "13px",
                        padding: "6px 12px",
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              {hasSubcategories && isExpanded && (
                <div style={{ padding: "12px 16px 16px 16px", background: "#fafafa" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    {parent.subcategories!.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          padding: "12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          background: "white",
                          transition: "all 0.15s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.borderColor = "#FF6B9D40";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = "#e5e7eb";
                        }}
                      >
                        {/* Sub Icon */}
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            background: "linear-gradient(135deg, #FFE5EF 0%, #E0F2FE 100%)",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            flexShrink: 0,
                          }}
                        >
                          {getCategoryIcon(sub.name)}
                        </div>

                        {/* Sub Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                            <h4
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#374151",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {sub.name}
                            </h4>
                            <span
                              className={`badge ${sub.is_active ? "success" : "danger"}`}
                              onClick={() => handleToggleStatus(sub)}
                              style={{
                                cursor: "pointer",
                                fontSize: "9px",
                                padding: "2px 6px",
                                flexShrink: 0,
                              }}
                            >
                              {sub.is_active ? "✓" : "✕"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              className="btn btn-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(sub);
                              }}
                              style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px" }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(sub.id);
                              }}
                              style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px" }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
          </div>
        </div>
      )}

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
                  <label htmlFor="parent_category_id">Category Type</label>
                  <select
                    id="parent_category_id"
                    value={formData.parent_category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_category_id: e.target.value })
                    }
                  >
                    <option value="">Parent Category (e.g., T-Shirts, Dress)</option>
                    {parentCategories.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        Subcategory of: {parent.name}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: "var(--muted)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                    Leave empty for main categories, or select a parent for subcategories (e.g., Girl Collection, Men Collection)
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Category Name*</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={formData.parent_category_id ? "e.g., Girl Collection, Men Collection" : "e.g., T-Shirts, Dress, Shoes"}
                    required
                  />
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
