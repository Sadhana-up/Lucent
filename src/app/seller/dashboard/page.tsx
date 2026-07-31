"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  PlusCircle,
  Store,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SellerDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [profRes, prodRes, ordRes] = await Promise.all([
          fetch("/api/seller/profile"),
          fetch("/api/seller/products"),
          fetch("/api/seller/orders"),
        ]);

        if (profRes.ok) setProfile(await profRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
        if (ordRes.ok) setOrders(await ordRes.json());
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-rose-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate metrics
  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const activeProducts = products.filter((p) => p.status === "ACTIVE").length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "PROCESSING").length;

  return (
    <div className="space-y-8">
      {/* Top Banner / Store Onboarding Callout */}
      {!profile?.storeName ? (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-900 to-pink-800 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Set Up Your Store Profile</h2>
            <p className="text-sm text-pink-100 mt-1">
              Add your store name, bio, and contact details to start selling skincare products.
            </p>
          </div>
          <Link href="/seller/profile">
            <Button className="bg-white text-rose-950 hover:bg-pink-100 font-semibold shadow-md shrink-0">
              <Store className="w-4 h-4 mr-2" /> Set Up Store
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pink-200/60 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-rose-950 tracking-tight">
              Welcome back, {profile.storeName}
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Here is what is happening with your skincare store today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/seller/products/new">
              <Button className="bg-rose-900 hover:bg-rose-950 text-white font-medium shadow-sm">
                <PlusCircle className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-pink-200/60 shadow-xs bg-gradient-to-br from-white to-pink-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Total Revenue
              </p>
              <h3 className="text-2xl font-bold text-rose-950 mt-1">
                ${totalRevenue.toFixed(2)}
              </h3>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center mt-1">
                <TrendingUp size={12} className="mr-1" /> Lifetime sales
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-rose-900">
              <DollarSign size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200/60 shadow-xs bg-gradient-to-br from-white to-pink-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Total Orders
              </p>
              <h3 className="text-2xl font-bold text-rose-950 mt-1">
                {orders.length}
              </h3>
              <span className="text-[11px] text-amber-600 font-medium flex items-center mt-1">
                <Clock size={12} className="mr-1" /> {pendingOrders} pending
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-rose-900">
              <ShoppingBag size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200/60 shadow-xs bg-gradient-to-br from-white to-pink-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Active Products
              </p>
              <h3 className="text-2xl font-bold text-rose-950 mt-1">
                {activeProducts}
              </h3>
              <span className="text-[11px] text-stone-500 mt-1">
                {products.length} total products
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-rose-900">
              <Package size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200/60 shadow-xs bg-gradient-to-br from-white to-pink-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Store Status
              </p>
              <h3 className="text-lg font-bold text-rose-950 mt-1 flex items-center gap-1.5">
                {profile?.isVerified ? (
                  <>
                    Verified <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </>
                ) : (
                  "Active Seller"
                )}
              </h3>
              <span className="text-[11px] text-stone-500 mt-1">
                Publicly visible
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-rose-900">
              <Store size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rose-950">Recent Orders</h2>
            <Link
              href="/seller/orders"
              className="text-xs font-semibold text-rose-800 hover:text-rose-950 flex items-center"
            >
              View all orders <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <Card className="border-pink-200/60 overflow-hidden">
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-sm">
                  No orders received yet. Once customers order your products, they will appear here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-pink-50/60 text-xs text-stone-600 uppercase border-b border-pink-200/60">
                      <tr>
                        <th className="p-4">Order #</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-100">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-pink-50/30">
                          <td className="p-4 font-mono font-medium text-rose-950">
                            {order.orderNumber}
                          </td>
                          <td className="p-4 font-medium text-stone-800">
                            {order.customer?.name || "Customer"}
                          </td>
                          <td className="p-4 font-bold text-rose-950">
                            ${order.totalAmount.toFixed(2)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                order.status === "DELIVERED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : order.status === "SHIPPED"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.status === "PROCESSING"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-stone-100 text-stone-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-stone-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Product Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rose-950">Your Products</h2>
            <Link
              href="/seller/products"
              className="text-xs font-semibold text-rose-800 hover:text-rose-950 flex items-center"
            >
              Manage all <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <Card className="border-pink-200/60 p-4 space-y-3">
            {products.length === 0 ? (
              <div className="py-6 text-center text-stone-500 text-sm">
                No products added yet.
                <div className="mt-3">
                  <Link href="/seller/products/new">
                    <Button size="sm" className="bg-rose-900 text-white">
                      <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add Product
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              products.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-xl border border-pink-100 bg-pink-50/20 hover:bg-pink-50/60 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-pink-100 overflow-hidden shrink-0">
                    {p.images[0]?.url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.images[0].url}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Package size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <h4 className="text-sm font-semibold text-rose-950 truncate">
                      {p.title}
                    </h4>
                    <p className="text-xs text-stone-500">
                      ${p.price.toFixed(2)} • Stock: {p.stock}
                    </p>
                  </div>
                  <Link href={`/seller/products/${p.id}/edit`}>
                    <Button variant="outline" size="xs" className="text-xs text-rose-900 border-pink-200">
                      Edit
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
