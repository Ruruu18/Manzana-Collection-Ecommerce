import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

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

interface VariantManagerProps {
  productId: string;
  variants: ProductVariant[];
  onUpdate: () => void;
}

export default function VariantManager({ productId, variants, onUpdate }: VariantManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [variantType, setVariantType] = useState<"size" | "color" | "style">("color");
  const [variantValue, setVariantValue] = useState("");
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0);
  const [skuSuffix, setSkuSuffix] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddVariant = async () => {
    if (!variantValue.trim()) {
      setError("Variant value is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      console.log("Adding variant:", {
        product_id: productId,
        name: `${variantType.charAt(0).toUpperCase() + variantType.slice(1)} ${variantValue}`,
        type: variantType,
        value: variantValue,
        stock_quantity: stockQuantity,
        price_adjustment: priceAdjustment,
        sku_suffix: skuSuffix || variantValue.substring(0, 3).toUpperCase(),
        is_active: true,
      });

      const { data, error: insertError } = await supabase
        .from("product_variants")
        .insert({
          product_id: productId,
          name: `${variantType.charAt(0).toUpperCase() + variantType.slice(1)} ${variantValue}`,
          type: variantType,
          value: variantValue,
          stock_quantity: stockQuantity,
          price_adjustment: priceAdjustment,
          sku_suffix: skuSuffix || variantValue.substring(0, 3).toUpperCase(),
          is_active: true,
        })
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      console.log("Variant added successfully:", data);

      // Reset form
      setVariantValue("");
      setStockQuantity(0);
      setPriceAdjustment(0);
      setSkuSuffix("");
      setShowForm(false);

      // Reload variants
      await onUpdate();
    } catch (err) {
      console.error("Error adding variant:", err);
      setError(err instanceof Error ? err.message : "Failed to add variant");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", variantId);

      if (deleteError) throw deleteError;
      onUpdate();
    } catch (err) {
      console.error("Error deleting variant:", err);
      alert("Failed to delete variant");
    }
  };

  const toggleVariantActive = async (variant: ProductVariant) => {
    try {
      const { error: updateError } = await supabase
        .from("product_variants")
        .update({ is_active: !variant.is_active })
        .eq("id", variant.id);

      if (updateError) throw updateError;
      onUpdate();
    } catch (err) {
      console.error("Error updating variant:", err);
      alert("Failed to update variant");
    }
  };

  return (
    <div style={{ marginTop: "20px", padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#374151" }}>
          Product Variants ({variants.length})
        </h4>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowForm(!showForm)}
          style={{ fontSize: "12px", padding: "6px 12px" }}
        >
          {showForm ? "Cancel" : "+ Add Variant"}
        </button>
      </div>

      {/* Add Variant Form */}
      {showForm && (
        <div style={{ marginBottom: "16px", padding: "12px", background: "white", borderRadius: "6px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#6b7280" }}>
                Type *
              </label>
              <select
                className="input"
                value={variantType}
                onChange={(e) => setVariantType(e.target.value as any)}
                required
                style={{ fontSize: "13px", padding: "8px" }}
              >
                <option value="color">Color</option>
                <option value="size">Size</option>
                <option value="style">Style</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#6b7280" }}>
                Value *
              </label>
              <input
                className="input"
                type="text"
                value={variantValue}
                onChange={(e) => setVariantValue(e.target.value)}
                placeholder={variantType === "color" ? "e.g., Red" : variantType === "size" ? "e.g., M" : "e.g., V-neck"}
                required
                style={{ fontSize: "13px", padding: "8px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#6b7280" }}>
                Stock
              </label>
              <input
                className="input"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                style={{ fontSize: "13px", padding: "8px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#6b7280" }}>
                Price Adj. (₱)
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                style={{ fontSize: "13px", padding: "8px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#6b7280" }}>
                SKU Suffix
              </label>
              <input
                className="input"
                type="text"
                value={skuSuffix}
                onChange={(e) => setSkuSuffix(e.target.value.toUpperCase())}
                placeholder="Auto"
                style={{ fontSize: "13px", padding: "8px" }}
              />
            </div>
          </div>

          {error && (
            <div style={{ color: "#dc2626", fontSize: "12px", marginBottom: "8px" }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleAddVariant}
            className="btn btn-primary"
            disabled={saving}
            style={{ width: "100%", fontSize: "13px", padding: "8px" }}
          >
            {saving ? "Adding..." : "Add Variant"}
          </button>
        </div>
      )}

      {/* Variants List */}
      {variants.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontSize: "13px" }}>
          No variants yet. Add color, size, or style variations.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {variants.map((variant) => (
            <div
              key={variant.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                background: "white",
                borderRadius: "6px",
                border: `1px solid ${variant.is_active ? "#e5e7eb" : "#f3f4f6"}`,
                opacity: variant.is_active ? 1 : 0.6,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      background: variant.type === "color" ? "#fef1f6" : variant.type === "size" ? "#f0f9ff" : "#fef3c7",
                      color: variant.type === "color" ? "#FF6B9D" : variant.type === "size" ? "#0284c7" : "#d97706",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    {variant.type}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>
                    {variant.value}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>
                  Stock: {variant.stock_quantity} •
                  {variant.price_adjustment !== 0 && (
                    <> Price: {variant.price_adjustment > 0 ? "+" : ""}₱{variant.price_adjustment.toFixed(2)} •</>
                  )}
                  {" "}SKU: {variant.sku_suffix}
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => toggleVariantActive(variant)}
                  style={{
                    background: "none",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "11px",
                    color: variant.is_active ? "#10b981" : "#6b7280",
                  }}
                  title={variant.is_active ? "Deactivate" : "Activate"}
                >
                  {variant.is_active ? "✓" : "✕"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteVariant(variant.id)}
                  style={{
                    background: "none",
                    border: "1px solid #fee2e2",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "11px",
                    color: "#dc2626",
                  }}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
