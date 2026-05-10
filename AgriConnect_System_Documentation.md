# AgriConnect — Full System Documentation

> **Version:** 1.0  
> **Stack:** NestJS + TypeORM + PostgreSQL (Backend) · Flutter (Mobile)  
> **Region:** Algeria — starting with Wilaya of Adrar

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Data Models (Entities)](#4-data-models-entities)
5. [API Modules & Endpoints](#5-api-modules--endpoints)
6. [Business Logic & Workflows](#6-business-logic--workflows)
7. [Order Status State Machine](#7-order-status-state-machine)
8. [Delivery & Distance Calculation](#8-delivery--distance-calculation)
9. [Mobile App — Screen Inventory](#9-mobile-app--screen-inventory)
10. [Mobile App — Navigation Structure](#10-mobile-app--navigation-structure)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Project Overview

AgriConnect is an agricultural marketplace platform for Algeria that directly connects **Farmers**, **Buyers**, and **Deliverers** — eliminating traditional intermediaries.

**Core value propositions:**
- Farmers post and manage their products directly.
- Buyers browse, filter, and purchase fresh produce from their wilaya.
- Deliverers self-assign delivery tasks and earn per-delivery fees.
- All parties track order progress in real time via a shared status machine.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Flutter Mobile App                  │
│  (Farmer App | Buyer App | Deliverer App — unified) │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS / REST JSON
┌───────────────────────▼─────────────────────────────┐
│              NestJS REST API Server                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │   Auth   │ │ Products │ │  Orders  │ │Delivery│ │
│  │  Module  │ │  Module  │ │  Module  │ │ Module │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Users   │ │  Wilaya/ │ │  Files/  │            │
│  │  Module  │ │ Communes │ │  Upload  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└───────────────────────┬─────────────────────────────┘
                        │ TypeORM
┌───────────────────────▼─────────────────────────────┐
│              PostgreSQL Database                     │
│  users · products · orders · order_items            │
│  deliveries · communes · wilayas · categories       │
└─────────────────────────────────────────────────────┘
```

---

## 3. User Roles & Permissions

| Role | Description |
|---|---|
| `FARMER` | Lists products, manages inventory, accepts/rejects orders |
| `BUYER` | Browses products, places orders, confirms pickup/delivery |
| `DELIVERER` | Self-assigns delivery tasks, confirms pickup and delivery |
| `ADMIN` | Full system access, user management, data oversight |

### Registration Fields by Role

**Buyer**
| Field | Type | Required |
|---|---|---|
| fullname | string | ✅ |
| phone_number | string | ✅ |
| address | string | ✅ |
| email | string | ✅ |
| password | string | ✅ |
| wilaya_id | FK → Wilaya | ✅ |

**Farmer**
| Field | Type | Required |
|---|---|---|
| fullname | string | ✅ |
| phone_number | string | ✅ |
| address | string | ✅ |
| email | string | ✅ |
| password | string | ✅ |
| farm_wilaya_id | FK → Wilaya | ✅ |
| farm_commune_id | FK → Commune | ✅ |
| farm_exact_address | string | ✅ |
| farm_land_area | float | ❌ (optional) |
| activity_type | enum | ✅ |

**ActivityType Enum:** `VEGETABLES_FRUITS` · `DATES` · `LIVESTOCK` · `POULTRY`

**Deliverer**
| Field | Type | Required |
|---|---|---|
| fullname | string | ✅ |
| phone_number | string | ✅ |
| wilaya_id | FK → Wilaya | ✅ |
| vehicle_type | enum | ✅ |
| matricule | string | ❌ (optional) |

**VehicleType Enum:** `FOURGON` · `FOURGON_REFRIGERE` · `HARBIN` · `CAMION` · `CAMION_REFRIGERE` · `HILUX`

---

## 4. Data Models (Entities)

### 4.1 Wilaya
```
wilaya
  id           INT PK
  name_latin   VARCHAR
  name_arabic  VARCHAR
  code         INT (01–58)
```

### 4.2 Commune
```
commune
  id           INT PK
  name_latin   VARCHAR
  name_arabic  VARCHAR
  lat          DECIMAL(9,6)
  lng          DECIMAL(9,6)
  wilaya_id    FK → wilaya
```

### 4.3 User (base, discriminated by role)
```
user
  id              UUID PK
  fullname        VARCHAR
  email           VARCHAR UNIQUE
  phone_number    VARCHAR
  password_hash   VARCHAR
  role            ENUM (FARMER, BUYER, DELIVERER, ADMIN)
  wilaya_id       FK → wilaya
  address         VARCHAR (nullable for deliverer)
  avatar_url      VARCHAR (nullable)
  rating          DECIMAL(3,2) DEFAULT 0
  rating_count    INT DEFAULT 0
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
```

### 4.4 FarmerProfile (1:1 with User where role=FARMER)
```
farmer_profile
  id                UUID PK
  user_id           FK → user
  commune_id        FK → commune
  exact_address     VARCHAR
  land_area         FLOAT (nullable)
  activity_type     ENUM
```

### 4.5 DelivererProfile (1:1 with User where role=DELIVERER)
```
deliverer_profile
  id              UUID PK
  user_id         FK → user
  vehicle_type    ENUM
  matricule       VARCHAR (nullable)
  is_available    BOOLEAN DEFAULT true
  current_order_id FK → order (nullable, the one active task)
```

### 4.6 Category
```
category
  id      INT PK
  name    VARCHAR
  icon    VARCHAR (nullable)
```

### 4.7 Product
```
product
  id            UUID PK
  farmer_id     FK → user (role=FARMER)
  title         VARCHAR
  description   TEXT
  price         DECIMAL(10,2)
  price_unit    VARCHAR  (e.g. "kg", "piece", "quintal")
  category_id   FK → category
  quantity      DECIMAL(10,2)
  commune_id    FK → commune  (derived from farmer's farm commune)
  wilaya_id     FK → wilaya   (derived from farmer's farm wilaya)
  is_available  BOOLEAN DEFAULT true
  rating        DECIMAL(3,2) DEFAULT 0
  rating_count  INT DEFAULT 0
  created_at    TIMESTAMP
  updated_at    TIMESTAMP
```

### 4.8 ProductImage
```
product_image
  id          UUID PK
  product_id  FK → product
  url         VARCHAR
  order       INT  (display order)
```

### 4.9 Order
```
order
  id                UUID PK
  buyer_id          FK → user (role=BUYER)
  farmer_id         FK → user (role=FARMER)
  deliverer_id      FK → user (nullable, role=DELIVERER)
  delivery_option   ENUM (WITH_DELIVERY, WITHOUT_DELIVERY)
  status            ENUM (see §7)
  rejection_reason  TEXT (nullable)
  delivery_price    DECIMAL(10,2) (nullable)
  total_price       DECIMAL(10,2)
  buyer_commune_id  FK → commune
  farmer_commune_id FK → commune
  distance_km       DECIMAL(6,2) (nullable)
  farmer_confirmed_pickup  BOOLEAN DEFAULT false
  buyer_confirmed_pickup   BOOLEAN DEFAULT false (for no-delivery pickup)
  deliverer_confirmed_pickup BOOLEAN DEFAULT false
  buyer_confirmed_delivery   BOOLEAN DEFAULT false
  deliverer_confirmed_delivery BOOLEAN DEFAULT false
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```

### 4.10 OrderItem
```
order_item
  id          UUID PK
  order_id    FK → order
  product_id  FK → product
  quantity    DECIMAL(10,2)
  unit_price  DECIMAL(10,2)  (price snapshot at order time)
  subtotal    DECIMAL(10,2)
```

### 4.11 Cart (ephemeral, per buyer session or persisted)
```
cart
  id          UUID PK
  buyer_id    FK → user UNIQUE
  created_at  TIMESTAMP
  updated_at  TIMESTAMP

cart_item
  id          UUID PK
  cart_id     FK → cart
  product_id  FK → product
  quantity    DECIMAL(10,2)
```

### 4.12 Review
```
review
  id           UUID PK
  reviewer_id  FK → user
  target_id    FK → user  (farmer being rated)
  order_id     FK → order
  rating       INT (1–5)
  comment      TEXT (nullable)
  created_at   TIMESTAMP
```

---

## 5. API Modules & Endpoints

### Authentication — `/auth`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/auth/register/buyer` | Public | Register as buyer |
| POST | `/auth/register/farmer` | Public | Register as farmer |
| POST | `/auth/register/deliverer` | Public | Register as deliverer |
| POST | `/auth/login` | Public | Login, returns JWT |
| POST | `/auth/refresh` | Auth | Refresh JWT |
| POST | `/auth/logout` | Auth | Invalidate token |

---

### Users — `/users`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/users/me` | Auth | Get own profile |
| PATCH | `/users/me` | Auth | Update own profile |
| PATCH | `/users/me/wilaya` | BUYER | Change browsing wilaya |
| GET | `/users/farmers/:id` | BUYER | View a farmer's public profile |
| GET | `/users/farmers` | BUYER | List farmers in buyer's wilaya |

---

### Products — `/products`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/products` | FARMER | Create a product |
| GET | `/products` | BUYER | Browse products (filtered) |
| GET | `/products/:id` | BUYER | Product detail |
| PATCH | `/products/:id` | FARMER (owner) | Update product |
| DELETE | `/products/:id` | FARMER (owner) | Delete product |
| GET | `/products/my` | FARMER | Farmer's own product list |
| POST | `/products/:id/images` | FARMER (owner) | Upload images |
| DELETE | `/products/:id/images/:imgId` | FARMER (owner) | Delete an image |

**Query Parameters for GET `/products` (Buyer):**
- `wilaya_id` — filter by wilaya (defaults to buyer's wilaya)
- `category_id` — filter by category
- `min_price`, `max_price` — price range
- `date_from`, `date_to` — posting date range
- `search` — keyword search on title/description
- `sort_by` — `price_asc`, `price_desc`, `date_desc`, `rating_desc`
- `page`, `limit` — pagination

**Query Parameters for GET `/products/my` (Farmer):**
- `category_id`, `min_price`, `max_price`, `date_from`, `date_to`, `search`, `sort_by`, `page`, `limit`

---

### Cart — `/cart`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/cart` | BUYER | View cart |
| POST | `/cart/items` | BUYER | Add item to cart |
| PATCH | `/cart/items/:productId` | BUYER | Update item quantity |
| DELETE | `/cart/items/:productId` | BUYER | Remove item from cart |
| DELETE | `/cart` | BUYER | Clear entire cart |

---

### Orders — `/orders`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/orders` | BUYER | Submit order from cart |
| GET | `/orders` | BUYER/FARMER | List own orders (filtered) |
| GET | `/orders/:id` | Auth (party) | Order detail / tracking |
| PATCH | `/orders/:id/accept` | FARMER | Accept a pending order |
| PATCH | `/orders/:id/reject` | FARMER | Reject order (with reason) |
| PATCH | `/orders/:id/confirm-pickup` | BUYER/FARMER/DELIVERER | Confirm pickup step |
| PATCH | `/orders/:id/confirm-delivery` | BUYER/DELIVERER | Confirm delivery step |

**Query Parameters for GET `/orders`:**
- `status` — filter by order status enum
- `date_from`, `date_to`
- `page`, `limit`

---

### Deliveries — `/deliveries`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/deliveries/available` | DELIVERER | List available tasks in deliverer's wilaya |
| GET | `/deliveries/:orderId` | DELIVERER | Full detail of a delivery task |
| POST | `/deliveries/:orderId/assign` | DELIVERER | Self-assign a delivery task |
| GET | `/deliveries/current` | DELIVERER | Get deliverer's active task |

---

### Communes & Wilayas — `/geo`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/geo/wilayas` | Public | List all wilayas |
| GET | `/geo/wilayas/:id/communes` | Public | List communes by wilaya |

---

### Categories — `/categories`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/categories` | Public | List all categories |
| POST | `/categories` | ADMIN | Create category |

---

### Admin — `/admin`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/admin/users` | ADMIN | List all users |
| PATCH | `/admin/users/:id/ban` | ADMIN | Ban a user |
| GET | `/admin/orders` | ADMIN | View all orders |
| GET | `/admin/stats` | ADMIN | Platform statistics |

---

## 6. Business Logic & Workflows

### 6.1 Product Visibility Rule

> A buyer can only see products whose `wilaya_id` matches the buyer's current `wilaya_id`.
> A buyer can change their wilaya in profile settings, which persists to the database.

---

### 6.2 Order Submission

1. Buyer has items in cart (all must be from the **same wilaya** and preferably the same farmer — enforce or group by farmer).
2. Buyer selects **delivery option**: `WITH_DELIVERY` or `WITHOUT_DELIVERY`.
3. System calculates `total_price` = sum of (unit_price × quantity) for all items.
4. If `WITH_DELIVERY`, system calculates `distance_km` using Haversine formula between buyer's commune and farmer's commune, then calculates `delivery_price` (pricing rule defined in §8).
5. Order is created with status `PENDING`.
6. Cart is cleared.

---

### 6.3 Farmer Response

- Farmer sees all `PENDING` orders on their dashboard.
- **Accept** → status transitions based on delivery option (see §7).
- **Reject** → status becomes `REJECTED`; farmer must provide a rejection reason (e.g., "Out of stock", "Quantity unavailable").

---

### 6.4 Pickup Without Delivery

```
AWAITING_BUYER_PICKUP
  → Buyer goes to farmer's address.
  → Buyer pays farmer in person.
  → Both buyer AND farmer tap "Confirm Pickup" in the app.
  → Both confirmations received → status = COMPLETED
```

Both `farmer_confirmed_pickup` and `buyer_confirmed_pickup` must be `true` to trigger completion.

---

### 6.5 Delivery Flow

```
AWAITING_DELIVERER_ASSIGN
  → Deliverer sees the task in available deliveries.
  → Deliverer taps "Assign" → status = AWAITING_DELIVERER_PICKUP
  → Deliverer's profile: is_available = false, current_order_id = this order

AWAITING_DELIVERER_PICKUP
  → Deliverer goes to farmer, pays farmer for the goods.
  → Deliverer taps "Confirm Pickup", Farmer taps "Confirm Pickup".
  → Both confirmed → status = IN_TRANSIT

IN_TRANSIT
  → Deliverer goes to buyer's address.
  → Buyer pays deliverer (covers product cost + delivery fee).
  → Deliverer taps "Confirm Delivery", Buyer taps "Confirm Delivery".
  → Both confirmed → status = COMPLETED
  → Deliverer's profile: is_available = true, current_order_id = null
```

---

### 6.6 Deliverer Constraint

> A deliverer can only have **one active task** at a time.
> If `is_available = false`, the assign endpoint returns a 409 Conflict error.

---

### 6.7 Rating & Reviews

- After an order reaches `COMPLETED`, the buyer can rate the farmer (1–5 stars + optional comment).
- Farmer's `rating` and `rating_count` are updated atomically.
- Products also display a rating (derived from farmer rating or future per-product reviews).

---

## 7. Order Status State Machine

```
                    ┌─────────┐
          Submit    │ PENDING │
          Order ──► └────┬────┘
                         │
              ┌──────────┴──────────┐
              │                     │
           Accept                Reject
              │                     │
              ▼                     ▼
  ┌─────────────────────┐     ┌──────────┐
  │  (delivery option?) │     │ REJECTED │
  └──────────┬──────────┘     └──────────┘
             │
    ┌─────────┴──────────────┐
    │                        │
WITHOUT_DELIVERY        WITH_DELIVERY
    │                        │
    ▼                        ▼
AWAITING_BUYER_PICKUP   AWAITING_DELIVERER_ASSIGN
    │                        │
Both confirm             Deliverer assigns
pickup                       │
    │                        ▼
    │               AWAITING_DELIVERER_PICKUP
    │                        │
    │               Both confirm pickup
    │                        │
    │                        ▼
    │                   IN_TRANSIT
    │                        │
    │               Both confirm delivery
    │                        │
    └──────────┬─────────────┘
               ▼
           COMPLETED
```

### Status Enum Values

| Value | Description |
|---|---|
| `PENDING` | Order submitted, awaiting farmer response |
| `REJECTED` | Farmer rejected the order |
| `AWAITING_BUYER_PICKUP` | Accepted, no delivery — buyer picks up |
| `AWAITING_DELIVERER_ASSIGN` | Accepted with delivery — needs deliverer |
| `AWAITING_DELIVERER_PICKUP` | Deliverer assigned, going to farmer |
| `IN_TRANSIT` | Deliverer picked up, going to buyer |
| `COMPLETED` | Order fully fulfilled |

---

## 8. Delivery & Distance Calculation

### 8.1 Distance Formula

Use the **Haversine formula** to calculate great-circle distance between two GPS coordinates (buyer's commune ↔ farmer's commune).

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c     (R = 6371 km)
```

### 8.2 Delivery Price Calculation

> Exact pricing formula to be defined by business. Placeholder logic:

| Distance | Price Formula |
|---|---|
| 0–10 km | Base fee: 200 DZD |
| 10–30 km | 200 + (distance − 10) × 20 DZD |
| 30+ km | 600 + (distance − 30) × 15 DZD |

This formula should be configurable in admin settings.

### 8.3 Commune Seed Data

The database must be seeded with all communes of Adrar wilaya including:
- `name_latin` (e.g., "Adrar")
- `name_arabic` (e.g., "أدرار")
- `lat` / `lng` (GPS coordinates)
- `wilaya_id` (FK to Adrar wilaya)

---

## 9. Mobile App — Screen Inventory

### 9.1 Shared / Auth Screens

| Screen | Description |
|---|---|
| Splash Screen | Logo + loading, auto-navigate by auth state & role |
| Onboarding | Role selection (Farmer / Buyer / Deliverer) |
| Login | Email + password, JWT storage |
| Register - Buyer | Buyer signup form |
| Register - Farmer | Farmer signup form (with farm details) |
| Register - Deliverer | Deliverer signup form |
| Forgot Password | Email-based reset flow |

---

### 9.2 Buyer Screens

| Screen | Description |
|---|---|
| Home / Product Feed | Product list with search bar, category filters, sort options |
| Product Detail | Images, title, price/unit, quantity, farmer card, Add to Cart |
| Farmer Profile | Farmer info, rating, product list |
| Cart | Item list, quantities, subtotals, total, delivery option toggle, Submit |
| Orders List | All orders with status badges, filter by status/date |
| Order Detail / Tracking | Status timeline, order items, action buttons (call, confirm) |
| Profile | Edit info, change wilaya, logout |

---

### 9.3 Farmer Screens

| Screen | Description |
|---|---|
| Dashboard | Summary: pending orders count, product count, recent activity |
| My Products | Filterable/searchable list of own products |
| Add / Edit Product | Form: title, price, unit, category, description, quantity, images |
| Pending Orders | List of PENDING orders, accept/reject actions |
| Order Detail | Items, buyer info, Accept / Reject (with reason) / Confirm Pickup |
| Profile | Edit info, farm details, logout |

---

### 9.4 Deliverer Screens

| Screen | Description |
|---|---|
| Home / Available Tasks | List of delivery tasks in deliverer's wilaya (distance, price, from/to) |
| Task Detail | Full order info + product + quantity + Assign button |
| Current Task | Active delivery: status, farmer/buyer contact, Confirm Pickup / Confirm Delivery |
| Profile | Edit info, vehicle type, logout |

---

## 10. Mobile App — Navigation Structure

```
App
├── AuthStack
│   ├── Splash
│   ├── Onboarding (role selection)
│   ├── Login
│   └── RegisterStack
│       ├── RegisterBuyer
│       ├── RegisterFarmer
│       └── RegisterDeliverer
│
├── BuyerStack (Bottom Tabs)
│   ├── Tab: Home → ProductFeed → ProductDetail → FarmerProfile
│   ├── Tab: Cart → CartPage → OrderConfirmation
│   ├── Tab: Orders → OrdersList → OrderDetail
│   └── Tab: Profile
│
├── FarmerStack (Bottom Tabs)
│   ├── Tab: Dashboard
│   ├── Tab: Products → ProductList → AddEditProduct
│   ├── Tab: Orders → PendingOrders → OrderDetail
│   └── Tab: Profile
│
└── DelivererStack (Bottom Tabs)
    ├── Tab: Available Tasks → TaskDetail
    ├── Tab: Current Task
    └── Tab: Profile
```

---

## 11. Non-Functional Requirements

### Security
- JWT-based authentication with access + refresh token pair.
- Passwords hashed with bcrypt (cost factor ≥ 12).
- Role-based guards on all protected routes (NestJS `@Roles()` decorator + `RolesGuard`).
- Input validation via `class-validator` DTOs on all endpoints.
- Rate limiting on auth endpoints to prevent brute force.

### File Storage
- Product images uploaded to object storage (local disk for dev, S3-compatible for prod).
- Images validated for type (JPEG/PNG/WEBP) and size (max 5MB each, max 5 per product).
- URLs stored in `product_image` table.

### Performance
- Database indexes on: `product.wilaya_id`, `product.category_id`, `product.farmer_id`, `order.status`, `order.buyer_id`, `order.farmer_id`.
- Pagination required on all list endpoints (default limit: 20).

### Error Handling
- Consistent error response shape: `{ statusCode, message, error }`.
- Global exception filter in NestJS.

### Localization (Mobile)
- Support Arabic (RTL) and French (LTR) in the Flutter app.
- Use `flutter_localizations` + `intl` package.
- API responses return both `name_latin` and `name_arabic` for communes/wilayas.

---

## 12. Implementation Roadmap

### Phase 1 — Backend Foundation
1. NestJS project setup (TypeORM, PostgreSQL, config module, validation pipes)
2. Database schema creation (all entities)
3. Seed data: Wilayas, Communes of Adrar (with coordinates), Categories
4. Auth module (register/login/refresh, JWT, roles guard)
5. Users module (profile CRUD)

### Phase 2 — Core Marketplace
6. Products module (CRUD, image upload, filtering/pagination)
7. Geo module (wilaya/commune lookup endpoints)
8. Cart module (add/update/remove items)

### Phase 3 — Order Flow
9. Orders module (submit, farmer accept/reject, status transitions)
10. Delivery module (available tasks, assign, confirm steps)
11. Distance/price calculation service (Haversine + pricing formula)

### Phase 4 — Flutter Mobile App
12. Project setup (state management: Riverpod or BLoC, routing: GoRouter)
13. Auth flow (splash, onboarding, login, register × 3 roles)
14. Buyer screens (product feed, detail, farmer profile, cart, orders, tracking)
15. Farmer screens (dashboard, product management, order management)
16. Deliverer screens (available tasks, task detail, current task)
17. Shared profile screens

### Phase 5 — Polish & Production
18. Push notifications (order status changes, new delivery tasks)
19. Rating & review system
20. Admin panel (web or in-app)
21. Multi-wilaya expansion (seed more communes)
22. End-to-end testing, performance tuning, deployment

---

*Document generated for use as AI agent prompt context. Each phase and module above can be used as an independent prompt to a coding agent (e.g., "Implement Phase 1, Step 3 using the entities defined in §4").*
