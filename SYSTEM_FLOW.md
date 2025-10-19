# Manzana Collection - System Flow Documentation

## 📊 Complete System Architecture & Flow Diagrams

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MANZANA COLLECTION SYSTEM                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
        ┌───────▼────────┐                    ┌────────▼────────┐
        │  MOBILE APP    │                    │   ADMIN WEB     │
        │  (React Native)│                    │   (React.js)    │
        └───────┬────────┘                    └────────┬────────┘
                │                                      │
                └──────────────┬───────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   SUPABASE BACKEND  │
                    ├─────────────────────┤
                    │ • PostgreSQL DB     │
                    │ • Authentication    │
                    │ • Storage (Images)  │
                    │ • Real-time Updates │
                    │ • Row Level Security│
                    └─────────────────────┘
```

---

## 👥 USER ROLES & ACCESS

```
┌──────────────────────────────────────────────────────────────┐
│                        USER TYPES                             │
└──────────────────────────────────────────────────────────────┘

        ┌─────────────┐          ┌─────────────┐
        │  CONSUMER   │          │  RESELLER   │
        └──────┬──────┘          └──────┬──────┘
               │                        │
               └────────┬───────────────┘
                        │
                ┌───────▼────────┐
                │  MOBILE APP    │
                │  (Shopping)    │
                └────────────────┘

        ┌─────────────┐          ┌─────────────┐
        │    ADMIN    │          │    STAFF    │
        └──────┬──────┘          └──────┬──────┘
               │                        │
               └────────┬───────────────┘
                        │
                ┌───────▼────────┐
                │   ADMIN WEB    │
                │  (Management)  │
                └────────────────┘

ACCESS LEVELS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Consumer    → Browse, Purchase, Wishlist, Alerts
Reseller    → Browse, Bulk Purchase, Special Pricing
Staff       → View Orders, Update Status
Admin       → Full Access (All CRUD Operations)
```

---

## 🔐 AUTHENTICATION FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                         │
└──────────────────────────────────────────────────────────────┘

                    START
                      │
                      ▼
        ┌─────────────────────────┐
        │   Open App/Website      │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐       ┌──────────────┐
        │  Has Valid Session?     │──NO──▶│ Login Screen │
        └────────────┬────────────┘       └──────┬───────┘
                     │YES                        │
                     │                            ▼
                     │              ┌────────────────────────┐
                     │              │ Enter Credentials      │
                     │              └──────────┬─────────────┘
                     │                         │
                     │                         ▼
                     │              ┌────────────────────────┐
                     │              │ Supabase.auth.signIn() │
                     │              └──────────┬─────────────┘
                     │                         │
                     │              ┌──────────▼──────────┐
                     │              │  Credentials Valid? │
                     │              └──────────┬──────────┘
                     │                    YES  │  NO
                     │                    │    └──▶ ERROR
                     │                    ▼
                     │              ┌──────────────────┐
                     │              │ Get User Profile │
                     │              │ (users table)    │
                     │              └────────┬─────────┘
                     │                       │
                     └───────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Check User Role      │
                    └────────┬───────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Consumer │  │ Reseller │  │  Admin   │
        │   App    │  │   App    │  │   Web    │
        └──────────┘  └──────────┘  └──────────┘


NEW USER REGISTRATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    START
                      │
                      ▼
        ┌─────────────────────────┐
        │  Click "Register"       │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ Fill Registration Form  │
        │ • Name                  │
        │ • Email                 │
        │ • Password              │
        │ • User Type (C/R)       │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ Supabase.auth.signUp()  │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ Create User Profile     │
        │ (INSERT into users)     │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ Email Verification      │
        │ (Optional)              │
        └────────────┬────────────┘
                     │
                     ▼
                  SUCCESS
```

---

## 🏠 HOME SCREEN FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                    HOME SCREEN DATA FLOW                      │
└──────────────────────────────────────────────────────────────┘

                    APP LAUNCH
                        │
                        ▼
        ┌───────────────────────────┐
        │  Load Authentication      │
        │  Check User Session       │
        └───────────┬───────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │  Fetch Home Data          │
        │  (Parallel Requests)      │
        └───────────┬───────────────┘
                    │
        ┌───────────┼───────────┬───────────┬──────────┐
        │           │           │           │          │
        ▼           ▼           ▼           ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │Promotio│ │Categori│ │Featured│ │  New   │ │  Cart  │
    │   ns   │ │   es   │ │Products│ │Products│ │ Count  │
    └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘
         │          │          │          │          │
         └──────────┴──────────┴──────────┴──────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  Enrich Products with   │
                │  Active Promotions      │
                └────────────┬────────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │  Calculate Promotional  │
                │  Prices                 │
                └────────────┬────────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │  Render Home Screen     │
                └─────────────────────────┘


PROMOTIONS RENDERING LOGIC:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        ┌─────────────────────────┐
        │  Fetch Promotions       │
        │  (Active + Upcoming)    │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │  Filter by:             │
        │  • is_active = true     │
        │  • Within 30 days       │
        │  • User type match      │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │  Check start_date       │
        └────────────┬────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
    ┌──────────┐         ┌──────────┐
    │ UPCOMING │         │  ACTIVE  │
    │ (Future) │         │ (Now)    │
    └─────┬────┘         └─────┬────┘
          │                    │
          ▼                    ▼
    ┌──────────────┐     ┌──────────────┐
    │ Countdown    │     │ Regular Card │
    │ Card         │     │              │
    │ • 22 DAYS    │     │ • LIVE NOW   │
    │ • Timer      │     │ • Red Badge  │
    │ • Red Badge  │     │              │
    └──────────────┘     └──────────────┘
```

---

## 🛍️ SHOPPING FLOW (BROWSE → PURCHASE)

```
┌──────────────────────────────────────────────────────────────┐
│                   COMPLETE SHOPPING FLOW                      │
└──────────────────────────────────────────────────────────────┘

    START
      │
      ▼
┌──────────────┐
│ Browse Home  │
│ or Search    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ View Product     │
│ Details          │
│ • Images         │
│ • Price          │◀──┐
│ • Description    │   │
│ • Stock Status   │   │
└──────┬───────────┘   │
       │               │
       ▼               │
┌──────────────────┐   │
│ Add to Cart      │   │
│ (Select Quantity)│   │
└──────┬───────────┘   │
       │               │
       ├───[Continue]──┘
       │   [Shopping]
       │
       ▼
┌──────────────────┐
│ View Cart        │
│ • Review Items   │
│ • Update Qty     │
│ • See Total      │
│ • Apply Promo    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Proceed to       │
│ Checkout         │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────┐
│ Shipping Information     │
│ • Select/Add Address     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Payment Method           │
│ • COD                    │
│ • Online Payment         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Review Order Summary     │
│ • Items                  │
│ • Subtotal              │
│ • Discount (Promo)      │
│ • Shipping              │
│ • TOTAL                 │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Place Order              │
│ (INSERT into orders)     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Order Confirmation       │
│ • Order Number          │
│ • Email Receipt         │
│ • Notification          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Track Order Status       │
│ (Order History)          │
└──────────────────────────┘


PROMOTIONAL PRICING APPLICATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────┐
│ Product Loaded   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ Fetch Active Promotions  │
│ (user type specific)     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Check if Product in      │
│ Promotion                │
└────────┬─────────────────┘
         │
    ┌────┴────┐
    │         │
    NO        YES
    │         │
    ▼         ▼
┌────────┐ ┌──────────────────┐
│Original│ │ Calculate        │
│Price   │ │ Discount:        │
└────────┘ │ • Percentage     │
           │ • Fixed Amount   │
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │ Apply Best       │
           │ Discount         │
           │ (if multiple)    │
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │ Update Product   │
           │ discounted_price │
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │ Display:         │
           │ • Strike Original│
           │ • Show Discount  │
           │ • Red Badge      │
           └──────────────────┘
```

---

## 🔔 NOTIFICATIONS FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                   NOTIFICATION SYSTEM FLOW                    │
└──────────────────────────────────────────────────────────────┘

NOTIFICATION CREATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    TRIGGER EVENT
    (Order, Promo, Stock)
          │
          ▼
    ┌──────────────────┐
    │ Create           │
    │ Notification     │
    │ (Backend)        │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ INSERT INTO notifications│
    │ • user_id               │
    │ • type                  │
    │ • title                 │
    │ • message               │
    │ • is_read = false       │
    │ • created_at            │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Real-time Update │
    │ via Supabase     │
    │ Subscription     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Push to Mobile   │
    │ App              │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Update Badge     │
    │ Count            │
    └──────────────────┘


NOTIFICATION READING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌──────────────────┐
    │ User Opens       │
    │ Notifications    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Fetch Notifications      │
    │ WHERE user_id = current  │
    │ ORDER BY created_at DESC │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Display List     │
    │ • Unread (bold)  │
    │ • Read (gray)    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ User Taps        │
    │ Notification     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Mark as Read             │
    │ UPDATE notifications     │
    │ SET is_read = true       │
    │ WHERE id = notif_id      │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Navigate to      │
    │ Related Screen   │
    │ (Order/Product)  │
    └──────────────────┘


NOTIFICATION DELETION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌──────────────────┐
    │ User Swipes/     │
    │ Clicks Delete    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Confirm Dialog   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Check Session Valid      │
    │ (supabase.auth)          │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ DELETE FROM notifications│
    │ WHERE id = notif_id      │
    │ AND user_id = current    │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Verify Deletion          │
    │ (Check rows affected)    │
    └────────┬─────────────────┘
             │
        ┌────┴────┐
        │         │
      SUCCESS   FAIL
        │         │
        ▼         ▼
    ┌────────┐ ┌──────┐
    │Remove  │ │Show  │
    │from UI │ │Error │
    │Update  │ └──────┘
    │Badge   │
    └────────┘

    CRITICAL: Row must be DELETED from DB,
    not just marked. RLS policy must allow
    DELETE where user_id matches.
```

---

## 🎁 PROMOTION MANAGEMENT FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                 PROMOTION LIFECYCLE FLOW                      │
└──────────────────────────────────────────────────────────────┘

ADMIN CREATES PROMOTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌──────────────────┐
    │ Admin Dashboard  │
    │ → Promotions     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Click "Create Promotion" │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Fill Promotion Form:     │
    │ • Title                  │
    │ • Description            │
    │ • Image Upload           │
    │ • Discount Type          │
    │ • Discount Value         │
    │ • Start Date             │
    │ • End Date               │
    │ • Applicable To:         │
    │   - All Products         │
    │   - Specific Products    │
    │   - Category             │
    │ • User Type Restriction  │
    │ • is_featured ☑          │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Validate Form            │
    │ • Dates valid?           │
    │ • Discount > 0?          │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ INSERT INTO promotions   │
    │ (All fields)             │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Upload Image to Storage  │
    │ Update image_url         │
    └────────┬─────────────────┘
             │
             ▼
         SUCCESS


MOBILE APP DISPLAYS PROMOTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌──────────────────┐
    │ App Loads Home   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Fetch Featured Promotions│
    │ WHERE:                   │
    │ • is_active = true       │
    │ • is_featured = true     │
    │ • start_date <= now+30d  │
    │ • user_type matches      │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Check Promotion Status   │
    └────────┬─────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌──────────┐  ┌──────────┐
│start_date│  │start_date│
│ > now    │  │ <= now   │
│ (FUTURE) │  │ (ACTIVE) │
└─────┬────┘  └─────┬────┘
      │             │
      ▼             ▼
┌──────────────┐ ┌──────────────┐
│ COUNTDOWN    │ │ LIVE CARD    │
│ CARD         │ │              │
│              │ │              │
│ ┌─────────┐  │ │ ┌─────────┐  │
│ │22 DAYS  │  │ │ │●LIVE NOW│  │
│ │TO GO    │  │ │ └─────────┘  │
│ └─────────┘  │ │              │
│              │ │ Oct Sale     │
│ 11-11 Sale   │ │              │
│              │ │ ┌─────────┐  │
│ ┌─────────┐  │ │ │20% OFF  │  │
│ │50% OFF  │  │ │ └─────────┘  │
│ └─────────┘  │ │              │
│              │ │ [View Promo] │
│ [22][03][42] │ │              │
│  D   H   M   │ │              │
│              │ │              │
│ [View Details│ │              │
└──────────────┘ └──────────────┘


APPLYING PROMOTION TO PRODUCTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌──────────────────┐
    │ Fetch Products   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Fetch Active Promotions  │
    │ (start_date <= now <=    │
    │  end_date)               │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ For Each Product:        │
    │ Check if in Promotion    │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Match Logic:             │
    │ • applicable_to = "all"? │
    │ • OR product_id in       │
    │   applicable_ids?        │
    │ • OR category_id in      │
    │   applicable_ids?        │
    └────────┬─────────────────┘
             │
        ┌────┴────┐
        │         │
       NO        YES
        │         │
        ▼         ▼
    ┌────────┐ ┌──────────────────┐
    │Keep    │ │Calculate Discount│
    │Original│ │Based on Type:    │
    │Price   │ │ • percentage:    │
    └────────┘ │   price * (x/100)│
               │ • fixed_amount:  │
               │   price - x      │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │ Set discounted_  │
               │ price on Product │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │ Display in UI:   │
               │ ₱500 ₱400        │
               │ [-20% Badge]     │
               └──────────────────┘
```

---

## 📦 ORDER MANAGEMENT FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                   ORDER LIFECYCLE FLOW                        │
└──────────────────────────────────────────────────────────────┘

ORDER CREATION (Mobile):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌──────────────────┐
    │ User Places      │
    │ Order            │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ CREATE ORDER:            │
    │ INSERT INTO orders       │
    │ • user_id                │
    │ • total_amount           │
    │ • status = 'pending'     │
    │ • shipping_address       │
    │ • payment_method         │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ CREATE ORDER ITEMS:      │
    │ INSERT INTO order_items  │
    │ For each cart item:      │
    │ • order_id               │
    │ • product_id             │
    │ • quantity               │
    │ • price_at_time          │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Update Product Stock:    │
    │ UPDATE products          │
    │ SET stock -= quantity    │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Clear User Cart:         │
    │ DELETE FROM cart_items   │
    │ WHERE user_id = current  │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Send Notifications:      │
    │ • To User (Order Confirm)│
    │ • To Admin (New Order)   │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Return Order ID  │
    │ Show Confirmation│
    └──────────────────┘


ORDER STATUS UPDATES (Admin):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌──────────────────┐
    │ Admin Views      │
    │ Order List       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Select Order     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ View Order Details       │
    │ • Customer Info          │
    │ • Items Ordered          │
    │ • Payment Status         │
    │ • Current Status         │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Update Status    │
    └────────┬─────────┘
             │
      ORDER STATUS FLOW:

      pending
         │
         ▼
      processing ──┐
         │         │
         ▼         │
      shipped      │
         │         │
         ▼         │
      delivered    │
                   │
                   ▼
                cancelled


    Each Status Change:
    ┌──────────────────────────┐
    │ UPDATE orders            │
    │ SET status = new_status  │
    │ WHERE id = order_id      │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Create Notification      │
    │ To Customer:             │
    │ "Order Status Updated"   │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Send Email (Optional)    │
    └──────────────────────────┘


ORDER TRACKING (Mobile):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌──────────────────┐
    │ User Opens       │
    │ Order History    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Fetch User Orders:       │
    │ SELECT * FROM orders     │
    │ WHERE user_id = current  │
    │ ORDER BY created_at DESC │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Display List     │
    │ • Order #        │
    │ • Date           │
    │ • Total          │
    │ • Status Badge   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Tap to View      │
    │ Order Details    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Show Order Timeline:     │
    │ ✓ Pending                │
    │ ✓ Processing             │
    │ ● Shipped ← Current      │
    │ ○ Delivered              │
    └──────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA & RELATIONSHIPS

```
┌──────────────────────────────────────────────────────────────┐
│                  DATABASE RELATIONSHIPS                       │
└──────────────────────────────────────────────────────────────┘

┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │─────┐
│ email       │     │
│ name        │     │
│ user_type   │     │
│ created_at  │     │
└─────────────┘     │
                    │
        ┌───────────┼────────────┬────────────┬─────────────┐
        │           │            │            │             │
        ▼           ▼            ▼            ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   orders    │ │   wishlist  │ │    cart     │ │notifications│
│─────────────│ │─────────────│ │─────────────│ │─────────────│
│ id (PK)     │ │ id (PK)     │ │ id (PK)     │ │ id (PK)     │
│ user_id (FK)│ │ user_id (FK)│ │ user_id (FK)│ │ user_id (FK)│
│ total_amount│ │ product_id  │ │             │ │ type        │
│ status      │ │ created_at  │ │             │ │ title       │
│ created_at  │ └─────────────┘ │             │ │ message     │
└──────┬──────┘                 │             │ │ is_read     │
       │                        │             │ └─────────────┘
       │                        │             │
       ▼                        ▼             │
┌─────────────┐         ┌─────────────┐      │
│ order_items │         │ cart_items  │      │
│─────────────│         │─────────────│      │
│ id (PK)     │         │ id (PK)     │      │
│ order_id(FK)│         │ cart_id (FK)│      │
│ product_id  │─┐       │ product_id  │─┐    │
│ quantity    │ │       │ quantity    │ │    │
│ price       │ │       └─────────────┘ │    │
└─────────────┘ │                       │    │
                │                       │    │
                └───────────────────────┼────┘
                                        │
                                        ▼
                                ┌─────────────┐
                                │  products   │
                                │─────────────│
                                │ id (PK)     │
                                │ name        │
                                │ price       │◀───────┐
                                │ disc_price  │        │
                                │ stock_qty   │        │
                                │ category_id │─┐      │
                                │ created_at  │ │      │
                                └─────────────┘ │      │
                                        ▲       │      │
                                        │       │      │
                    ┌───────────────────┘       │      │
                    │                           │      │
            ┌───────┴────────┐                  ▼      │
            │                │          ┌─────────────┐│
            ▼                ▼          │ categories  ││
    ┌─────────────┐  ┌─────────────┐   │─────────────││
    │   images    │  │    tags     │   │ id (PK)     ││
    │─────────────│  │─────────────│   │ name        ││
    │ id (PK)     │  │ product_id  │   │ icon        ││
    │ product_id  │  │ tag_name    │   │ created_at  ││
    │ url         │  └─────────────┘   └─────────────┘│
    │ is_primary  │                                    │
    └─────────────┘                                    │
                                                       │
                                ┌──────────────────────┘
                                │
                                ▼
                        ┌─────────────┐
                        │ promotions  │
                        │─────────────│
                        │ id (PK)     │
                        │ title       │
                        │ description │
                        │ discount_val│
                        │ promo_type  │
                        │ applicable  │
                        │ start_date  │
                        │ end_date    │
                        │ is_active   │
                        │ is_featured │
                        └─────────────┘


ROW LEVEL SECURITY (RLS) POLICIES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

users:
  SELECT: user can view own profile
  UPDATE: user can update own profile

orders:
  SELECT: user can view own orders, admin can view all
  INSERT: authenticated users can create
  UPDATE: only admin can update

cart_items:
  ALL: user can manage own cart

wishlist:
  ALL: user can manage own wishlist

notifications:
  SELECT: user can view own notifications
  DELETE: user can delete own notifications ← CRITICAL

products:
  SELECT: public
  INSERT/UPDATE/DELETE: admin only

promotions:
  SELECT: public (filtered by user_type)
  INSERT/UPDATE/DELETE: admin only
```

---

## 🔄 REAL-TIME UPDATES

```
┌──────────────────────────────────────────────────────────────┐
│              REAL-TIME SUBSCRIPTIONS FLOW                     │
└──────────────────────────────────────────────────────────────┘

    MOBILE APP SUBSCRIBES:

    ┌──────────────────┐
    │ App Initialized  │
    └────────┬─────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ Setup Subscriptions:        │
    │                             │
    │ 1. Notifications Channel    │
    │    supabase.channel()       │
    │    .on('INSERT')            │
    │    .on('UPDATE')            │
    │    .on('DELETE')            │
    │                             │
    │ 2. Cart Updates             │
    │    supabase.channel()       │
    │    .on('cart_items')        │
    │                             │
    │ 3. Order Status             │
    │    supabase.channel()       │
    │    .on('orders')            │
    └────────┬────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Listen for       │
    │ Changes          │
    └────────┬─────────┘
             │
             │
    DATABASE EVENT OCCURS:
             │
             ▼
    ┌──────────────────────────┐
    │ Supabase Realtime        │
    │ Broadcasts Change        │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ App Receives Update      │
    │ • New Notification       │
    │ • Order Status Change    │
    │ • Cart Modified          │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Update Local State       │
    │ Re-render Components     │
    └──────────────────────────┘


    EXAMPLE - NEW ORDER NOTIFICATION:

    Admin → Updates Order Status
           │
           ▼
    INSERT notification (user_id, type='order', ...)
           │
           ▼
    Supabase Realtime Broadcast
           │
           ▼
    Mobile App Receives Event
           │
           ▼
    ┌──────────────────────────┐
    │ useNotifications hook    │
    │ receives new notification│
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Update notifications     │
    │ array in state           │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Update badge count       │
    │ Show notification        │
    └──────────────────────────┘
```

---

## 📊 ADMIN DASHBOARD DATA FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                 ADMIN DASHBOARD OVERVIEW                      │
└──────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │ Admin Logs In    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Fetch Dashboard Stats    │
    │ (Parallel Queries)       │
    └────────┬─────────────────┘
             │
    ┌────────┼────────┬────────┬────────┬────────┐
    │        │        │        │        │        │
    ▼        ▼        ▼        ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│ Total  ││ Total  ││ Total  ││ Total  ││Revenue ││ Low    │
│ Sales  ││ Orders ││ Users  ││Products││ Chart  ││ Stock  │
└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘
    │        │        │        │        │        │
    └────────┴────────┴────────┴────────┴────────┘
                      │
                      ▼
            ┌──────────────────┐
            │ Render Dashboard │
            └──────────────────┘


ADMIN OPERATIONS FLOW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────┐
│ Admin Selects Action │
└──────────┬───────────┘
           │
    ┌──────┼──────┬──────────┬──────────┬──────────┐
    │      │      │          │          │          │
    ▼      ▼      ▼          ▼          ▼          ▼
┌────────┐ │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Users  │ │  │Products│ │ Orders │ │ Promos │ │Reports │
└───┬────┘ │  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │      │      │          │          │          │
    │      │      │          │          │          │
    ▼      ▼      ▼          ▼          ▼          ▼
┌───────────────────────────────────────────────────────┐
│              CRUD OPERATIONS                          │
│                                                       │
│  CREATE → Form → Validate → INSERT → Refresh         │
│  READ   → Fetch → Filter → Display                   │
│  UPDATE → Edit Form → Validate → UPDATE → Refresh    │
│  DELETE → Confirm → DELETE → Refresh                 │
└───────────────────────────────────────────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │ Update UI        │
            │ Show Success/Err │
            └──────────────────┘
```

---

## 🔍 SEARCH & FILTER FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                    SEARCH FUNCTIONALITY                       │
└──────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │ User Types in    │
    │ Search Bar       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Debounce Input   │
    │ (300ms delay)    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Build Search Query:      │
    │ SELECT * FROM products   │
    │ WHERE                    │
    │   name ILIKE '%query%'   │
    │   OR description         │
    │   ILIKE '%query%'        │
    │   OR tags @> 'query'     │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Apply Filters:           │
    │ • Category               │
    │ • Price Range            │
    │ • In Stock Only          │
    │ • On Sale                │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Apply Sorting:   │
    │ • Price (L→H)    │
    │ • Price (H→L)    │
    │ • Newest First   │
    │ • Popular        │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Return Results   │
    │ (Paginated)      │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Display Products │
    │ or Empty State   │
    └──────────────────┘
```

---

## 🎯 KEY SYSTEM FLOWS SUMMARY

### 1. **User Journey**
```
Register → Login → Browse → Add to Cart → Checkout → Track Order
```

### 2. **Product Lifecycle**
```
Admin Creates → Published → Appears in App → User Purchases → Stock Updated
```

### 3. **Promotion Lifecycle**
```
Admin Creates → Upcoming (Countdown) → Active (Live) → Products Discounted → Expired
```

### 4. **Order Lifecycle**
```
Placed → Pending → Processing → Shipped → Delivered
```

### 5. **Notification Lifecycle**
```
Created → Delivered → Read → Deleted (Permanently)
```

---

## 🔒 SECURITY LAYERS

```
┌──────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                      │
└──────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────┐
    │     CLIENT (Mobile/Web)               │
    │  • Input Validation                   │
    │  • Form Sanitization                  │
    └─────────────┬─────────────────────────┘
                  │
                  ▼
    ┌───────────────────────────────────────┐
    │     SUPABASE AUTH                     │
    │  • JWT Tokens                         │
    │  • Session Management                 │
    │  • Email Verification                 │
    └─────────────┬─────────────────────────┘
                  │
                  ▼
    ┌───────────────────────────────────────┐
    │     ROW LEVEL SECURITY (RLS)          │
    │  • User can only see own data         │
    │  • Admin has elevated permissions     │
    │  • Automatic filtering by user_id     │
    └─────────────┬─────────────────────────┘
                  │
                  ▼
    ┌───────────────────────────────────────┐
    │     DATABASE CONSTRAINTS              │
    │  • Foreign Keys                       │
    │  • NOT NULL constraints               │
    │  • Unique constraints                 │
    │  • Check constraints                  │
    └───────────────────────────────────────┘
```

---

**END OF SYSTEM FLOW DOCUMENTATION**
