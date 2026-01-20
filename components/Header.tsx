"use client";

import { useState, useEffect } from "react";
import ShoppingCart from "./ShoppingCart";
import { CartItem, Location, Order, Product } from "@/types";
import { getLocations, getOrdersAsync, getProducts } from "@/lib/storage";
import { formatOpeningHours } from "@/lib/utils";
import { useTime } from "@/components/TimeProvider";

interface HeaderProps {
  cartItems: CartItem[];
  onCartClick: () => void;
}

export default function Header({ cartItems, onCartClick }: HeaderProps) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [location, setLocation] = useState<Location | null>(null);
  const [nextAvailableTime, setNextAvailableTime] = useState<string>("");
  const { currentTime } = useTime();

  const calculateNextAvailableTime = async () => {
    const locations = getLocations();
    const activeLocation = locations.find((loc) => loc.status === true);
    
    if (!activeLocation || !activeLocation.openDays) {
      setNextAvailableTime("");
      return;
    }

    // Verwende getOrdersAsync() um aktuelle Bestellungen (inkl. reservierte Slots) zu holen
    const orders = await getOrdersAsync();
    const now = currentTime;
    const todayStr = now.toISOString().split("T")[0];
    const bufferMinutes = activeLocation.bufferTime || 8;
    const minAvailableTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);

    const dayOfWeek = now.getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[dayOfWeek];
    const dayConfig = activeLocation.openDays.find((d) => d.day === currentDay);
    
    if (!dayConfig || !dayConfig.isOpen) {
      setNextAvailableTime("");
      return;
    }

    // Helper: Konvertiere HH:MM zu Minuten seit Mitternacht
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    };

    // Helper: Konvertiere Minuten zu HH:MM
    const minutesToTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    };

    // Helper: Prüfe ob eine Zeit in der Rush Hour liegt
    const isRushHourTime = (timeStr: string): boolean => {
      const [hour, minute] = timeStr.split(":").map(Number);
      const totalMinutes = hour * 60 + minute;
      
      const [rushStartHour, rushStartMin] = dayConfig.rushStart.split(":").map(Number);
      const rushStartTotal = rushStartHour * 60 + rushStartMin;
      
      const [rushEndHour, rushEndMin] = dayConfig.rushEnd.split(":").map(Number);
      const rushEndTotal = rushEndHour * 60 + rushEndMin;
      
      return totalMinutes >= rushStartTotal && totalMinutes < rushEndTotal;
    };

    // Sammle Produkte für Blockierungszeit-Berechnung
    const allProducts = getProducts();

    // Helper: Berechne blockierte Minuten für eine Bestellung
    const calculateBlockedMinutesForOrder = (order: Order): number => {
      let totalSeconds = 0;

      for (const orderProduct of order.products) {
        // Finde Produkt anhand des Namens
        const product = allProducts.find((p) => p.name === orderProduct.name);
        
        // Überspringe Produkte ohne applicablePreparationTime
        if (!product || product.applicablePreparationTime === false) {
          continue;
        }

        // Prüfe ob Pickup-Zeit in Rush Hour liegt
        const isRush = order.pickupTime ? isRushHourTime(order.pickupTime) : false;
        
        // Verwende Location-Werte: rushHourDisplaySeconds oder regularDisplaySeconds
        // Standard: 60 Sekunden (1 Minute) falls nicht konfiguriert
        const prepSeconds = isRush
          ? (activeLocation.rushHourDisplaySeconds ?? 60)
          : (activeLocation.regularDisplaySeconds ?? 60);

        totalSeconds += orderProduct.quantity * prepSeconds;
      }

      // Aufrunden zu Minuten
      return Math.ceil(totalSeconds / 60);
    };

    // Sammle gebuchte Zeiten UND blockierte Minuten (inkl. automatisch reservierte Slots)
    const booked = new Set<string>();
    const blockedMinutes = new Set<string>();
    
    orders.forEach((order: Order) => {
      if (order.pickupTime && order.status !== "CANCELLED") {
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
        if (orderDate === todayStr) {
          // Markiere Pickup-Zeit als gebucht
          booked.add(order.pickupTime);
          
          // Berechne blockierte Minuten für diese Bestellung
          const blockMinutes = calculateBlockedMinutesForOrder(order);
          
          // Markiere alle Minuten im blockierten Fenster [pickupTime, pickupTime + blockMinutes - 1]
          // Blockierung erfolgt NACH der Pickup-Zeit (Küche ist während und nach der Abholung blockiert)
          const pickupMinutes = timeToMinutes(order.pickupTime);
          for (let i = 0; i < blockMinutes; i++) {
            const blockedMinute = pickupMinutes + i;
            const blockedTimeStr = minutesToTime(blockedMinute);
            blockedMinutes.add(blockedTimeStr);
          }
          
          console.log(`[Header] Bestellung ${order.id}: pickupTime=${order.pickupTime}, blockMinutes=${blockMinutes}, blockiert: ${Array.from(blockedMinutes).filter(t => {
            const tMin = timeToMinutes(t);
            const pickupMin = timeToMinutes(order.pickupTime!);
            return tMin >= pickupMin - blockMinutes + 1 && tMin <= pickupMin;
          }).join(", ")}`);
        }
      }
    });
    
    console.log(`[Header] Gesamt gebuchte Zeiten heute: ${Array.from(booked).sort().join(", ")}`);
    console.log(`[Header] Gesamt blockierte Minuten heute: ${Array.from(blockedMinutes).sort().join(", ")}`);

    // Parse Öffnungszeiten
    const [openHour, openMinute] = dayConfig.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = dayConfig.closeTime.split(":").map(Number);
    const todayDate = new Date(now);
    todayDate.setHours(0, 0, 0, 0);
    const openTime = new Date(todayDate);
    openTime.setHours(openHour, openMinute, 0, 0);
    const closeTime = new Date(todayDate);
    closeTime.setHours(closeHour, closeMinute, 0, 0);
    
    const searchStartTime = new Date(now);
    searchStartTime.setSeconds(0, 0);
    const startTime = searchStartTime > openTime ? searchStartTime : openTime;
    
    if (startTime > closeTime) {
      setNextAvailableTime("");
      return;
    }

    // Finde nächste verfügbare Zeit
    const current = new Date(startTime);
    while (current <= closeTime) {
      const hours = current.getHours().toString().padStart(2, "0");
      const minutes = current.getMinutes().toString().padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;
      
      // Prüfe ob Zeit verfügbar ist (nicht gebucht UND nicht blockiert)
      if (current >= minAvailableTime && !booked.has(timeStr) && !blockedMinutes.has(timeStr)) {
        console.log(`[Header] ✅ Nächste verfügbare Zeit gefunden: ${timeStr}`);
        setNextAvailableTime(timeStr);
        return;
      }
      
      current.setMinutes(current.getMinutes() + 1);
    }
    
    setNextAvailableTime("");
  };

  useEffect(() => {
    const loadLocation = () => {
      const locations = getLocations();
      // Lade die erste aktive Location
      const activeLocation = locations.find((loc) => loc.status === true);
      if (activeLocation) {
        setLocation(activeLocation);
      }
    };

    // Lade beim ersten Render
    loadLocation();
    calculateNextAvailableTime();

    // Aktualisiere alle 5 Sekunden, um reservierte Slots zu berücksichtigen
    const interval = setInterval(() => {
      loadLocation();
      calculateNextAvailableTime();
    }, 5000);

    // Lade auch bei Storage-Änderungen (z.B. wenn im Admin geändert wird)
    const handleStorageChange = () => {
      loadLocation();
      calculateNextAvailableTime();
    };

    // Event-Listener für Storage-Änderungen
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentTime]);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">DENIS Kebap</h1>
          </div>
          <div className="flex items-center gap-4">
            {location && (
              <div className="text-sm text-gray-600 hidden md:block text-right">
                <div className="font-medium text-gray-900">{location.name}</div>
                <div>{formatOpeningHours(location)}</div>
                {nextAvailableTime && (
                  <div className="text-xs text-gray-500 mt-1">
                    Nächster Slot: <span className="font-semibold text-gray-900">{nextAvailableTime} Uhr</span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Warenkorb</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

