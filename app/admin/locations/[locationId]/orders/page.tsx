"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useOrders } from "@/hooks/useOrders";
import { useTime } from "@/components/TimeProvider";
import { CancelModal } from "@/components/orders/CancelModal";
import { OrderStatusButton } from "@/components/orders/OrderStatusButton";
import { OrderProductCell } from "@/components/orders/OrderProductCell";
import { formatPrice } from "@/lib/utils";
import { sortByPickupTimeAsc, calculateBlockedMinutesForOrder } from "@/lib/timeSlots";
import { clearAllOrders, getLocations } from "@/lib/storage";

export default function LatestOrdersPage() {
  const params = useParams();
  const locationId = params?.locationId as string;
  
  const { orders, changeStatus, cancelOrder, isOrderDelayed } = useOrders({
    locationId,
    pollInterval: 3000,
    enableBlockingCheck: true,
  });

  const { currentTime, speed, isPaused, setSpeed, setTime, togglePause, resetTime } = useTime();

  const [cancelModal, setCancelModal] = useState<{
    orderId: string;
    orderTime: string;
    orderContact: string;
  } | null>(null);

  // Gefilterte und sortierte Listen
  const pendingOrders = orders
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

  const handleClearAllOrders = async () => {
    if (confirm('🗑️ Wirklich alle Bestellungen löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      await clearAllOrders();
      // Orders will auto-refresh via polling
    }
  };

  const getRowColor = (order: any, index: number) => {
    if (order.status === "CANCELLED") return "bg-red-100";
    if (isOrderDelayed && isOrderDelayed(order)) return "bg-red-200";
    return index % 2 === 0 ? "bg-green-50" : "bg-yellow-50";
  };

  // Helper to format Date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setTime(newDate);
    }
  };

  // ============================================
  // TIMESLOT VISUALISIERUNG
  // ============================================
  
  // Track newly blocked slots for animation
  const [newlyBlockedSlots, setNewlyBlockedSlots] = useState<Set<string>>(new Set());
  const [previousBlockerCount, setPreviousBlockerCount] = useState(0);

  // Generate timeslots for visualization (next 60 minutes from current time)
  const timeslotVisualization = useMemo(() => {
    const slots: Array<{
      time: string;
      status: 'free' | 'booked' | 'blocked' | 'past' | 'prep';
      orderContact?: string;
      isSystemBlocker?: boolean;
      prepForOrder?: string; // Which order this prep time is for
    }> = [];

    const now = currentTime;
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMins = currentHours * 60 + currentMinutes;
    const todayStr = now.toISOString().split('T')[0];

    // Get active location for prep time calculation
    const locations = getLocations();
    const activeLocation = locations.find((loc) => loc.id === locationId);

    // Helper: Convert time string to minutes
    const timeToMinutes = (timeStr: string): number => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    // Build a map of all blocked minutes (pickup times + prep times)
    const slotInfo = new Map<string, {
      status: 'booked' | 'blocked' | 'prep';
      orderContact?: string;
      isSystemBlocker?: boolean;
      prepForOrder?: string;
    }>();

    // Process all orders
    const todayOrders = orders.filter((o) => {
      if (o.status === 'CANCELLED' || !o.pickupTime) return false;
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate === todayStr;
    });

    // First pass: Mark all pickup times (booked/blocked)
    for (const order of todayOrders) {
      const isSystemBlocker = order.status === 'BLOCKED' && 
        order.products?.some((p) => p.name === 'System Blocker');

      // Mark the pickup time itself
      slotInfo.set(order.pickupTime!, {
        status: isSystemBlocker ? 'blocked' : 'booked',
        orderContact: order.contact,
        isSystemBlocker,
      });
    }

    // Second pass: Mark all prep times (can overlap with each other, but not with bookings)
    for (const order of todayOrders) {
      const isSystemBlocker = order.status === 'BLOCKED' && 
        order.products?.some((p) => p.name === 'System Blocker');

      // Calculate and mark prep time slots (only for non-blocker orders)
      if (!isSystemBlocker && activeLocation) {
        const blockMins = calculateBlockedMinutesForOrder(order, activeLocation);
        const pickupTotalMins = timeToMinutes(order.pickupTime!);

        // Mark minutes BEFORE the pickup time as prep
        for (let i = 1; i < blockMins; i++) {
          const prepMinute = pickupTotalMins - i;
          if (prepMinute >= 0) {
            const prepTimeStr = `${Math.floor(prepMinute / 60).toString().padStart(2, '0')}:${(prepMinute % 60).toString().padStart(2, '0')}`;
            
            // Only don't overwrite actual bookings (booked/blocked), prep can be overwritten
            const existing = slotInfo.get(prepTimeStr);
            if (!existing || existing.status === 'prep') {
              slotInfo.set(prepTimeStr, {
                status: 'prep',
                prepForOrder: order.contact,
              });
            }
          }
        }
      }
    }

    // Generate slots for the next 60 minutes
    for (let i = -5; i < 60; i++) {
      const slotTotalMins = currentTotalMins + i;
      const slotHours = Math.floor(slotTotalMins / 60) % 24;
      const slotMins = slotTotalMins % 60;
      const timeStr = `${slotHours.toString().padStart(2, '0')}:${slotMins.toString().padStart(2, '0')}`;

      const info = slotInfo.get(timeStr);

      if (i < 0) {
        // Past slots
        slots.push({
          time: timeStr,
          status: 'past',
          orderContact: info?.orderContact,
        });
      } else if (info) {
        slots.push({
          time: timeStr,
          status: info.status,
          orderContact: info.orderContact,
          isSystemBlocker: info.isSystemBlocker,
          prepForOrder: info.prepForOrder,
        });
      } else {
        slots.push({
          time: timeStr,
          status: 'free',
        });
      }
    }

    return slots;
  }, [currentTime, orders, locationId]);

  // Detect new system blockers and trigger animation
  const currentBlockerCount = orders.filter(
    (o) => o.status === 'BLOCKED' && o.products?.some((p) => p.name === 'System Blocker')
  ).length;

  useEffect(() => {
    if (currentBlockerCount > previousBlockerCount) {
      // New blockers were added - find which slots are newly blocked
      const blockedSlots = new Set<string>();
      const todayStr = currentTime.toISOString().split('T')[0];
      
      orders
        .filter((o) => {
          const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
          return o.status === 'BLOCKED' && 
            o.products?.some((p) => p.name === 'System Blocker') &&
            orderDate === todayStr;
        })
        .forEach((o) => {
          if (o.pickupTime) blockedSlots.add(o.pickupTime);
        });

      setNewlyBlockedSlots(blockedSlots);

      // Clear animation after 2 seconds
      const timeout = setTimeout(() => {
        setNewlyBlockedSlots(new Set());
      }, 2000);

      return () => clearTimeout(timeout);
    }
    setPreviousBlockerCount(currentBlockerCount);
  }, [currentBlockerCount, orders, currentTime, previousBlockerCount]);

  // Count stats
  const slotStats = useMemo(() => {
    const free = timeslotVisualization.filter((s) => s.status === 'free').length;
    const booked = timeslotVisualization.filter((s) => s.status === 'booked').length;
    const blocked = timeslotVisualization.filter((s) => s.status === 'blocked').length;
    const prep = timeslotVisualization.filter((s) => s.status === 'prep').length;
    return { free, booked, blocked, prep };
  }, [timeslotVisualization]);

  return (
    <div>
      {/* Time Controller */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between gap-6">
          {/* Clock Display */}
          <div className="flex flex-col">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Current Time</div>
            <div className="text-3xl font-mono font-bold text-blue-600">
              {currentTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </div>
            <div className="text-xs text-gray-500">
              {currentTime.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Speed Control */}
          <div className="flex-1 max-w-md">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Speed</label>
              <span className="text-sm font-bold text-blue-600">{speed}x</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="3600" 
              step="1"
              value={speed} 
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>1x (Real-time)</span>
              <span>3600x (1h/sec)</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button 
              onClick={togglePause}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                isPaused 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button 
              onClick={resetTime}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-600 text-white hover:bg-gray-700 transition-all"
            >
              ↺ Reset
            </button>
          </div>

          {/* Manual Time Set */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Jump to Time</label>
            <input
              type="datetime-local"
              value={formatDateForInput(currentTime)}
              onChange={handleDateChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TIMESLOT VISUALISIERUNG PANEL */}
      {/* ============================================ */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">⏰ Timeslot Monitor</h3>
            <span className="text-xs text-gray-400">Nächste 60 Minuten</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-300">Frei ({slotStats.free})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-gray-300">Gebucht ({slotStats.booked})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span className="text-gray-300">Vorbereitung ({slotStats.prep})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500 animate-pulse"></div>
              <span className="text-gray-300">System-Block ({slotStats.blocked})</span>
            </div>
          </div>
        </div>

        {/* Timeslot Grid */}
        <div className="flex flex-wrap gap-1">
          {timeslotVisualization.map((slot, index) => {
            const isNewlyBlocked = newlyBlockedSlots.has(slot.time);
            const isCurrentMinute = index === 5; // The 6th slot (index 5) is "now"
            
            let bgColor = '';
            let textColor = 'text-white';
            let animation = '';
            let border = '';
            
            switch (slot.status) {
              case 'past':
                bgColor = 'bg-gray-700';
                textColor = 'text-gray-500';
                break;
              case 'free':
                bgColor = 'bg-green-600 hover:bg-green-500';
                break;
              case 'booked':
                bgColor = 'bg-blue-600 hover:bg-blue-500';
                break;
              case 'prep':
                bgColor = 'bg-orange-500 hover:bg-orange-400';
                break;
              case 'blocked':
                bgColor = isNewlyBlocked 
                  ? 'bg-red-500' 
                  : 'bg-red-600 hover:bg-red-500';
                animation = isNewlyBlocked 
                  ? 'animate-[pulse_0.3s_ease-in-out_infinite] scale-110 ring-2 ring-red-300 ring-offset-2 ring-offset-gray-900' 
                  : '';
                break;
            }

            if (isCurrentMinute) {
              border = 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-900';
            }

            return (
              <div
                key={slot.time}
                className={`
                  relative group w-14 h-10 rounded flex flex-col items-center justify-center
                  transition-all duration-200 cursor-default
                  ${bgColor} ${textColor} ${animation} ${border}
                `}
                title={slot.orderContact ? `${slot.time} - ${slot.orderContact}` : (slot.prepForOrder ? `${slot.time} - Vorbereitung für ${slot.prepForOrder}` : slot.time)}
              >
                <span className="text-[10px] font-mono font-bold">{slot.time}</span>
                {slot.status === 'booked' && (
                  <span className="text-[8px] truncate max-w-full px-1 opacity-75">
                    {slot.orderContact?.slice(0, 6)}
                  </span>
                )}
                {slot.status === 'prep' && (
                  <span className="text-[8px]">🍳</span>
                )}
                {slot.status === 'blocked' && (
                  <span className="text-[8px]">🚫</span>
                )}
                {isCurrentMinute && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                )}

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                  bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap
                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  {slot.time}
                  {slot.orderContact && ` • ${slot.orderContact}`}
                  {slot.prepForOrder && ` • 🍳 Vorbereitung für ${slot.prepForOrder}`}
                  {slot.isSystemBlocker && ' • 🚫 SYSTEM BLOCKER'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Animation Legend when blocking occurs */}
        {newlyBlockedSlots.size > 0 && (
          <div className="mt-4 p-3 bg-red-900/50 rounded-lg border border-red-500 animate-pulse">
            <div className="flex items-center gap-2 text-red-200">
              <span className="text-xl">⚠️</span>
              <span className="font-bold">VERZÖGERUNG ERKANNT!</span>
              <span className="text-sm">
                {newlyBlockedSlots.size} Timeslot(s) wurden vom System blockiert
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Latest Orders</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleClearAllOrders}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All Orders
          </button>
          <span className="text-sm text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live-Updates aktiv
          </span>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="mb-8">
        <div className="bg-gray-900 text-white px-6 py-3 rounded-t-lg">
          <h2 className="text-lg font-semibold">Aktuelle Bestellungen</h2>
        </div>
        <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abholzeit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Menge</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ohne/Extra</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preis</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Keine neuen Bestellungen
                  </td>
                </tr>
              ) : (
                pendingOrders.map((order, index) => (
                  <tr key={order.id} className={getRowColor(order, index)}>
                    <td className="px-4 py-3 text-sm">{order.contact}</td>
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
          <h2 className="text-lg font-semibold">Erledigte Bestellungen</h2>
        </div>
        <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abholzeit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Menge</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preis</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {completedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Keine erledigten Bestellungen
                  </td>
                </tr>
              ) : (
                completedOrders.map((order, index) => (
                  <tr key={order.id} className={getRowColor(order, index)}>
                    <td className="px-4 py-3 text-sm">{order.contact}</td>
                    <td className="px-4 py-3 text-sm">{order.pickupTime || order.time || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <OrderProductCell products={order.products} type="quantity" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <OrderProductCell products={order.products} type="name" />
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatPrice(order.price)}</td>
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
