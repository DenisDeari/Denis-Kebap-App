"use client";

import { useState, useEffect, useRef } from "react";
import { getLocations, getOrdersAsync, getProducts } from "@/lib/storage";
import { Order } from "@/types";
import { CartItem } from "@/types";
import { useTime } from "@/components/TimeProvider";

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTime: (time: string) => void;
  selectedTime?: string;
  cartItems?: CartItem[];
}

export default function TimePickerModal({
  isOpen,
  onClose,
  onSelectTime,
  selectedTime,
  cartItems = [],
}: TimePickerModalProps) {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [unavailableTimes, setUnavailableTimes] = useState<Set<string>>(new Set());
  const [nextAvailableTime, setNextAvailableTime] = useState<string>("");
  const { currentTime } = useTime();
  const currentTimeRef = useRef(currentTime);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    if (!isOpen) return;

    // Hole aktive Location
    const locations = getLocations();
    const activeLocation = locations.find((loc) => loc.status === true);
    
    if (!activeLocation || !activeLocation.openDays) {
      setAvailableTimes([]);
      setUnavailableTimes(new Set());
      return;
    }

    // Hole aktuelle Bestellungen und Produkte (async für aktuelle reservierte Slots)
    const loadOrdersAndCalculate = async () => {
      const orders = await getOrdersAsync();
      const allProducts = getProducts();
      const now = currentTimeRef.current;
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

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

    // Berechne minimale verfügbare Zeit (aktuelle Zeit + bufferTime)
    const bufferMinutes = activeLocation.bufferTime || 8;
    const minAvailableTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);

    // Generiere verfügbare Zeiten basierend auf Öffnungszeiten
    const dayOfWeek = now.getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[dayOfWeek];
    
    if (!activeLocation.openDays) {
      setAvailableTimes([]);
      setUnavailableTimes(new Set());
      return;
    }
    
    const dayConfig = activeLocation.openDays.find((d) => d.day === currentDay);
    
    if (!dayConfig || !dayConfig.isOpen) {
      setAvailableTimes([]);
      setUnavailableTimes(new Set());
      return;
    }

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

    // Helper: Berechne blockierte Minuten für eine Bestellung
    const calculateBlockedMinutesForOrder = (order: Order): number => {
      let totalSeconds = 0;

      for (const orderProduct of order.products) {
        // Finde Produkt anhand des Namens
        const product = allProducts.find((p) => p.name === orderProduct.name);
        
        // ⚠️ WICHTIG: Überspringe Produkte ohne applicablePreparationTime
        if (!product || product.applicablePreparationTime === false) {
          continue; // Zählt nicht zur Blockierung!
        }

        // Prüfe ob Pickup-Zeit in Rush Hour liegt
        const isRush = order.pickupTime ? isRushHourTime(order.pickupTime) : false;
        
        // Verwende Location-Werte: rushHourDisplaySeconds oder regularDisplaySeconds
        const prepSeconds = isRush
          ? (activeLocation.rushHourDisplaySeconds ?? 0)
          : (activeLocation.regularDisplaySeconds ?? 0);

        // Nur wenn applicablePreparationTime === true
        totalSeconds += orderProduct.quantity * prepSeconds;
      }

      // Aufrunden zu Minuten
      const blockMinutes = Math.ceil(totalSeconds / 60);
      console.log(`[TIMESLOT CALC] 📊 Order ${order.id.slice(0, 8)}: ${totalSeconds}sec ÷ 60 = ${blockMinutes} minutes blocked`);
      console.log(`[TIMESLOT CALC] 💡 Location settings: rushHourDisplaySeconds=${activeLocation.rushHourDisplaySeconds}, regularDisplaySeconds=${activeLocation.regularDisplaySeconds}`);
      if (blockMinutes > 1) {
        console.log(`[TIMESLOT CALC] ⚠️  High prep time! Reduce rushHourDisplaySeconds/regularDisplaySeconds in location settings to block fewer slots.`);
      }
      return blockMinutes;
    };

    // Berechne blockierte Minuten für aktuellen Warenkorb für eine gegebene Zeit
    const calculateBlockedMinutesForCart = (testTime: string): number => {
      let totalSeconds = 0;
      
      // Prüfe ob die Zeit in Rush Hour liegt
      const isRush = isRushHourTime(testTime);
      
      // Verwende Location-Werte basierend auf Rush Hour Status
      const prepSeconds = isRush
        ? (activeLocation.rushHourDisplaySeconds ?? 0)
        : (activeLocation.regularDisplaySeconds ?? 0);

      for (const cartItem of cartItems) {
        // ⚠️ WICHTIG: Überspringe Produkte ohne applicablePreparationTime
        if (cartItem.product.applicablePreparationTime === false) {
          continue; // Zählt nicht zur Blockierung!
        }
        
        // Nur wenn applicablePreparationTime === true
        totalSeconds += cartItem.quantity * prepSeconds;
      }

      return Math.ceil(totalSeconds / 60);
    };

    // Parse Öffnungszeiten
    const [openHour, openMinute] = dayConfig.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = dayConfig.closeTime.split(":").map(Number);
    
    const todayDate = new Date(now);
    todayDate.setHours(0, 0, 0, 0);
    
    const openTime = new Date(todayDate);
    openTime.setHours(openHour, openMinute, 0, 0);
    
    const closeTime = new Date(todayDate);
    closeTime.setHours(closeHour, closeMinute, 0, 0);
    
    // Starte ab der aktuellen Zeit (auf volle Minute gerundet)
    const searchStartTime = new Date(now);
    searchStartTime.setSeconds(0, 0); // Auf volle Minute runden
    
    // Bestimme Startzeit: entweder aktuelle Zeit oder Öffnungszeit, wenn später
    const startTime = searchStartTime > openTime ? searchStartTime : openTime;
    
    // Prüfe ob startTime noch innerhalb der Öffnungszeiten liegt
    if (startTime > closeTime) {
      setAvailableTimes([]);
      setUnavailableTimes(new Set());
      return;
    }

    // Erstelle Set der bereits vergebenen Pickup-Zeiten (jede Uhrzeit kann nur einmal vergeben werden)
    const pickupTimes = new Set<string>();
    
    // Erstelle Set aller blockierten Minuten (inklusive nachfolgender Minuten basierend auf block_duration)
    const blockedMinutes = new Set<string>();

    console.log(`[TIMESLOT CALC] 🕐 Processing ${orders.length} orders for today (${todayStr})`);
    
    for (const order of orders) {
      if (!order.pickupTime || order.status === "CANCELLED") continue;

      const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
      if (orderDate !== todayStr) continue;

      // Markiere Pickup-Zeit als vergeben (einmalige Belegung pro Uhrzeit)
      pickupTimes.add(order.pickupTime);

      // Berechne blockierte Minuten für diese Bestellung
      const blockMinutes = calculateBlockedMinutesForOrder(order);
      
      console.log(`[TIMESLOT CALC] 📌 Order ${order.id.slice(0, 8)}: pickupTime=${order.pickupTime}, blockMinutes=${blockMinutes}`);
      
      // Markiere alle Minuten im blockierten Fenster [pickupTime - blockMinutes + 1, pickupTime]
      // WICHTIG: Blockierung erfolgt VOR der Pickup-Zeit (Küche braucht Vorbereitungszeit)
      // Beispiel: Bestellung bei 13:00 mit 5 Minuten → blockiert 12:56, 12:57, 12:58, 12:59, 13:00
      const pickupMinutes = timeToMinutes(order.pickupTime);
      const blockedSlots: string[] = [];
      for (let i = 0; i < blockMinutes; i++) {
        const blockedMinute = pickupMinutes - i;
        const blockedTimeStr = minutesToTime(blockedMinute);
        blockedMinutes.add(blockedTimeStr);
        blockedSlots.push(blockedTimeStr);
      }
      console.log(`[TIMESLOT CALC] 🚫 Blocked slots: ${blockedSlots.join(', ')}`);
    }
    
    console.log(`[TIMESLOT CALC] Summary: ${pickupTimes.size} pickup times, ${blockedMinutes.size} blocked minutes`);

    // Generiere Zeitslots im 1-Minuten-Intervall ab Startzeit
    const times: string[] = [];
    const unavailable = new Set<string>();
    const current = new Date(startTime);
    const closeMinutesTotal = timeToMinutes(dayConfig.closeTime);
    
    // Calculate minimum available time in minutes for buffer time check
    const minAvailableMinutes = minAvailableTime.getHours() * 60 + minAvailableTime.getMinutes();
    
    while (current <= closeTime) {
      const hours = current.getHours().toString().padStart(2, "0");
      const minutes = current.getMinutes().toString().padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;
      const currentMinutesTotal = timeToMinutes(timeStr);
      
      // Berechne benötigte Blockierungszeit für diesen Zeitslot
      const cartBlockMinutes = calculateBlockedMinutesForCart(timeStr);
      
      // Prüfe, ob dieser Zeitslot innerhalb der Buffer-Zeit liegt
      if (currentMinutesTotal < minAvailableMinutes) {
        unavailable.add(timeStr);
        console.log(`[TIMESLOT] ⚠️ ${timeStr}: UNAVAILABLE - within buffer time (min available: ${minutesToTime(minAvailableMinutes)})`);
      }
      // Wenn bereits als Pickup-Zeit vergeben, markiere als nicht verfügbar
      if (pickupTimes.has(timeStr)) {
        unavailable.add(timeStr);
        console.log(`[TIMESLOT] ❌ ${timeStr}: UNAVAILABLE - already booked as pickup time`);
      }
      // Wenn in einem blockierten Fenster, markiere als nicht verfügbar
      else if (blockedMinutes.has(timeStr)) {
        unavailable.add(timeStr);
        console.log(`[TIMESLOT] 🚫 ${timeStr}: UNAVAILABLE - in blocked preparation window`);
      }
      // Prüfe, ob alle benötigten Minuten verfügbar sind
      // WICHTIG: Blockierung erfolgt VOR der Pickup-Zeit (Vorbereitungszeit)
      else {
        // Prüfe, ob alle benötigten Minuten für diese Bestellung verfügbar sind
        // WICHTIG: Blockierung erfolgt RÜCKWÄRTS von der Pickup-Zeit
        // Für 5 Minuten Blockierung bei 13:00: prüfe 12:56, 12:57, 12:58, 12:59, 13:00
        let allMinutesAvailable = true;
        const openMinutesTotal = timeToMinutes(dayConfig.openTime);
        for (let i = 0; i < cartBlockMinutes; i++) {
          // Blockiere rückwärts: pickupTime - i
          // Beispiel: 13:00 mit 5 Minuten → prüft 13:00 (i=0), 12:59 (i=1), 12:58 (i=2), 12:57 (i=3), 12:56 (i=4)
          const checkMinutes = currentMinutesTotal - i;
          
          // Prüfe ob wir nicht vor Öffnungszeit gehen
          if (checkMinutes < openMinutesTotal || checkMinutes < 0) {
            allMinutesAvailable = false;
            break;
          }
          
          const checkTimeStr = minutesToTime(checkMinutes);
          
          // Prüfe ob diese Minute bereits als Pickup-Zeit vergeben ist
          // WICHTIG: Nur die Pickup-Zeit selbst (i=0) darf nicht bereits als Pickup-Zeit vergeben sein
          if (i === 0 && pickupTimes.has(checkTimeStr)) {
            allMinutesAvailable = false;
            break;
          }
          
          // Prüfe ob diese Minute in einem blockierten Fenster liegt
          if (blockedMinutes.has(checkTimeStr)) {
            allMinutesAvailable = false;
            break;
          }
        }
        
        if (!allMinutesAvailable) {
          unavailable.add(timeStr);
          console.log(`[TIMESLOT] ⚠️ ${timeStr}: UNAVAILABLE - cart needs ${cartBlockMinutes} minutes but window not fully available`);
        } else if (times.length < 20) {
          console.log(`[TIMESLOT] ✅ ${timeStr}: AVAILABLE - ${cartBlockMinutes} minute preparation window clear`);
        }
      }
      
      times.push(timeStr);
      current.setMinutes(current.getMinutes() + 1);
    }
    
    console.log(`[TIMESLOT CALC] 📊 Generated ${times.length} total slots, ${unavailable.size} unavailable`);
    
    setAvailableTimes(times);
    setUnavailableTimes(unavailable);
    
      // Berechne nächste verfügbare Zeit
      const nextAvailable = times.find((time) => !unavailable.has(time));
      setNextAvailableTime(nextAvailable || "");
      console.log(`[TIMESLOT CALC] 🎯 Next available time: ${nextAvailable || "NONE"}`);
    };

    loadOrdersAndCalculate();
    
    // Aktualisiere alle 5 Sekunden, um reservierte Slots zu berücksichtigen
    const interval = setInterval(loadOrdersAndCalculate, 5000);
    return () => clearInterval(interval);
  }, [isOpen, cartItems]);

  if (!isOpen) return null;

  const handleTimeSelect = (time: string) => {
    if (unavailableTimes.has(time)) return;
    onSelectTime(time);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold">Abholzeit</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Nächste verfügbare Zeit Info */}
          {nextAvailableTime && (
            <div className="bg-green-50 border-b border-green-200 px-6 py-3">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Nächste verfügbare Zeit:{" "}
                  <span className="font-bold text-green-700">{nextAvailableTime} Uhr</span>
                </span>
              </div>
            </div>
          )}

          {/* Time Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {availableTimes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Keine verfügbaren Zeiten für heute.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {availableTimes.map((time) => {
                  const isUnavailable = unavailableTimes.has(time);
                  const isSelected = selectedTime === time;

                  let buttonClass = "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ";
                  
                  if (isUnavailable) {
                    buttonClass += "bg-red-100 text-red-700 border-2 border-red-300 cursor-not-allowed";
                  } else if (isSelected) {
                    buttonClass += "bg-green-600 text-white border-2 border-green-700 shadow-md";
                  } else {
                    buttonClass += "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200 hover:border-gray-300";
                  }

                  return (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      disabled={isUnavailable}
                      className={buttonClass}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:scale-95 transition-all duration-150 font-semibold shadow-sm hover:shadow-md"
            >
              Bestätigen
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

