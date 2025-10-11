import { supabase } from './supabase';
import { cartService } from './cart';
import { fetchActivePromotions, getProductFinalPrice } from '../utils/cartPromotionUtils';

export interface CreateOrderParams {
  userId: string;
  pickupDate: string;
  pickupTime: string;
  contactNumber: string;
  notes?: string;
  paymentMethod: 'cash' | 'card' | 'e-wallet';
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state?: string;
    zipCode?: string;
  };
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total_amount: number;
  pickup_date: string;
  pickup_time: string;
  pickup_notes?: string;
  payment_method_pickup: string;
  created_at: string;
  order_items?: any[];
}

export const orderService = {
  /**
   * Generate unique order number
   */
  generateOrderNumber(): string {
    // Use Philippines timezone (UTC+8)
    const date = new Date();

    // Convert to Philippines time by adding 8 hours to UTC
    const utcTime = date.getTime();
    const phOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const phDate = new Date(utcTime + phOffset);

    const year = phDate.getUTCFullYear();
    const month = String(phDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(phDate.getUTCDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');

    return `MZ-${year}${month}${day}-${random}`;
  },

  /**
   * Create pickup order from cart
   */
  async createPickupOrder(params: CreateOrderParams) {
    try {

      // 1. Get cart items
      const { data: cartItems, error: cartError } = await cartService.getCart(
        params.userId
      );

      if (cartError || !cartItems || cartItems.length === 0) {
        return {
          data: null,
          error: 'Cart is empty or could not be loaded',
        };
      }

      // 2. Fetch active promotions
      const activePromotions = await fetchActivePromotions();

      // 3. Calculate totals with promotions
      let subtotal = 0;
      let discountAmount = 0;
      const orderItems = cartItems.map((item) => {
        const product = item.product;
        if (!product) {
          // Fallback if product is missing
          const price = 0;
          return {
            product_id: item.product_id,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            unit_price: price,
            total_price: 0,
          };
        }

        // Get price with promotions applied
        const { finalPrice, originalPrice } = getProductFinalPrice(product, activePromotions);
        const itemTotal = finalPrice * item.quantity;
        const itemDiscount = (originalPrice - finalPrice) * item.quantity;

        subtotal += itemTotal;
        discountAmount += itemDiscount;

        return {
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
          unit_price: finalPrice, // Save the final price (with promotion)
          total_price: itemTotal,
        };
      });

      const totalAmount = subtotal; // No tax/shipping for pickup

      // 4. Generate order number
      const orderNumber = this.generateOrderNumber();

      // 5. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: params.userId,
          order_number: orderNumber,
          status: 'pending',
          subtotal,
          tax_amount: 0,
          shipping_amount: 0,
          discount_amount: discountAmount, // Save total promotion discount
          total_amount: totalAmount,
          pickup_date: params.pickupDate,
          pickup_time: params.pickupTime,
          pickup_notes: params.notes,
          payment_method_pickup: params.paymentMethod,
          payment_status: 'pending', // Will be paid at pickup
          shipping_address: params.shippingAddress,
          billing_address: params.shippingAddress,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // 6. Create order items
      const orderItemsWithOrderId = orderItems.map((item) => ({
        ...item,
        order_id: order.id,
      }));

      console.log('📦 Creating order items:', orderItemsWithOrderId);

      const { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsWithOrderId)
        .select();

      if (itemsError) {
        console.error('❌ Error creating order items:', itemsError);
        // Rollback: delete order
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }

      console.log('✅ Order items created:', insertedItems);

      // 7. Reduce stock for each product atomically (prevents race conditions)
      for (const item of cartItems) {
        const { data: stockResult, error: stockError } = await supabase.rpc(
          'decrement_stock_atomic',
          {
            product_id_param: item.product_id,
            quantity_param: item.quantity,
          }
        );

        // Check if stock decrement was successful
        if (stockError || !stockResult?.[0]?.success) {
          // Rollback: delete order and order items
          await supabase.from('order_items').delete().eq('order_id', order.id);
          await supabase.from('orders').delete().eq('id', order.id);

          return {
            data: null,
            error: stockResult?.[0]?.message || 'Insufficient stock for one or more items',
          };
        }
      }

      // 8. Clear cart
      await cartService.clearCart(params.userId);

      // 9. Create notification for user
      await supabase.from('notifications').insert({
        user_id: params.userId,
        title: '✅ Order Placed Successfully!',
        message: `Your order ${orderNumber} has been placed. We'll notify you when it's ready for pickup.`,
        type: 'order',
        data: { orderId: order.id, orderNumber },
        action_url: `/orders/${order.id}`,
      });

      // 10. Create notification for all admins/staff
      const { data: admins } = await supabase
        .from('users')
        .select('id, push_token')
        .in('user_type', ['admin', 'staff']);

      if (admins && admins.length > 0) {
        const adminNotifications = admins.map((admin) => ({
          user_id: admin.id,
          title: '🛍️ New Order Received!',
          message: `Order ${orderNumber} - ₱${totalAmount.toFixed(2)} - ${params.shippingAddress.fullName}`,
          type: 'order',
          data: { orderId: order.id, orderNumber },
          action_url: `/admin/orders/${order.id}`,
        }));

        await supabase.from('notifications').insert(adminNotifications);
      }

      return { data: order, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Get user's orders with pagination
   */
  async getUserOrders(userId: string, page: number = 1, pageSize: number = 20) {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            *,
            products (
              id,
              name,
              price,
              product_images (url, is_primary)
            )
          )
        `,
          { count: 'exact' }
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          hasMore: count ? to < count - 1 : false,
          totalPages: count ? Math.ceil(count / pageSize) : 0,
        },
      };
    } catch (error: any) {
      return { data: null, error: error.message, pagination: null };
    }
  },

  /**
   * Get single order details
   */
  async getOrderById(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          users (
            id,
            email,
            full_name,
            phone
          ),
          order_items (
            *,
            products (
              id,
              name,
              price,
              product_images (url, is_primary)
            )
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Update order status (admin/staff only)
   * Automatically creates notification via database trigger
   *
   * Status flow for PICKUP orders:
   * pending → confirmed → processing → ready → completed
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled',
    updatedBy?: string
  ) {
    try {
      // Update order status
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select('*, users(id, full_name, email, push_token)')
        .single();

      if (error) throw error;

      // Database trigger will automatically create notification
      // No need to manually insert notification here

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Cancel order (customer or admin)
   */
  async cancelOrder(orderId: string, userId: string) {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      // Check if user owns this order
      if (order.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      // Can only cancel if pending or confirmed
      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new Error('Cannot cancel order in current status');
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Restore stock
      for (const item of order.order_items) {
        await supabase.rpc('increment_stock', {
          product_id: item.product_id,
          quantity: item.quantity,
        });
      }

      // Notify user
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: '❌ Order Cancelled',
        message: `Your order ${order.order_number} has been cancelled.`,
        type: 'order',
        data: { orderId: order.id },
      });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },
};
