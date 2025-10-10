import { supabase } from "./supabase";
import { Product } from "../types";

export interface WishlistItem {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
  product: Product;
}

/**
 * Get all wishlist items for a user
 */
export const getWishlistItems = async (
  userId: string
): Promise<WishlistItem[]> => {
  const { data, error } = await supabase
    .from("wishlist")
    .select(
      `
      *,
      product:products(
        *,
        images:product_images(url, alt_text, is_primary)
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Add a product to wishlist
 */
export const addToWishlist = async (
  userId: string,
  productId: string
): Promise<void> => {
  const { error } = await supabase
    .from("wishlist")
    .insert({ user_id: userId, product_id: productId });

  if (error) throw error;
};

/**
 * Remove a product from wishlist by wishlist item ID
 */
export const removeFromWishlist = async (itemId: string): Promise<void> => {
  const { error } = await supabase.from("wishlist").delete().eq("id", itemId);

  if (error) throw error;
};

/**
 * Remove a product from wishlist by product ID
 */
export const removeFromWishlistByProductId = async (
  userId: string,
  productId: string
): Promise<void> => {
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) throw error;
};

/**
 * Check if a product is in the user's wishlist
 */
export const isInWishlist = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

/**
 * Toggle product in wishlist (add if not present, remove if present)
 */
export const toggleWishlist = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  const inWishlist = await isInWishlist(userId, productId);

  if (inWishlist) {
    await removeFromWishlistByProductId(userId, productId);
    return false;
  } else {
    await addToWishlist(userId, productId);
    return true;
  }
};

/**
 * Get wishlist count for a user
 */
export const getWishlistCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from("wishlist")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count || 0;
};
