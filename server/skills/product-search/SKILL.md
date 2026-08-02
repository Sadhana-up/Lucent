---
name: product-search
description: Searches the skincare product database to find products matching user skin concerns, skin type, ingredients, or general text queries. Returns product details with clickable links. Use when a user asks about skincare products, wants recommendations based on their skin condition, or needs to find specific products.
---

## What this skill is for

This skill provides a robust, read-only database search tool for finding skincare products in the Lucent marketplace. It is designed to support the skin-analysis workflow: after the agent identifies a user's skin concerns from a photo, it uses this tool to find and recommend relevant products.

## When this skill activates

- User asks for product recommendations based on their skin type or concerns
- User wants to find products with specific ingredients
- User asks about products for a specific skin condition (acne, dryness, dark spots, etc.)
- Agent has completed a skin analysis and needs to find matching products
- User asks to search for products by name or keyword

## Search capabilities

The `search_products` tool supports:

1. **Skin concern search**: Find products targeting specific concerns (acne, blackheads, fine lines, dark spots, redness, oiliness, dryness, etc.)
2. **Skin type search**: Find products suitable for specific skin types (oily, dry, combination, sensitive, normal, all)
3. **Ingredient search**: Find products containing specific ingredients (niacinamide, salicylic acid, vitamin C, hyaluronic acid, etc.)
4. **Text search**: General keyword search across product titles and descriptions
5. **Category search**: Find products by category (cleansers, serums, moisturizers, sunscreens, etc.)
6. **Price range search**: Filter by minimum and maximum price
7. **Combined search**: Mix any of the above criteria for precise results

## How to use

Call the `search_products` tool with any combination of these parameters:

- `query` (string): General text search across title and description
- `skin_concerns` (string): Comma-separated skin concerns to search for (e.g., "acne, blackheads")
- `skin_type` (string): Skin type to filter by (e.g., "oily", "dry", "combination")
- `ingredients` (string): Comma-separated ingredients to search for (e.g., "niacinamide, salicylic acid")
- `category` (string): Category slug to filter by (e.g., "serums", "cleansers")
- `min_price` (number): Minimum price filter
- `max_price` (number): Maximum price filter
- `in_stock` (boolean): Only return products that are in stock
- `limit` (number): Maximum number of results (default 10, max 20)

## Response format

The tool returns a list of matching products with:
- Product ID, title, slug, and description
- Price and discount price
- Skin type and skin concerns
- Ingredients and usage instructions
- Stock status
- Seller store name
- Product URL for the marketplace

## Usage in skin analysis workflow

After analyzing a user's skin photo:
1. Identify the key skin concerns (acne, dryness, dark spots, etc.)
2. Determine the user's likely skin type from the photo
3. Call `search_products` with the identified concerns and skin type
4. Present the top matching products to the user with clickable links

## Important notes

- This tool is **strictly read-only** — it can only query the database, never modify it
- All searches are case-insensitive
- The tool uses PostgreSQL's ILIKE for flexible text matching
- Results are ranked by relevance to the search criteria
- Product URLs point to the marketplace product detail page
