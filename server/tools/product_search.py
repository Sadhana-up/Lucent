"""Read-only product search tool for the Lucent skincare marketplace.

This module provides a robust, secure, read-only database query tool that
allows the ADK agent to search for skincare products based on skin concerns,
skin type, ingredients, and other criteria.
"""

from __future__ import annotations

import os
import re
from typing import Any, Optional

import psycopg
import psycopg.rows
from dotenv import load_dotenv
from psycopg_pool import AsyncConnectionPool

load_dotenv()

# ---------------------------------------------------------------------------
# Database connection (read-only)
# ---------------------------------------------------------------------------

_DSN = os.environ.get("DATABASE_URL")
_pool: AsyncConnectionPool | None = None


async def _get_pool() -> AsyncConnectionPool:
    """Lazily initialise a read-only async connection pool."""
    global _pool
    if _pool is None:
        if not _DSN:
            raise RuntimeError("DATABASE_URL is not set")
        _pool = AsyncConnectionPool(
            conninfo=_DSN,
            min_size=1,
            max_size=5,
            kwargs={
                "row_factory": psycopg.rows.dict_row,
            },
        )
        await _pool.open()
    return _pool


# ---------------------------------------------------------------------------
# Helper: build ILIKE conditions for comma-separated fields
# ---------------------------------------------------------------------------


def _build_ilike_conditions(
    column: str, terms: list[str], params: list[Any], param_offset: int
) -> tuple[str, int]:
    """Build OR'd ILIKE conditions for a column against multiple terms.

    Handles comma-separated values stored in the column (e.g. skinType = "oily,combination").
    Returns the SQL fragment and the number of params consumed.
    """
    conditions: list[str] = []
    count = 0
    for term in terms:
        term = term.strip()
        if not term:
            continue
        # Use ILIKE with wildcards for substring matching
        # Also search within comma-separated values: ',term,' or 'term,%' or '%,term' or exact
        p = param_offset + count
        conditions.append(
            f"({column} ILIKE %({p})s OR {column} ILIKE %({p})s OR "
            f"{column} ILIKE %({p})s OR {column} ILIKE %({p})s)"
        )
        # Store the 4 variations as separate params
        params.extend([
            f"%{term}%",      # contains
            f"{term},%",      # starts with
            f"%,{term}",      # ends with
            f"%,{term},%",    # in the middle
        ])
        count += 4
    return " OR ".join(conditions) if conditions else "", count


def _build_text_search(
    column: str, terms: list[str], params: list[Any], param_offset: int
) -> tuple[str, int]:
    """Build AND'd ILIKE conditions for full-text-like search across a column."""
    conditions: list[str] = []
    count = 0
    for term in terms:
        term = term.strip()
        if not term:
            continue
        p = param_offset + count
        conditions.append(f"{column} ILIKE %({p})s")
        params.append(f"%{term}%")
        count += 1
    return " AND ".join(conditions) if conditions else "", count


# ---------------------------------------------------------------------------
# Main tool function
# ---------------------------------------------------------------------------


async def search_products(
    query: Optional[str] = None,
    skin_concerns: Optional[str] = None,
    skin_type: Optional[str] = None,
    ingredients: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    in_stock: Optional[bool] = None,
    limit: int = 10,
) -> dict[str, Any]:
    """Search the Lucent skincare product database.

    Finds products matching the given criteria. Supports text search across
    product titles and descriptions, filtering by skin concerns, skin type,
    ingredients, category, price range, and stock availability.

    All searches are case-insensitive. For comma-separated fields (skinType,
    skinConcerns), the search matches individual values within the field.

    Args:
        query: General text search across product title and description.
        skin_concerns: Comma-separated skin concerns to search for (e.g. "acne, blackheads").
        skin_type: Skin type to filter by (e.g. "oily", "dry", "combination").
        ingredients: Comma-separated ingredients to search for (e.g. "niacinamide, vitamin c").
        category: Category slug to filter by (e.g. "serums", "cleansers").
        min_price: Minimum product price.
        max_price: Maximum product price.
        in_stock: If True, only return products with stock > 0.
        limit: Maximum number of results (1-20, default 10).

    Returns:
        A dict with 'products' (list of matching products) and 'total' count.
        Each product includes: id, title, slug, description, price, discount_price,
        effective_price, stock, skin_type, skin_concerns, ingredients,
        usage_instructions, category_name, seller_store_name, product_url.
    """
    # Clamp limit
    limit = max(1, min(limit, 20))

    pool = await _get_pool()
    params: dict[str, Any] = {}
    where_clauses: list[str] = []

    # Always filter to active products only
    where_clauses.append("p.\"status\" = 'ACTIVE'")
    param_idx = 0

    # --- General text search (AND all terms across title + description) ---
    if query:
        terms = [t.strip() for t in re.split(r"[,\s]+", query) if t.strip()]
        text_parts: list[str] = []
        for term in terms:
            p_title = f"q_title_{param_idx}"
            p_desc = f"q_desc_{param_idx}"
            text_parts.append(f"(p.title ILIKE %({p_title})s OR p.description ILIKE %({p_desc})s)")
            params[p_title] = f"%{term}%"
            params[p_desc] = f"%{term}%"
            param_idx += 1
        where_clauses.append(f"({' AND '.join(text_parts)})")

    # --- Skin concerns search (OR within comma-separated values) ---
    if skin_concerns:
        concern_terms = [t.strip() for t in skin_concerns.split(",") if t.strip()]
        concern_parts: list[str] = []
        for term in concern_terms:
            key = f"concern_{param_idx}"
            concern_parts.append(
                f"(p.\"skinConcerns\" ILIKE %({key}_a)s OR "
                f"p.\"skinConcerns\" ILIKE %({key}_b)s OR "
                f"p.\"skinConcerns\" ILIKE %({key}_c)s OR "
                f"p.\"skinConcerns\" ILIKE %({key}_d)s)"
            )
            params[f"{key}_a"] = f"%{term}%"
            params[f"{key}_b"] = f"{term},%"
            params[f"{key}_c"] = f"%,{term}"
            params[f"{key}_d"] = f"%,{term},%"
            param_idx += 1
        where_clauses.append(f"({' OR '.join(concern_parts)})")

    # --- Skin type search ---
    if skin_type:
        st_parts: list[str] = []
        st_terms = [t.strip() for t in skin_type.split(",") if t.strip()]
        for term in st_terms:
            key = f"stype_{param_idx}"
            st_parts.append(
                f"(p.\"skinType\" ILIKE %({key}_a)s OR "
                f"p.\"skinType\" ILIKE %({key}_b)s OR "
                f"p.\"skinType\" ILIKE %({key}_c)s OR "
                f"p.\"skinType\" ILIKE %({key}_d)s)"
            )
            params[f"{key}_a"] = f"%{term}%"
            params[f"{key}_b"] = f"{term},%"
            params[f"{key}_c"] = f"%,{term}"
            params[f"{key}_d"] = f"%,{term},%"
            param_idx += 1
        where_clauses.append(f"({' OR '.join(st_parts)})")

    # --- Ingredients search ---
    if ingredients:
        ing_terms = [t.strip() for t in ingredients.split(",") if t.strip()]
        ing_parts: list[str] = []
        for term in ing_terms:
            key = f"ing_{param_idx}"
            ing_parts.append(f"p.ingredients ILIKE %({key})s")
            params[key] = f"%{term}%"
            param_idx += 1
        where_clauses.append(f"({' OR '.join(ing_parts)})")

    # --- Category filter ---
    if category:
        key = f"cat_{param_idx}"
        where_clauses.append(f"c.slug = %({key})s")
        params[key] = category
        param_idx += 1

    # --- Price range ---
    if min_price is not None:
        key = f"minp_{param_idx}"
        where_clauses.append(f"COALESCE(p.\"discountPrice\", p.price) >= %({key})s")
        params[key] = min_price
        param_idx += 1

    if max_price is not None:
        key = f"maxp_{param_idx}"
        where_clauses.append(f"COALESCE(p.\"discountPrice\", p.price) <= %({key})s")
        params[key] = max_price
        param_idx += 1

    # --- In stock filter ---
    if in_stock:
        where_clauses.append("p.stock > 0")

    # --- Build the query ---
    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"
    lim_key = f"lim_{param_idx}"
    params[lim_key] = limit

    sql = f"""
        SELECT
            p.id,
            p.title,
            p.slug,
            p.description,
            p.price,
            p."discountPrice",
            p.stock,
            p."skinType",
            p."skinConcerns",
            p.ingredients,
            p."usageInstructions",
            p.status,
            c.name AS "categoryName",
            c.slug AS "categorySlug",
            sp."storeName" AS "sellerStoreName",
            sp."storeSlug" AS "sellerStoreSlug",
            (
                SELECT pi.url
                FROM "ProductImage" pi
                WHERE pi."productId" = p.id AND pi."isPrimary" = TRUE
                LIMIT 1
            ) AS "primaryImageUrl"
        FROM "Product" p
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        LEFT JOIN "SellerProfile" sp ON p."sellerId" = sp.id
        WHERE {where_sql}
        ORDER BY
            CASE
                WHEN p."discountPrice" IS NOT NULL THEN p."discountPrice"
                ELSE p.price
            END ASC
        LIMIT %({lim_key})s
    """

    async with pool.connection() as conn:
        # Enforce read-only at the transaction level as a safety net
        async with conn.cursor() as cur:
            await cur.execute("SET TRANSACTION READ ONLY")
            await cur.execute(sql, params)
            rows = await cur.fetchall()

    products = []
    for row in rows:
        effective_price = row["discountPrice"] if row["discountPrice"] else row["price"]
        products.append({
            "id": row["id"],
            "title": row["title"],
            "slug": row["slug"],
            "description": row["description"][:500] + ("..." if len(row["description"] or "") > 500 else ""),
            "price": row["price"],
            "discount_price": row["discountPrice"],
            "effective_price": effective_price,
            "stock": row["stock"],
            "in_stock": row["stock"] > 0,
            "skin_type": row["skinType"],
            "skin_concerns": row["skinConcerns"],
            "ingredients": row["ingredients"],
            "usage_instructions": row["usageInstructions"],
            "category_name": row["categoryName"],
            "seller_store_name": row["sellerStoreName"],
            "product_url": f"/shop/{row['slug']}",
            "primary_image_url": row["primaryImageUrl"],
        })

    return {
        "products": products,
        "total": len(products),
        "query_summary": {
            "query": query,
            "skin_concerns": skin_concerns,
            "skin_type": skin_type,
            "ingredients": ingredients,
            "category": category,
            "min_price": min_price,
            "max_price": max_price,
            "in_stock": in_stock,
        },
    }


# ---------------------------------------------------------------------------
# For ADK: expose as a list of tool callables
# ---------------------------------------------------------------------------

# The ADK agent will use this function directly as a tool.
# Register it in the agent's tools list.
