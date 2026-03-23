import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Qulaymarket API",
    version: "1.0.0",
    description:
      "REST API for the marketplace platform — Next.js backend, PostgreSQL, JWT auth.",
  },
  servers: [{ url: "/api", description: "Next.js API routes" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          pages: { type: "integer" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["user", "seller", "admin"] },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
        },
      },
      ProductSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          base_price: { type: "number" },
          sku: { type: "string" },
          views: { type: "integer" },
          thumbnail: { type: "string", nullable: true },
          category_name: { type: "string" },
          store_name: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      ProductDetail: {
        allOf: [
          { $ref: "#/components/schemas/ProductSummary" },
          {
            type: "object",
            properties: {
              description: { type: "string" },
              images: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    url: { type: "string" },
                    sort_order: { type: "integer" },
                  },
                },
              },
              variants: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    size: { type: "string" },
                    color: { type: "string" },
                    price: { type: "number" },
                    stock: { type: "integer" },
                    sku: { type: "string" },
                  },
                },
              },
              location: {
                nullable: true,
                type: "object",
                properties: {
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  address: { type: "string" },
                },
              },
            },
          },
        ],
      },
      Store: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          owner_name: { type: "string" },
          product_count: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          text: { type: "string" },
          user_id: { type: "string" },
          user_name: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      SellerRequest: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          store_name: { type: "string" },
          owner_name: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          status: { type: "string", enum: ["pending", "approved", "rejected"] },
          admin_note: { type: "string" },
          user_name: { type: "string" },
          user_email: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    // ── Auth ───────────────────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        token: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "409": { description: "Email already in use" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful — returns token" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user info",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Current user" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    // ── Categories ─────────────────────────────────────────────────────────────
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "List all categories",
        responses: {
          "200": {
            description: "Category list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        categories: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Category" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // ── Products ───────────────────────────────────────────────────────────────
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List products (newest or most popular)",
        parameters: [
          { in: "query", name: "sort", schema: { type: "string", enum: ["newest", "popular"] } },
          { in: "query", name: "category", schema: { type: "string", format: "uuid" } },
          { in: "query", name: "search", schema: { type: "string" } },
          { in: "query", name: "store_id", schema: { type: "string", format: "uuid" } },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "limit", schema: { type: "integer", default: 20 } },
        ],
        responses: { "200": { description: "Product list with pagination" } },
      },
      post: {
        tags: ["Products"],
        summary: "Create a product (seller only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "base_price"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  base_price: { type: "number" },
                  category_id: { type: "string", format: "uuid" },
                  images: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        url: { type: "string" },
                        sort_order: { type: "integer" },
                      },
                    },
                  },
                  variants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        size: { type: "string" },
                        color: { type: "string" },
                        price: { type: "number" },
                        stock: { type: "integer" },
                      },
                    },
                  },
                  location: {
                    type: "object",
                    properties: {
                      latitude: { type: "number" },
                      longitude: { type: "number" },
                      address: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Product created" },
          "401": { description: "Unauthorized" },
          "403": { description: "No active store" },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product detail (increments views)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Product detail" }, "404": { description: "Not found" } },
      },
      put: {
        tags: ["Products"],
        summary: "Update a product (seller — own, or admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  base_price: { type: "number" },
                  category_id: { type: "string" },
                  is_active: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated product" } },
      },
      delete: {
        tags: ["Products"],
        summary: "Delete a product (seller — own, or admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/products/{id}/comments": {
      get: {
        tags: ["Comments"],
        summary: "List comments for a product",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Comment list" } },
      },
      post: {
        tags: ["Comments"],
        summary: "Add a comment (auth required)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: { text: { type: "string" } },
              },
            },
          },
        },
        responses: { "201": { description: "Comment created" } },
      },
    },
    // ── Stores ─────────────────────────────────────────────────────────────────
    "/stores": {
      get: {
        tags: ["Stores"],
        summary: "List active stores",
        parameters: [
          { in: "query", name: "search", schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Store list" } },
      },
    },
    "/stores/request": {
      post: {
        tags: ["Stores"],
        summary: "Submit a seller request (auth required)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["store_name", "owner_name"],
                properties: {
                  store_name: { type: "string" },
                  store_description: { type: "string" },
                  owner_name: { type: "string" },
                  phone: { type: "string" },
                  address: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Request submitted" },
          "409": { description: "Duplicate request" },
        },
      },
    },
    "/stores/{id}": {
      get: {
        tags: ["Stores"],
        summary: "Get store detail",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Store detail" }, "404": { description: "Not found" } },
      },
    },
    "/stores/{id}/products": {
      get: {
        tags: ["Stores"],
        summary: "List products for a store",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
          { in: "query", name: "sort", schema: { type: "string", enum: ["newest", "popular"] } },
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Product list for store" } },
      },
    },
    // ── Comments ───────────────────────────────────────────────────────────────
    "/comments/{id}": {
      delete: {
        tags: ["Comments"],
        summary: "Delete a comment (own or admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" }, "403": { description: "Forbidden" } },
      },
    },
    // ── Admin ──────────────────────────────────────────────────────────────────
    "/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Dashboard stats",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Counts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users_count: { type: "integer" },
                    products_count: { type: "integer" },
                    stores_count: { type: "integer" },
                    pending_seller_requests: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/admin/seller-requests": {
      get: {
        tags: ["Admin"],
        summary: "List seller requests",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "status",
            schema: { type: "string", enum: ["pending", "approved", "rejected"], default: "pending" },
          },
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Request list" } },
      },
    },
    "/admin/seller-requests/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Approve or reject a seller request",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["action"],
                properties: {
                  action: { type: "string", enum: ["approve", "reject"] },
                  note: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Request processed" } },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "search", schema: { type: "string" } },
          { in: "query", name: "role", schema: { type: "string", enum: ["user", "seller", "admin"] } },
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "User list" } },
      },
    },
    "/admin/users/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Update a user (name or role)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["user", "seller", "admin"] },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated user" } },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete a user",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/admin/products": {
      get: {
        tags: ["Admin"],
        summary: "List all products",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "search", schema: { type: "string" } },
          { in: "query", name: "store_id", schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Product list (all, including inactive)" } },
      },
    },
    "/admin/products/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete a product",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" } },
      },
      patch: {
        tags: ["Admin"],
        summary: "Toggle product active status",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["is_active"],
                properties: { is_active: { type: "boolean" } },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
    },
    "/admin/stores": {
      get: {
        tags: ["Admin"],
        summary: "List all stores",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "search", schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Store list (all, including inactive)" } },
      },
    },
    "/admin/stores/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Toggle store active status",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["is_active"],
                properties: { is_active: { type: "boolean" } },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete a store",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" } },
      },
    },
  },
};

export function GET() {
  return NextResponse.json(spec);
}
