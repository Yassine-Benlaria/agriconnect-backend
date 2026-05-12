# AgriConnect API Reference

> **Base URL:** `http://localhost:3000/api`  
> **Authentication:** All protected routes require `Authorization: Bearer <access_token>` unless noted otherwise.  
> **Global prefix:** `/api` (configured in `main.ts`).

---

## Table of Contents

1. [Auth](#1-auth)
2. [Geo](#2-geo)
3. [Products](#3-products)
4. [Cart](#4-cart)
5. [Orders](#5-orders)
6. [Deliveries](#6-deliveries)
7. [Reviews](#7-reviews)
8. [Admin](#8-admin)
9. [Enum Reference](#9-enum-reference)

---

## 2. Geo

> **Authentication:** None — these endpoints are intentionally public so clients can populate wilaya/commune dropdowns during registration before a token exists.

### 2.1 List All Wilayas
```
GET /geo/wilayas
Authorization: None
```
**Response `200`**
```json
[
  { "id": 1, "code": 1, "nameLatin": "Adrar",   "nameArabic": "أدرار" },
  { "id": 2, "code": 2, "nameLatin": "Chlef",   "nameArabic": "الشلف" }
]
```
> Sorted by official wilaya code (01 → 58).

---

### 2.2 List Communes by Wilaya
```
GET /geo/wilayas/:wilayaId/communes
Authorization: None
```
**Path param:** `wilayaId` — integer (wilaya primary key).

**Response `200`**
```json
[
  { "id": 3, "nameLatin": "Adrar",    "nameArabic": "أدرار",    "lat": 27.874, "lng": 0.293,  "wilayaId": 1 },
  { "id": 7, "nameLatin": "Reggane", "nameArabic": "رقان",     "lat": 26.710, "lng": 0.165,  "wilayaId": 1 }
]
```
> Sorted alphabetically by `nameLatin`. Returns `404` if `wilayaId` does not exist.

---

## 3. Auth


### 1.1 Register — Buyer
```
POST /auth/register/buyer
Authorization: None
```
**Request Body**
```json
{
  "fullname":    "Ahmed Benali",
  "phoneNumber": "0555123456",
  "address":     "12 Rue des Palmes, Adrar",
  "email":       "ahmed@example.com",
  "password":    "securePass1",
  "wilayaId":    1
}
```
**Response `201`**
```json
{
  "accessToken":  "<jwt>",
  "refreshToken": "<jwt>"
}
```

---

### 1.2 Register — Farmer
```
POST /auth/register/farmer
Authorization: None
```
**Request Body**
```json
{
  "fullname":         "Youcef Hamidi",
  "phoneNumber":      "0661234567",
  "address":          "Ferme El Baraka",
  "email":            "youcef@farm.dz",
  "password":         "securePass1",
  "farmWilayaId":     1,
  "farmCommuneId":    3,
  "farmExactAddress": "Route de Reggane, Adrar",
  "farmLandArea":     12.5,
  "activityType":     "VEGETABLES_FRUITS"
}
```
> `farmLandArea` is optional. `activityType` must be a valid `ActivityType` enum value.

**Response `201`** — same shape as 1.1.

---

### 1.3 Register — Deliverer
```
POST /auth/register/deliverer
Authorization: None
```
**Request Body**
```json
{
  "fullname":    "Karim Ould",
  "phoneNumber": "0771234567",
  "email":       "karim@deliver.dz",
  "password":    "securePass1",
  "wilayaId":    1,
  "vehicleType": "FOURGON",
  "matricule":   "01-123-01"
}
```
> `matricule` is optional.

**Response `201`** — same shape as 1.1.

---

### 1.4 Login
```
POST /auth/login
Authorization: None
```
**Request Body**
```json
{
  "email":    "ahmed@example.com",
  "password": "securePass1"
}
```
**Response `200`**
```json
{
  "accessToken":  "<jwt>",
  "refreshToken": "<jwt>"
}
```

---

### 1.5 Refresh Tokens
```
POST /auth/refresh
Authorization: Bearer <refresh_token>
```
**Request Body:** None  
**Response `200`** — new access + refresh token pair (token rotation).

---

### 1.6 Logout
```
POST /auth/logout
Authorization: Bearer <access_token>
```
**Request Body:** None  
**Response `204`** No Content. Invalidates the stored refresh token hash.

---

## 2. Products

### 2.1 Create Product *(FARMER)*
```
POST /products
Authorization: Bearer <farmer_token>
```
**Request Body**
```json
{
  "title":       "Fresh Medjool Dates",
  "description": "Hand-picked, 1st grade",
  "price":       1500.00,
  "priceUnit":   "kg",
  "categoryId":  2,
  "quantity":    200
}
```
**Response `201`** — full `Product` object with empty `images` array.

---

### 2.2 List My Products *(FARMER)*
```
GET /products/my?page=1&limit=20&search=dates&categoryId=2&sortBy=price_asc
Authorization: Bearer <farmer_token>
```
**Query Parameters** (all optional)

| Param | Type | Description |
|---|---|---|
| `wilayaId` | number | Filter by wilaya |
| `categoryId` | number | Filter by category |
| `minPrice` | number | Min price filter |
| `maxPrice` | number | Max price filter |
| `dateFrom` | ISO date string | Created after |
| `dateTo` | ISO date string | Created before |
| `search` | string | Full-text search on title/description |
| `sortBy` | `ProductSortBy` | Sort order |
| `page` | number ≥ 1 | Page number (default 1) |
| `limit` | 1–100 | Items per page (default 20) |

**Response `200`**
```json
{
  "data": [ /* Product[] */ ],
  "total": 45,
  "page":  1,
  "limit": 20,
  "totalPages": 3
}
```

---

### 2.3 Update Product *(FARMER — own products only)*
```
PATCH /products/:id
Authorization: Bearer <farmer_token>
```
**Request Body** (all fields optional)
```json
{
  "title":       "Premium Dates",
  "description": "Updated description",
  "price":       1600.00,
  "priceUnit":   "kg",
  "categoryId":  2,
  "quantity":    150,
  "isAvailable": true
}
```
**Response `200`** — updated `Product` object.

---

### 2.4 Delete Product *(FARMER — own products only)*
```
DELETE /products/:id
Authorization: Bearer <farmer_token>
```
**Response `204`** No Content.

---

### 2.5 Upload Product Images *(FARMER)*
```
POST /products/:id/images
Authorization: Bearer <farmer_token>
Content-Type: multipart/form-data
```
**Form field:** `images` (multi-file, up to 5)  
**Constraints:** JPEG / PNG / WEBP, max 5 MB per file.

**Response `201`** — array of `ProductImage` objects:
```json
[
  {
    "id":           "uuid",
    "url":          "/uploads/products/abc123.jpg",
    "displayOrder": 0
  }
]
```

---

### 2.6 Delete Product Image *(FARMER)*
```
DELETE /products/:id/images/:imgId
Authorization: Bearer <farmer_token>
```
**Response `204`** No Content.

---

### 2.7 Browse Products *(BUYER)*
```
GET /products?categoryId=2&minPrice=500&search=dates&sortBy=price_asc&page=1&limit=20
Authorization: Bearer <buyer_token>
```
> Results are automatically scoped to the buyer's registered wilaya. Same query params as 2.2.

**Response `200`** — same paginated shape as 2.2. Each item includes farmer public info (`fullname`, `rating`, `ratingCount`, `avatarUrl`).

---

### 2.8 Get Product Detail *(BUYER)*
```
GET /products/:id
Authorization: Bearer <buyer_token>
```
> Returns `404` if the product is marked `isAvailable = false`.

**Response `200`** — full `Product` object with `images[]` and farmer info.

---

## 3. Cart

> All cart endpoints are **BUYER only**. The cart is auto-created on first access.

### 3.1 Get Cart
```
GET /cart
Authorization: Bearer <buyer_token>
```
**Response `200`**
```json
{
  "id": "uuid",
  "buyerId": "uuid",
  "items": [
    {
      "id":        "uuid",
      "productId": "uuid",
      "quantity":  2.5,
      "product":   { /* Product snapshot */ }
    }
  ]
}
```

---

### 3.2 Add Item
```
POST /cart/items
Authorization: Bearer <buyer_token>
```
**Request Body**
```json
{
  "productId": "uuid",
  "quantity":  1.5
}
```
> If the product is already in the cart, quantity is **added** to the existing value.

**Response `200`** — updated full `Cart` object.

---

### 3.3 Update Item Quantity
```
PATCH /cart/items/:productId
Authorization: Bearer <buyer_token>
```
**Request Body**
```json
{ "quantity": 3.0 }
```
> Replaces the existing quantity. Use DELETE to remove an item entirely.

**Response `200`** — updated `Cart`.

---

### 3.4 Remove Item
```
DELETE /cart/items/:productId
Authorization: Bearer <buyer_token>
```
**Response `200`** — updated `Cart` (item removed).

---

### 3.5 Clear Cart
```
DELETE /cart
Authorization: Bearer <buyer_token>
```
**Response `200`** — empty `Cart` (entity preserved, all items deleted).

---

## 4. Orders

### 4.1 Create Order *(BUYER)*
```
POST /orders
Authorization: Bearer <buyer_token>
```
**Request Body**
```json
{
  "deliveryOption": "WITH_DELIVERY",
  "buyerCommuneId": 12
}
```
> `buyerCommuneId` must belong to the buyer's registered wilaya. The cart must be non-empty and all items from a single farmer.

**Response `201`** — full `Order` object:
```json
{
  "id":           "uuid",
  "status":       "PENDING",
  "deliveryOption": "WITH_DELIVERY",
  "totalPrice":   4500.00,
  "deliveryPrice": 400.00,
  "distanceKm":   18.3,
  "buyerId":      "uuid",
  "farmerId":     "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity":  3,
      "unitPrice": 1500.00,
      "subtotal":  4500.00
    }
  ],
  "farmerConfirmedPickup":     false,
  "buyerConfirmedPickup":      false,
  "delivererConfirmedPickup":  false,
  "buyerConfirmedDelivery":    false,
  "delivererConfirmedDelivery":false,
  "createdAt": "2026-05-11T10:00:00.000Z"
}
```

---

### 4.2 List Orders *(BUYER or FARMER)*
```
GET /orders
Authorization: Bearer <token>
```
> BUYER sees their own orders. FARMER sees orders directed to them. Role is inferred from the JWT.

**Response `200`** — `Order[]` sorted newest-first.

---

### 4.3 Get Order Detail *(BUYER or FARMER)*
```
GET /orders/:id
Authorization: Bearer <token>
```
**Response `200`** — full `Order` with items, product images, and commune info.

---

### 4.4 Accept Order *(FARMER)*
```
PATCH /orders/:id/accept
Authorization: Bearer <farmer_token>
```
**Request Body:** None  
**State transition:**
- `PENDING + WITHOUT_DELIVERY` → `AWAITING_BUYER_PICKUP`
- `PENDING + WITH_DELIVERY` → `AWAITING_DELIVERER_ASSIGN`

**Response `200`** — updated `Order`. `409` if not `PENDING`. `403` if not the assigned farmer.

---

### 4.5 Reject Order *(FARMER)*
```
PATCH /orders/:id/reject
Authorization: Bearer <farmer_token>
```
**Request Body**
```json
{ "rejectionReason": "Out of stock until next harvest" }
```
> `rejectionReason` is required (max 500 chars).

**State transition:** `PENDING` → `REJECTED`

**Response `200`** — updated `Order` with `rejectionReason` stored.

---

### 4.6 Farmer Confirm Pickup *(FARMER)*
```
PATCH /orders/:id/confirm-pickup
Authorization: Bearer <farmer_token>
```
**Request Body:** None  
**Logic:**
- Status `AWAITING_BUYER_PICKUP`: sets `farmerConfirmedPickup = true`. If `buyerConfirmedPickup` also true → `COMPLETED`.
- Status `AWAITING_DELIVERER_PICKUP`: sets `farmerConfirmedPickup = true`. If `delivererConfirmedPickup` also true → `IN_TRANSIT`.

**Response `200`** — updated `Order`.

---

### 4.7 Buyer Confirm Pickup *(BUYER — WITHOUT_DELIVERY only)*
```
PATCH /orders/:id/buyer-confirm-pickup
Authorization: Bearer <buyer_token>
```
**Request Body:** None  
**Logic:** Sets `buyerConfirmedPickup = true`. If `farmerConfirmedPickup` also true → `COMPLETED`.  
**Valid status:** `AWAITING_BUYER_PICKUP`

**Response `200`** — updated `Order`.

---

### 4.8 Buyer Confirm Delivery *(BUYER — WITH_DELIVERY only)*
```
PATCH /orders/:id/confirm-delivery
Authorization: Bearer <buyer_token>
```
**Request Body:** None  
**Logic:** Sets `buyerConfirmedDelivery = true`. If `delivererConfirmedDelivery` also true → `COMPLETED` + deliverer released.  
**Valid status:** `IN_TRANSIT`

**Response `200`** — updated `Order`.

---

## 5. Deliveries

> All endpoints are **DELIVERER only**.

### 5.1 List Available Tasks
```
GET /deliveries/available
Authorization: Bearer <deliverer_token>
```
> Returns `AWAITING_DELIVERER_ASSIGN` orders whose farmer commune is in the deliverer's registered wilaya.

**Response `200`** — `Order[]` with product and commune info.

---

### 5.2 Self-Assign Task
```
POST /deliveries/:orderId/assign
Authorization: Bearer <deliverer_token>
```
**Request Body:** None  
**Pre-conditions (§6.6):**
1. Order status is `AWAITING_DELIVERER_ASSIGN`
2. Order's farmer commune is in the deliverer's wilaya
3. `delivererProfile.isAvailable = true`

**Side effects (atomic):**
- `order.status` → `AWAITING_DELIVERER_PICKUP`
- `order.delivererId` = caller's ID
- `profile.isAvailable` → `false`
- `profile.currentOrderId` = orderId

**Response `200`** — updated `Order`. `409` if busy or order unavailable. `403` if outside wilaya.

---

### 5.3 Confirm Pickup
```
PATCH /deliveries/:orderId/confirm-pickup
Authorization: Bearer <deliverer_token>
```
**Request Body:** None  
**Logic:** Sets `delivererConfirmedPickup = true`. If `farmerConfirmedPickup` also true → `IN_TRANSIT`.  
**Valid status:** `AWAITING_DELIVERER_PICKUP`

**Response `200`** — updated `Order`.

---

### 5.4 Confirm Delivery
```
PATCH /deliveries/:orderId/confirm-delivery
Authorization: Bearer <deliverer_token>
```
**Request Body:** None  
**Logic:** Sets `delivererConfirmedDelivery = true`. If `buyerConfirmedDelivery` also true → `COMPLETED` + `profile.isAvailable → true`.  
**Valid status:** `IN_TRANSIT`

**Response `200`** — updated `Order`.

---

## 6. Reviews

### 6.1 Submit Review *(BUYER)*
```
POST /reviews
Authorization: Bearer <buyer_token>
```
**Request Body**
```json
{
  "orderId": "uuid",
  "rating":  5,
  "comment": "Excellent dates, arrived fresh!"
}
```
> `orderId` must be a **COMPLETED** order belonging to the caller. `comment` is optional (max 1000 chars). `farmerId` is derived server-side.

**Response `201`**
```json
{
  "id":         "uuid",
  "orderId":    "uuid",
  "reviewerId": "uuid",
  "farmerId":   "uuid",
  "rating":     5,
  "comment":    "Excellent dates, arrived fresh!",
  "createdAt":  "2026-05-11T12:00:00.000Z",
  "reviewer":   { "id": "uuid", "fullname": "Ahmed Benali" }
}
```
> After insert, a TypeORM subscriber automatically recalculates `User.rating` and `User.ratingCount` for the farmer within the same transaction.

---

### 6.2 List Reviews for a Farmer *(BUYER / FARMER / DELIVERER)*
```
GET /reviews/farmer/:farmerId
Authorization: Bearer <token>
```
**Response `200`** — `Review[]` sorted newest-first, includes `reviewer.fullname`.

---

### 6.3 Get Review for an Order *(BUYER / FARMER)*
```
GET /reviews/order/:orderId
Authorization: Bearer <token>
```
**Response `200`** — single `Review` object, or `null` if not yet reviewed.

---

## 7. Admin

> All endpoints require `ADMIN` role.

### 7.1 List All Users
```
GET /admin/users
Authorization: Bearer <admin_token>
```
**Response `200`** — `User[]` with `farmerProfile` and `delivererProfile` relations. Sensitive fields (`passwordHash`, `refreshTokenHash`) are excluded by `select: false`.

---

### 7.2 Ban User
```
PATCH /admin/users/:id/ban
Authorization: Bearer <admin_token>
```
**Request Body:** None  
**Effect:** Sets `isBanned = true` and `refreshTokenHash = null` (invalidates all sessions). Subsequent requests with valid JWTs from this user return `401 Your account has been suspended`.

**Response `200`** — updated `User`.

---

### 7.3 Unban User
```
PATCH /admin/users/:id/unban
Authorization: Bearer <admin_token>
```
**Request Body:** None  
**Effect:** Sets `isBanned = false`. User must log in again to get new tokens.

**Response `200`** — updated `User`.

---

### 7.4 Platform Statistics
```
GET /admin/stats
Authorization: Bearer <admin_token>
```
**Response `200`**
```json
{
  "orders": {
    "total":     142,
    "completed":  98,
    "pending":    12,
    "inProgress": 27,
    "rejected":    5
  },
  "revenue": {
    "fromProducts": 485000.00,
    "fromDelivery":  62300.00,
    "total":        547300.00
  },
  "users": {
    "total":  320,
    "active": 317,
    "banned":   3,
    "byRole": {
      "BUYER":     201,
      "FARMER":     87,
      "DELIVERER":  29,
      "ADMIN":       3
    }
  }
}
```
> Revenue is summed only from `COMPLETED` orders. `inProgress` groups: `AWAITING_BUYER_PICKUP`, `AWAITING_DELIVERER_ASSIGN`, `AWAITING_DELIVERER_PICKUP`, `IN_TRANSIT`.

---

## 8. Enum Reference

### `UserRole`
| Value | Used for |
|---|---|
| `BUYER` | Marketplace buyer |
| `FARMER` | Product seller |
| `DELIVERER` | Delivery agent |
| `ADMIN` | Platform administrator |

---

### `ActivityType`
| Value | Description |
|---|---|
| `VEGETABLES_FRUITS` | Vegetables & fruits farming |
| `DATES` | Date palm cultivation |
| `LIVESTOCK` | Livestock (cattle, sheep, etc.) |
| `POULTRY` | Poultry farming |

---

### `VehicleType`
| Value | Description |
|---|---|
| `FOURGON` | Standard van |
| `FOURGON_REFRIGERE` | Refrigerated van |
| `HARBIN` | Harbin-style truck |
| `CAMION` | Standard truck |
| `CAMION_REFRIGERE` | Refrigerated truck |
| `HILUX` | Toyota Hilux pickup |

---

### `OrderStatus`
| Value | Description |
|---|---|
| `PENDING` | Awaiting farmer accept/reject |
| `REJECTED` | Farmer rejected the order |
| `AWAITING_BUYER_PICKUP` | Accepted (no delivery) — buyer collects from farm |
| `AWAITING_DELIVERER_ASSIGN` | Accepted (with delivery) — awaiting a deliverer |
| `AWAITING_DELIVERER_PICKUP` | Deliverer assigned — awaiting dual pickup confirmation |
| `IN_TRANSIT` | Package collected, en route to buyer |
| `COMPLETED` | Order fully confirmed by all parties |

---

### `DeliveryOption`
| Value | Description |
|---|---|
| `WITH_DELIVERY` | Deliverer assigned; delivery price calculated via Haversine formula (§8.2) |
| `WITHOUT_DELIVERY` | Buyer collects directly from the farm |

---

### `ProductSortBy`
| Value | Description |
|---|---|
| `price_asc` | Price low → high |
| `price_desc` | Price high → low |
| `date_desc` | Newest first |
| `rating_desc` | Highest rated farmer first |

---

## Error Response Format

All errors follow the global exception filter format:

```json
{
  "statusCode": 400,
  "message":    "The selected commune does not belong to your registered wilaya",
  "error":      "Bad Request",
  "timestamp":  "2026-05-11T10:00:00.000Z",
  "path":       "/api/orders"
}
```

| Status | When |
|---|---|
| `400` | Validation failure or business rule violation |
| `401` | Missing / expired / invalid token, or banned account |
| `403` | Authenticated but wrong role or resource ownership |
| `404` | Entity not found |
| `409` | Conflict (duplicate, wrong state, `isAvailable = false`) |
