"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useOrders } from "@/hooks/useOrders";
import { CancelModal } from "@/components/orders/CancelModal";
import { OrderStatusButton } from "@/components/orders/OrderStatusButton";
import { OrderProductCell } from "@/components/orders/OrderProductCell";
import { formatPrice } from "@/lib/utils";
import { sortByPickupTimeAsc } from "@/lib/timeSlots";

export default function OrdersDetailsPage() {
  const params = useParams();
  const locationId = params?.locationId as string;
  
  const { orders, changeStatus, cancelOrder } = useOrders({
    locationId,
    pollInterval: 3000,
    enableBlockingCheck: true,
  });

  const [cancelModal, setCancelModal] = useState<{
    orderId: string;
    orderTime: string;
    orderContact: string;
  } | null>(null);

  // Gefilterte und sortierte Listen
  const latestOrders = orders
    .filter((o) => o.status === "PENDING")
    .sort(sortByPickupTimeAsc)
    .slice(0, 10);

  const completedOrders = orders
    .filter((o) => ["COMPLETED", "READY", "CANCELLED"].includes(o.status))
    .sort(sortByPickupTimeAsc)
    .slice(0, 20);

  const handleLongPress = (orderId: string, orderTime: string, orderContact: string) => {
    setCancelModal({ orderId, orderTime, orderContact });
  };

  const handleCancelConfirm = async () => {
    if (cancelModal) {
      await cancelOrder(cancelModal.orderId);
      setCancelModal(null);
    }
  };

  const getRowColor = (index: number, status?: string) => {
    if (status === "CANCELLED") return "bg-red-100";
    return index % 2 === 0 ? "bg-green-50" : "bg-yellow-50";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders Details</h1>
        <span className="text-sm text-gray-500 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live-Updates aktiv
        </span>
      </div>

      {/* Latest Orders */}
      <div className="mb-8">
        <div className="bg-gray-900 text-white px-6 py-3 rounded-t-lg">
          <h2 className="text-lg font-semibold">Latest Orders Details</h2>
        </div>
        <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adresse</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abholzeit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Menge</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ohne/Extra</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preise</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ZahlSt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {latestOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Keine neuen Bestellungen
                  </td>
                </tr>
              ) : (
                latestOrders.map((order, index) => (
                  <tr key={order.id} className={getRowColor(index, order.status)}>
                    <td className="px-4 py-3 text-sm">{order.contact}</td>
                    <td className="px-4 py-3 text-sm">{order.address || "-"}</td>
                    <td className="px-4 py-3 text-sm">{order.pickupTime || order.time || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <OrderProductCell products={order.products} type="quantity" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <OrderProductCell products={order.products} type="name" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <OrderProductCell products={order.products} type="extras" />
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatPrice(order.price)}</td>
                    <td className="px-4 py-3 text-sm">{order.paymentStatus}</td>
                    <td className="px-4 py-3 text-sm">
                      <OrderStatusButton
                        order={order}
                        onStatusChange={changeStatus}
                        onLongPress={handleLongPress}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Orders */}
      <div>
        <div className="bg-gray-600 text-white px-6 py-3 rounded-t-lg">
          <h2 className="text-lg font-semibold">Completed Orders</h2>
        </div>
        <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adresse</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abholzeit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Menge</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ohne/Extra</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preise</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ZahlSt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {completedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Keine abgeschlossenen Bestellungen
                  </td>
                </tr>
              ) : (
                completedOrders.map((order, index) => (
                  <tr key={order.id} className={getRowColor(index, order.status)}>
                    <td className="px-4 py-3 text-sm">{order.contact}</td>
                    <td className="px-4 py-3 text-sm">{order.address || "-"}</td>
                    <td className="px-4 py-3 text-sm">{order.pickupTime || order.time || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <OrderProductCell products={order.products} type="quantity" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <OrderProductCell products={order.products} type="name" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <OrderProductCell products={order.products} type="extras" />
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatPrice(order.price)}</td>
                    <td className="px-4 py-3 text-sm">{order.paymentStatus}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={order.status === "CANCELLED" ? "text-red-600" : "text-green-600"}>
                        {order.status === "CANCELLED" ? "STORNIERT" : order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <CancelModal
          orderTime={cancelModal.orderTime}
          orderContact={cancelModal.orderContact}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelModal(null)}
        />
      )}
    </div>
  );
}
