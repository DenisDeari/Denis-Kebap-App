"use client";

import { useState, useEffect } from "react";
import { CartItem, Product } from "@/types";
import { getAddOns, getProducts, getIngredients, getLocations, getOrdersAsync } from "@/lib/storage";
import { Order } from "@/types";
import TimePickerModal from "./TimePickerModal";

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onCheckout: (pickupTime: string) => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
}: ShoppingCartProps) {
  const [addOns, setAddOns] = useState(getAddOns());
  const [ingredients, setIngredients] = useState(getIngredients());
  const [allProducts, setAllProducts] = useState(getProducts());
  const [selectedPickupTime, setSelectedPickupTime] = useState<string | undefined>(undefined);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [nextAvailableTime, setNextAvailableTime] = useState<string>("");

  useEffect(() => {
    setAddOns(getAddOns());
    setIngredients(getIngredients());
    setAllProducts(getProducts());
    if (isOpen) {
      calculateNextAvailableTime();
      // Aktualisiere alle 5 Sekunden, um reservierte Slots zu berücksichtigen
      const interval = setInterval(calculateNextAvailableTime, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Setze selectedPickupTime zurück, wenn Warenkorb leer ist (z.B. nach Checkout)
  useEffect(() => {
    if (cartItems.length === 0) {
      setSelectedPickupTime(undefined);
    }
  }, [cartItems]);

  const calculateNextAvailableTime = async () => {
    const locations = getLocations();
    const activeLocation = locations.find((loc) => loc.status === true);
    
    if (!activeLocation || !activeLocation.openDays) {
      setNextAvailableTime("");
      return;
    }

    // Verwende getOrdersAsync() um aktuelle Bestellungen (inkl. reservierte Slots) zu holen
    const orders = await getOrdersAsync();
    const now = new Date();
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

    // Hole Produkte für Blockierungszeit-Berechnung
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
          
          console.log(`[ShoppingCart] Bestellung ${order.id}: pickupTime=${order.pickupTime}, blockMinutes=${blockMinutes}`);
        }
      }
    });
    
    console.log(`[ShoppingCart] Gesamt gebuchte Zeiten heute: ${Array.from(booked).sort().join(", ")}`);
    console.log(`[ShoppingCart] Gesamt blockierte Minuten heute: ${Array.from(blockedMinutes).sort().join(", ")}`);

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
        console.log(`[ShoppingCart] ✅ Nächste verfügbare Zeit gefunden: ${timeStr}`);
        setNextAvailableTime(timeStr);
        return;
      }
      
      current.setMinutes(current.getMinutes() + 1);
    }
    
    setNextAvailableTime("");
  };

  const calculateItemTotal = (item: CartItem): number => {
    let itemPrice = item.product.price;
    
    // Add-On Preise hinzufügen
    if (item.product.addOns && item.product.addOns.length > 0) {
      item.product.addOns.forEach((addOnId) => {
        const addOn = addOns.find((a) => a.id === addOnId);
        if (addOn) {
          itemPrice += addOn.price;
        }
      });
    }

    return itemPrice * item.quantity;
  };

  const total = cartItems.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );

  const formatPrice = (price: number) => {
    return `€ ${price.toFixed(2).replace(".", ",")}`;
  };

  const handleCheckoutClick = () => {
    if (!selectedPickupTime) {
      setIsTimePickerOpen(true);
      return;
    }
    onCheckout(selectedPickupTime);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      ></div>

      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Warenkorb</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 transition-colors"
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

          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Ihr Warenkorb ist leer.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.product.id}-${JSON.stringify(item.product.addOns)}-${index}`}
                    className="border-b border-gray-200 pb-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.product.name}
                        </h3>
                        {(() => {
                          // Hole Original-Produktdaten
                          const originalProduct = allProducts.find((p) => p.id === item.product.id);
                          const defaultIngredients = originalProduct?.ingredients || [];
                          const selectedIngredients = item.product.ingredients || [];
                          
                          // Berechne entfernte Ingredients (Standard - Ausgewählt)
                          const removedIngredientIds = defaultIngredients.filter(
                            (id) => !selectedIngredients.includes(id)
                          );
                          const removedIngredientNames = removedIngredientIds
                            .map((id) => {
                              const ingredient = ingredients.find((ing) => ing.id === id);
                              return ingredient?.name;
                            })
                            .filter((name): name is string => !!name);

                          // Add-On Namen
                          const addOnNames = item.product.addOns
                            ? item.product.addOns
                                .map((addOnId) => {
                                  const addOn = addOns.find((a) => a.id === addOnId);
                                  return addOn ? addOn.name : null;
                                })
                                .filter((name): name is string => !!name)
                            : [];

                          const hasRemovedIngredients = removedIngredientNames.length > 0;
                          const hasAddOns = addOnNames.length > 0;

                          if (!hasRemovedIngredients && !hasAddOns) {
                            return null;
                          }

                          return (
                            <div className="mt-2 text-xs space-y-1">
                              {hasRemovedIngredients && (
                                <div className="text-red-600">
                                  {removedIngredientNames.join(", ")}
                                </div>
                              )}
                              {hasAddOns && (
                                <div className="text-green-600">
                                  {addOnNames.join(", ")}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.product.id,
                              Math.max(0, item.quantity - 1)
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.product.id,
                              item.quantity + 1
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(calculateItemTotal(item))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Abholzeit Auswahl */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                {nextAvailableTime && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-green-600"
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
                      <span className="text-xs font-medium text-gray-700">
                        Nächste verfügbare Zeit:{" "}
                        <span className="font-bold text-green-700">{nextAvailableTime} Uhr</span>
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Abholzeit:
                  </span>
                  <button
                    onClick={() => setIsTimePickerOpen(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPickupTime
                        ? "bg-green-100 text-green-700 border-2 border-green-300"
                        : "bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {selectedPickupTime || "Zeit auswählen"}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900">
                    Gesamt:
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(total)}
                  </span>
                </div>
                <button 
                  onClick={handleCheckoutClick}
                  disabled={cartItems.length === 0 || !selectedPickupTime}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:scale-95 transition-all duration-150 font-semibold shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Zahlungspflichtig bestellen
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Time Picker Modal */}
      <TimePickerModal
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        onSelectTime={setSelectedPickupTime}
        selectedTime={selectedPickupTime}
        cartItems={cartItems}
      />
    </>
  );
}

