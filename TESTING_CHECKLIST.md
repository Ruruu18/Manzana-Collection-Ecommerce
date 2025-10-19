# Manzana Collection - Complete Testing Checklist

## 🎯 Testing Overview
This checklist covers all major features and user flows from Mobile App to Admin Panel.

---

## 📱 MOBILE APP TESTING

### 1. Authentication & Onboarding
- [ ] **Register New Account**
  - [ ] Open app → Navigate to Register
  - [ ] Fill in: Name, Email, Password
  - [ ] Select user type (Consumer/Reseller)
  - [ ] Submit and verify account creation
  - [ ] Check email for verification (if enabled)

- [ ] **Login**
  - [ ] Enter valid credentials
  - [ ] Verify successful login and redirect to Home
  - [ ] Check if user data loads correctly

- [ ] **Logout**
  - [ ] Navigate to Profile → Logout
  - [ ] Verify redirect to login screen
  - [ ] Verify session cleared

- [ ] **Password Reset**
  - [ ] Click "Forgot Password"
  - [ ] Enter email
  - [ ] Check email for reset link

---

### 2. Home Screen
- [ ] **Promotions Section**
  - [ ] Verify active promotions show with "LIVE NOW" badge
  - [ ] Verify upcoming promotions show countdown timer
  - [ ] Verify "22 DAYS TO GO" badge positioned correctly
  - [ ] Verify discount badges are RED
  - [ ] Click promotion → Navigate to PromotionDetails
  - [ ] Verify "View Promotion" / "View Details" buttons work

- [ ] **Categories Section**
  - [ ] Verify all categories display with icons
  - [ ] Click category → Navigate to CategoryProducts
  - [ ] Verify "See all" navigates to Categories screen

- [ ] **Featured Products**
  - [ ] Verify products display with images
  - [ ] Verify promotional prices show (if product in active promotion)
  - [ ] Verify original price is crossed out when promotion active
  - [ ] Click product → Navigate to ProductDetails

- [ ] **New Arrivals**
  - [ ] Verify newest products display
  - [ ] Verify sorting by date

- [ ] **Pull to Refresh**
  - [ ] Pull down to refresh
  - [ ] Verify loading indicator
  - [ ] Verify data updates

---

### 3. Product Browsing & Search
- [ ] **Product Details**
  - [ ] View product images (swipe through gallery)
  - [ ] Read description, specifications
  - [ ] Check stock status
  - [ ] Verify price (promotional price if applicable)
  - [ ] Add to cart with quantity selection
  - [ ] Add to wishlist (heart icon)
  - [ ] Set stock alert (if low stock)

- [ ] **Search**
  - [ ] Search by product name
  - [ ] Search by category
  - [ ] Verify results filter correctly
  - [ ] Verify empty state shows when no results

- [ ] **Category Products**
  - [ ] Browse products by category
  - [ ] Filter and sort options work
  - [ ] Pagination/infinite scroll works

---

### 4. Shopping Cart & Checkout
- [ ] **Cart Management**
  - [ ] Add products to cart
  - [ ] Update quantities (+/-)
  - [ ] Remove products
  - [ ] Verify total calculation
  - [ ] Verify promotional discounts applied
  - [ ] Cart persists across app restarts

- [ ] **Checkout Flow**
  - [ ] Review cart items
  - [ ] Enter/select shipping address
  - [ ] Select payment method
  - [ ] Apply promo code (if available)
  - [ ] Review order summary
  - [ ] Place order

- [ ] **Order Confirmation**
  - [ ] Verify order confirmation screen
  - [ ] Receive order confirmation notification
  - [ ] Order appears in Order History

---

### 5. Notifications
- [ ] **View Notifications**
  - [ ] Open notifications screen
  - [ ] Verify unread count badge on tab
  - [ ] Verify notifications display (promotions, orders, stock alerts)

- [ ] **Mark as Read**
  - [ ] Tap notification
  - [ ] Verify marked as read
  - [ ] Verify unread count decreases

- [ ] **Delete Notification**
  - [ ] Swipe or click delete
  - [ ] Confirm deletion
  - [ ] **CHECK CONSOLE LOGS** for deletion debug info:
    - `🗑️ Attempting to delete notification`
    - `✅ Session is valid`
    - `✅ Notification deleted from database`
  - [ ] Verify notification removed from list
  - [ ] Pull to refresh → **VERIFY IT DOESN'T COME BACK**
  - [ ] Close and reopen app → **VERIFY STILL DELETED**

---

### 6. Promotions
- [ ] **Active Promotions**
  - [ ] View all active promotions
  - [ ] Verify products in promotion show discounted prices
  - [ ] Verify discount calculation correct

- [ ] **Upcoming Promotions (Coming Soon)**
  - [ ] View upcoming promotions (within 30 days)
  - [ ] Verify countdown timer updates every second
  - [ ] Verify "View Details" shows products that will be included

- [ ] **Promotion Details**
  - [ ] View promotion description
  - [ ] View applicable products
  - [ ] View terms and conditions
  - [ ] Verify user type restrictions (consumer/reseller)

---

### 7. Wishlist & Stock Alerts
- [ ] **Wishlist**
  - [ ] Add products to wishlist (heart icon)
  - [ ] View wishlist
  - [ ] Remove from wishlist
  - [ ] Add to cart from wishlist

- [ ] **Stock Alerts**
  - [ ] Set alert for out-of-stock product
  - [ ] Set alert for low-stock product
  - [ ] Verify notification when item back in stock
  - [ ] Remove alert

---

### 8. User Profile & Settings
- [ ] **Profile Management**
  - [ ] View profile info
  - [ ] Edit name, phone, address
  - [ ] Update password
  - [ ] Upload profile picture

- [ ] **Order History**
  - [ ] View all past orders
  - [ ] View order details
  - [ ] Track order status
  - [ ] Reorder items

- [ ] **Settings**
  - [ ] Notification preferences
  - [ ] Language settings
  - [ ] Theme settings (if available)

---

## 💻 ADMIN WEB PANEL TESTING

### 9. Admin Authentication
- [ ] **Login as Admin**
  - [ ] Navigate to admin URL
  - [ ] Login with admin credentials
  - [ ] Verify redirect to dashboard

- [ ] **Role Verification**
  - [ ] Verify admin user has access to all features
  - [ ] Verify staff user has limited access (if applicable)

---

### 10. Admin Dashboard
- [ ] **Overview Stats**
  - [ ] Total sales displayed
  - [ ] Total orders displayed
  - [ ] Total users displayed
  - [ ] Total products displayed
  - [ ] Revenue charts load correctly

- [ ] **Recent Activity**
  - [ ] Recent orders display
  - [ ] Recent users display
  - [ ] Low stock alerts display

- [ ] **Analytics**
  - [ ] Sales by date range
  - [ ] Top selling products
  - [ ] User growth metrics

---

### 11. User Management
- [ ] **View Users**
  - [ ] List all users (consumers, resellers)
  - [ ] Filter by user type
  - [ ] Search users by name/email

- [ ] **Create User**
  - [ ] Click "Create User" button
  - [ ] Fill in user details
  - [ ] Select user type
  - [ ] Submit and verify creation

- [ ] **Edit User**
  - [ ] Click edit on user
  - [ ] Update details
  - [ ] Change user type
  - [ ] Save changes

- [ ] **Deactivate/Activate User**
  - [ ] Toggle user status
  - [ ] Verify user cannot login when deactivated

- [ ] **Delete User**
  - [ ] Delete user (with confirmation)
  - [ ] Verify user removed from list

---

### 12. Product Management
- [ ] **View Products**
  - [ ] List all products with images
  - [ ] Filter by category, stock status
  - [ ] Search products

- [ ] **Create Product**
  - [ ] Add product name, description
  - [ ] Upload images
  - [ ] Set price, stock quantity
  - [ ] Select category
  - [ ] Add tags
  - [ ] Set discounted price (optional)
  - [ ] Publish product

- [ ] **Edit Product**
  - [ ] Update product details
  - [ ] Add/remove images
  - [ ] Update pricing
  - [ ] Update stock

- [ ] **Delete Product**
  - [ ] Delete product
  - [ ] Verify removed from store

- [ ] **Bulk Actions**
  - [ ] Select multiple products
  - [ ] Update stock in bulk
  - [ ] Delete multiple products

---

### 13. Order Management
- [ ] **View Orders**
  - [ ] List all orders
  - [ ] Filter by status (pending, processing, shipped, delivered)
  - [ ] Search by order ID or customer

- [ ] **View Order Details**
  - [ ] View full order information
  - [ ] View customer details
  - [ ] View items ordered
  - [ ] View payment info
  - [ ] View shipping address

- [ ] **Update Order Status**
  - [ ] Change from Pending → Processing
  - [ ] Change to Shipped (add tracking)
  - [ ] Mark as Delivered
  - [ ] Cancel order
  - [ ] **Verify customer receives notification**

- [ ] **Process Returns/Refunds**
  - [ ] Mark order as returned
  - [ ] Process refund

---

### 14. Promotion Management
- [ ] **View Promotions**
  - [ ] List all promotions (active, upcoming, expired)
  - [ ] Filter by status

- [ ] **Create Promotion**
  - [ ] Set promotion title, description
  - [ ] Upload promotional image
  - [ ] Set discount type (percentage, fixed amount, free shipping)
  - [ ] Set discount value
  - [ ] Set start and end dates
  - [ ] Set applicable products/categories (or "all")
  - [ ] Set user type restriction (consumer/reseller/all)
  - [ ] Mark as featured (for home screen display)
  - [ ] Publish promotion

- [ ] **Edit Promotion**
  - [ ] Update promotion details
  - [ ] Change dates
  - [ ] Update applicable products
  - [ ] Toggle featured status

- [ ] **Verify Promotion on Mobile**
  - [ ] **Active promotion**: Appears with "LIVE NOW" badge
  - [ ] **Upcoming promotion**: Shows countdown timer
  - [ ] **Products in promotion**: Show discounted prices
  - [ ] **Promotion applies correctly**: Discount calculated properly

- [ ] **Delete Promotion**
  - [ ] Delete promotion
  - [ ] Verify removed from mobile app

---

### 15. Staff Management
- [ ] **View Staff**
  - [ ] List all staff members
  - [ ] View roles and permissions

- [ ] **Create Staff**
  - [ ] Add staff member
  - [ ] Assign role (admin, manager, support)
  - [ ] Set permissions

- [ ] **Edit Staff**
  - [ ] Update staff details
  - [ ] Change role/permissions
  - [ ] Deactivate staff account

- [ ] **Delete Staff**
  - [ ] Remove staff member

---

### 16. Reports
- [ ] **Sales Report**
  - [ ] Generate sales report by date range
  - [ ] Export to CSV/Excel
  - [ ] View graphs/charts

- [ ] **Inventory Report**
  - [ ] Low stock report
  - [ ] Out of stock report
  - [ ] Stock movement report

- [ ] **User Report**
  - [ ] New users report
  - [ ] Active users report
  - [ ] User demographics

---

### 17. Reviews Management
- [ ] **View Reviews**
  - [ ] List all product reviews
  - [ ] Filter by rating, product

- [ ] **Moderate Reviews**
  - [ ] Approve pending reviews
  - [ ] Delete inappropriate reviews
  - [ ] Reply to reviews

---

## 🔄 INTEGRATION TESTING

### 18. End-to-End User Flows
- [ ] **Complete Purchase Flow**
  1. Register/Login on mobile
  2. Browse products
  3. Add to cart (product with active promotion)
  4. Verify promotional price applied
  5. Checkout
  6. Complete payment
  7. Verify order in mobile Order History
  8. **Check Admin Panel**: Order appears
  9. **Admin**: Update order status
  10. **Mobile**: Verify notification received
  11. **Mobile**: Track order status update

- [ ] **Promotion Lifecycle**
  1. **Admin**: Create upcoming promotion (start date in future)
  2. **Mobile**: Verify appears as "Coming Soon" with countdown
  3. **Wait or change system time** to promotion start
  4. **Mobile**: Verify changes to "LIVE NOW"
  5. **Mobile**: Verify products show discounted prices
  6. **Mobile**: Purchase promoted product
  7. **Verify**: Discount applied in order total

- [ ] **Notification Flow**
  1. **Admin**: Create order for user
  2. **Mobile**: Verify notification received
  3. **Mobile**: Tap notification → Navigate to order
  4. **Mobile**: Delete notification
  5. **Check Console Logs**: Verify deletion logs
  6. **Mobile**: Refresh → Verify doesn't reappear
  7. **Mobile**: Close and reopen app
  8. **Verify**: Notification still deleted

---

## 🐛 BUG CHECKS

### Known Issues to Verify Fixed:
- [ ] Notification deletion persists (doesn't come back)
- [ ] Promotion countdown displays correctly
- [ ] "22 DAYS TO GO" badge not cropped
- [ ] Discount badges are RED, not brown
- [ ] Active and upcoming promotions aligned properly
- [ ] Promotional prices apply to products correctly
- [ ] Navigation to PromotionDetails works from HomeScreen

---

## 📊 PERFORMANCE & UX

### 19. Performance Testing
- [ ] **Load Times**
  - [ ] Home screen loads in < 2 seconds
  - [ ] Product images load smoothly
  - [ ] Pagination/infinite scroll smooth

- [ ] **Offline Behavior**
  - [ ] Turn off internet
  - [ ] Verify error messages display
  - [ ] Verify cached data shows (if applicable)

- [ ] **Large Data Sets**
  - [ ] Test with 100+ products
  - [ ] Test with 50+ orders
  - [ ] Test with 100+ notifications

### 20. Accessibility
- [ ] **Screen Readers**
  - [ ] Test with VoiceOver (iOS)
  - [ ] Test with TalkBack (Android)

- [ ] **Text Scaling**
  - [ ] Increase font size in device settings
  - [ ] Verify UI doesn't break

---

## 📝 TESTING NOTES

### Console Logs to Monitor:
- **Promotions**:
  - `📅 Fetching promotions`
  - `📊 Active promotions: X`
  - `📊 Upcoming promotions: X`
  - `💰 Enriching products with promotions`
  - `✅ Applied promotion to [product]`

- **Notifications**:
  - `🗑️ Attempting to delete notification`
  - `✅ Session is valid`
  - `✅ Notification deleted from database`
  - `🎉 Notification deletion complete!`

### Database Checks (if you have access):
- [ ] Check `promotions` table:
  - [ ] `is_featured = true` for home screen promotions
  - [ ] `start_date` and `end_date` correct
  - [ ] `applicable_to` and `applicable_ids` set correctly

- [ ] Check `notifications` table after deletion:
  - [ ] Row should be DELETED (not just marked)
  - [ ] Query: `SELECT * FROM notifications WHERE id = '[deleted-id]'` should return 0 rows

---

## ✅ SIGN OFF

**Tester Name:** ___________________
**Date:** ___________________
**Environment:** Production / Staging / Development
**Device Tested:** ___________________
**OS Version:** ___________________

**Overall Status:**
- [ ] ✅ All tests passed
- [ ] ⚠️ Minor issues found (documented below)
- [ ] ❌ Critical issues found (documented below)

**Issues Found:**
1. _____________________________________
2. _____________________________________
3. _____________________________________

**Comments:**
_________________________________________________
_________________________________________________
