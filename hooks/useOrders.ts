"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getOrdersAsync as getOrders, updateOrder, addOrder, getLocations } from "@/lib/storage";
import { Order } from "@/types";
import { useOrderNotifications } from "./useOrderNotifications";
import { findNextAvailableTimeSlot } from "@/lib/timeSlots";
import { useTime } from "@/components/TimeProvider";

interface UseOrdersOptions {
  locationId: string;
  pollInterval?: number;
  enableBlockingCheck?: boolean;
}

export function useOrders({ locationId, pollInterval = 3000, enableBlockingCheck = false }: UseOrdersOptions) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkForNewOrders } = useOrderNotifications();
  const { currentTime } = useTime();
  const currentTimeRef = useRef(currentTime);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Bestellungen laden
  const loadOrders = useCallback(async () => {
    try {
      const allOrders = await getOrders();
      const locationOrders = locationId 
        ? allOrders.filter(o => o.locationId === locationId)
        : allOrders;
      
      const pendingCount = locationOrders.filter(o => o.status === 'PENDING').length;
      checkForNewOrders(pendingCount);
      
      setOrders(locationOrders);
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Laden der Bestellungen:", error);
      setLoading(false);
    }
  }, [locationId, checkForNewOrders]);

  // Status ändern
  const changeStatus = useCallback(async (orderId: string, newStatus: Order["status"]) => {
    await updateOrder(orderId, { status: newStatus });
    await loadOrders();
  }, [loadOrders]);

  // Bestellung stornieren
  const cancelOrder = useCallback(async (orderId: string) => {
    await updateOrder(orderId, { status: "CANCELLED" });
    await loadOrders();
  }, [loadOrders]);

  // Verzögerungs-Prüfung und Slot-Blockierung
  const checkDelayAndBlockSlots = useCallback(async () => {
    if (!locationId || !enableBlockingCheck) return;

    try {
      let allOrders = await getOrders();
      allOrders = allOrders.filter((o) => o.locationId === locationId);

      const now = currentTimeRef.current; // Use simulated time
      const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const [currentHours, currentMins] = currentTimeStr.split(":").map(Number);
      const currentTotalMins = currentHours * 60 + currentMins;
      const todayStr = now.toISOString().split("T")[0];

      // Filtere relevante PENDING Bestellungen
      const pendingOrders = allOrders.filter((order) => {
        return (
          order.status === "PENDING" &&
          order.pickupTime &&
          !order.products.some((i) => i.name === "System Blocker")
        );
      });

      // Finde die maximale Verzögerung
      let maxDelayMinutes = 0;
      for (const order of pendingOrders) {
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
        if (orderDate > todayStr) continue;

        const [orderHours, orderMins] = order.pickupTime!.split(":").map(Number);
        const orderTotalMins = orderHours * 60 + orderMins;

        let delay = 0;
        if (orderDate === todayStr) {
          if (currentTotalMins > orderTotalMins) {
            delay = currentTotalMins - orderTotalMins;
          }
        } else {
          delay = 999;
        }

        if (delay > maxDelayMinutes) {
          maxDelayMinutes = delay;
        }
      }

      const requiredBlockers = maxDelayMinutes > 0 ? maxDelayMinutes : 0;

      if (requiredBlockers === 0) return;

      const blockerOrders = allOrders.filter(
        (o) =>
          o.status === "BLOCKED" &&
          o.products.some((i) => i.name === "System Blocker") &&
          new Date(o.createdAt).toISOString().split("T")[0] === todayStr
      );

      let currentBlockingLevel = 0;
      if (blockerOrders.length > 0) {
        currentBlockingLevel = Math.max(...blockerOrders.map((o) => o.blockingLevel || 0));
      }

      if (requiredBlockers > currentBlockingLevel) {
        for (let level = currentBlockingLevel + 1; level <= requiredBlockers; level++) {
          const nextSlot = await findNextAvailableTimeSlot(
            locationId, 
            allOrders, 
            async () => getLocations(),
            currentTimeRef.current
          );

          if (!nextSlot) {
            console.log(`[Verzögerungs-Prüfung] Kein Slot frei für Level ${level}`);
            break;
          }

          const newBlockerOrder: Order = {
            id: crypto.randomUUID(),
            contact: "SYSTEM",
            locationId: locationId,
            createdAt: currentTimeRef.current.toISOString(),
            time: currentTimeRef.current.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            pickupTime: nextSlot,
            paymentStatus: "Unpaid",
            status: "BLOCKED",
            blockingLevel: level,
            products: [{ name: "System Blocker", quantity: 1 }],
            price: 0,
          };

          await addOrder(newBlockerOrder);
          allOrders.push(newBlockerOrder);
        }

        loadOrders();
      }
    } catch (error) {
      console.error("[Verzögerungs-Prüfung] Fehler:", error);
    }
  }, [locationId, enableBlockingCheck, loadOrders]);

  // Polling für Live-Updates
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, pollInterval);
    return () => clearInterval(interval);
  }, [loadOrders, pollInterval]);

  // Track last checked minute to trigger blocking only once per minute
  const lastCheckedMinuteRef = useRef<string | null>(null);

  // Reactive Blocking Check - triggered by time changes (every minute)
  useEffect(() => {
    if (!enableBlockingCheck) return;
    
    const currentMinute = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    
    // Only check when minute changes (not on every render)
    if (currentMinute !== lastCheckedMinuteRef.current) {
      lastCheckedMinuteRef.current = currentMinute;
      checkDelayAndBlockSlots();
    }
  }, [currentTime, checkDelayAndBlockSlots, enableBlockingCheck]);

  // Helper to check if an order is delayed
  const isOrderDelayed = useCallback((order: Order): boolean => {
    if (order.status !== "PENDING" || !order.pickupTime) return false;
    
    const now = currentTimeRef.current;
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const [currentHours, currentMins] = currentTimeStr.split(":").map(Number);
    const currentTotalMins = currentHours * 60 + currentMins;
    const todayStr = now.toISOString().split("T")[0];
    const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
    
    if (orderDate > todayStr) return false;
    
    const [orderHours, orderMins] = order.pickupTime.split(":").map(Number);
    const orderTotalMins = orderHours * 60 + orderMins;
    
    if (orderDate === todayStr) {
      return currentTotalMins > orderTotalMins;
    }
    
    return true; // Past day orders are always delayed
  }, []);

  return {
    orders,
    loading,
    loadOrders,
    changeStatus,
    isOrderDelayed,
    cancelOrder,
  };
}
