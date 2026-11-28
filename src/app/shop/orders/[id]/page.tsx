import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { OrderDetailClient, type OrderDetail } from "./order-detail-client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/shop/orders/${id}`);
  }

  const order = await prisma.order.findFirst({
    where: { id, customerId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { isPrimary: "desc" } },
              seller: { select: { storeName: true } },
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const serialized: OrderDetail = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    refundStatus: order.refundStatus,
    totalAmount: Number(order.totalAmount),
    shippingAddress: order.shippingAddress,
    contactPhone: order.contactPhone,
    notes: order.notes,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    cancelReason: order.cancelReason,
    refundReason: order.refundReason,
    refundRequestedAt: order.refundRequestedAt?.toISOString() ?? null,
    refundedAt: order.refundedAt?.toISOString() ?? null,
    returnRequestedAt: order.returnRequestedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      product: {
        title: item.product.title,
        slug: item.product.slug,
        image: item.product.images[0]?.url ?? null,
        seller: item.product.seller.storeName,
      },
    })),
  };

  return <OrderDetailClient order={serialized} />;
}
