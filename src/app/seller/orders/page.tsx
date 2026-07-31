"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/seller/orders");
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch seller orders:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId: string, status: string) {
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      if (res.ok) {
        setOrders(
          orders.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-pink-200/60 pb-6">
        <h1 className="text-2xl font-bold text-rose-950 tracking-tight">Customer Orders</h1>
        <p className="text-sm text-stone-500 mt-1">
          Review incoming orders for your products and update shipping status.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-rose-900 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-pink-200/60 p-12 text-center text-stone-500">
          <Package className="w-12 h-12 text-pink-300 mx-auto mb-3" />
          <p className="font-semibold text-rose-950">No customer orders yet</p>
          <p className="text-xs mt-1">Orders placed by customers will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="border-pink-200/60 overflow-hidden">
              <div className="bg-pink-50/50 p-4 border-b border-pink-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-rose-950 text-base">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs text-stone-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-600">Status:</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-pink-200 bg-white text-xs font-semibold outline-none focus:border-rose-900 cursor-pointer"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Items list */}
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-pink-100 overflow-hidden shrink-0 border border-pink-200/60">
                          {item.product?.images[0]?.url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Package size={18} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-rose-950 text-sm">
                            {item.product?.title || "Skincare Product"}
                          </h4>
                          <span className="text-xs text-stone-500">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-rose-950 text-sm">
                        ${(item.quantity * item.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Customer Details */}
                <div className="pt-4 border-t border-pink-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-stone-600 uppercase tracking-wider block mb-1">
                      Customer Info
                    </span>
                    <p className="font-medium text-stone-900">{order.customer?.name}</p>
                    <p className="text-stone-500">{order.customer?.email}</p>
                    <p className="text-stone-500 mt-0.5">Phone: {order.contactPhone}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-600 uppercase tracking-wider block mb-1">
                      Shipping Address
                    </span>
                    <p className="text-stone-700 whitespace-pre-line">{order.shippingAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
