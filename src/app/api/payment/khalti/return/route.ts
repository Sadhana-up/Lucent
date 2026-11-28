import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupKhaltiPayment, toPaisa } from "@/lib/khalti";
import {
  notifyBuyerOrderConfirmed,
  notifySellersForOrder,
} from "@/lib/order-notifications";
import { releaseOrderStock } from "@/lib/inventory";

/**
 * Khalti redirects the buyer's browser here (GET) after payment. The customer
 * is redirected to this route with query params, but we never trust them —
 * the payment is confirmed with Khalti's lookup API before the order is
 * marked as paid.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const redirectToSuccess = (orderNumber: string) => {
    const url = new URL("/shop/checkout/success", origin);
    url.searchParams.set("order", orderNumber);
    return NextResponse.redirect(url);
  };

  const redirectToFailure = (orderNumber?: string, reason?: string) => {
    const url = new URL("/shop/checkout/failed", origin);
    if (orderNumber) url.searchParams.set("order", orderNumber);
    if (reason) url.searchParams.set("reason", reason);
    return NextResponse.redirect(url);
  };

  try {
    const pidx = searchParams.get("pidx");
    const purchaseOrderId = searchParams.get("purchase_order_id");

    if (!pidx || !purchaseOrderId) {
      return redirectToFailure(undefined, "missing_reference");
    }

    const order = await prisma.order.findUnique({
      where: { id: purchaseOrderId },
    });

    if (!order) {
      return redirectToFailure(undefined, "order_not_found");
    }

    // Idempotent: if this order is already paid, don't notify sellers again.
    if (order.paymentStatus === "PAID") {
      return redirectToSuccess(order.orderNumber);
    }

    // The pidx we stored at initiation must match the one being returned.
    if (order.paymentRef && order.paymentRef !== pidx) {
      return redirectToFailure(order.orderNumber, "reference_mismatch");
    }

    const lookup = await lookupKhaltiPayment(pidx);

    const isCompleted = lookup.status === "Completed";
    const amountMatches = lookup.total_amount === toPaisa(Number(order.totalAmount));
    const referenceMatches = !order.paymentRef || order.paymentRef === lookup.pidx;

    if (!isCompleted || !amountMatches || !referenceMatches) {
      const failed = await prisma.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: { notIn: ["PAID", "FAILED"] },
        },
        data: { paymentStatus: "FAILED" },
      });
      if (failed.count > 0) {
        await releaseOrderStock(order.id);
      }
      return redirectToFailure(order.orderNumber, lookup.status);
    }

    const confirmed = await prisma.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: { not: "PAID" },
      },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        paymentTxnId: lookup.transaction_id ?? undefined,
        paidAt: new Date(),
        reservationExpiresAt: null,
      },
    });

    if (confirmed.count === 0) {
      return redirectToSuccess(order.orderNumber);
    }

    await Promise.all([
      notifySellersForOrder(order.id),
      notifyBuyerOrderConfirmed(order.id),
    ]);

    return redirectToSuccess(order.orderNumber);
  } catch (error) {
    console.error("Error verifying Khalti payment:", error);
    return redirectToFailure(undefined, "verification_error");
  }
}
