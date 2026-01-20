"use client";

import { useState, useEffect, useCallback } from "react";
import { getOrdersAsync as getOrders } from "@/lib/storage";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";

interface OrdersLiveViewProps {
  onOrdersUpdate?: (orders: Order[]) => void;
}

export default function OrdersLiveView({ onOrdersUpdate }: OrdersLiveViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);

  // Bestellungen laden mit Auto-Refresh
  const loadOrders = useCallback(async () => {
    const allOrders = await getOrders();
    setOrders(allOrders);
    
    // Callback aufrufen, um Parent-Komponente zu informieren
    if (onOrdersUpdate) {
      onOrdersUpdate(allOrders);
    }
  }, [onOrdersUpdate]);

  // Polling alle 3 Sekunden für Live-Updates
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Helper function to sort by pickupTime (desc)
  const sortByPickupTime = (a: Order, b: Order) => {
    const timeA = a.pickupTime || a.time || "00:00";
    const timeB = b.pickupTime || b.time || "00:00";
    const [hoursA, minsA] = timeA.split(":").map(Number);
    const [hoursB, minsB] = timeB.split(":").map(Number);
    const totalMinsA = (hoursA || 0) * 60 + (minsA || 0);
    const totalMinsB = (hoursB || 0) * 60 + (minsB || 0);
    return totalMinsB - totalMinsA; // Desc order
  };

  const pendingOrders = orders
    .filter((o) => o.status === "PENDING")
    .sort(sortByPickupTime)
    .slice(0, 10); // Zeige nur die letzten 10

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-600">Live-Updates aktiv</span>
        </div>
        {pendingOrders.length > 0 && (
          <span className="text-sm font-semibold text-gray-700">
            {pendingOrders.length} Pending Bestellung{pendingOrders.length > 1 ? "en" : ""}
          </span>
        )}
      </div>

      {pendingOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Keine ausstehenden Bestellungen
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Abholzeit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adresse</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produkte</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Preis</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingOrders.map((order, index) => (
                <tr 
                  key={order.id} 
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-3 py-2 text-sm font-medium">
                    {order.pickupTime || order.time || "-"}
                  </td>
                  <td className="px-3 py-2 text-sm">{order.contact}</td>
                  <td className="px-3 py-2 text-sm">
                    {(order as any).address || (order as any).deliveryAddress || "-"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {order.products.map((p, idx) => (
                      <div key={idx}>
                        {p.quantity}x {p.name}
                      </div>
                    ))}
                  </td>
                  <td className="px-3 py-2 text-sm font-semibold">
                    {formatPrice(order.price)}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                      PENDING
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
