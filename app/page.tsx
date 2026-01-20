"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Navigation from "@/components/Navigation";
import MenuList from "@/components/MenuList";
import ShoppingCart from "@/components/ShoppingCart";
import ProductDetailModal from "@/components/ProductDetailModal";
import { Product, CartItem, Menu, Order } from "@/types";
import { getProducts, getMenus, addOrder, getAddOns, getIngredients, getOrdersAsync, updateOrder, getLocations } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { useTime } from "@/components/TimeProvider";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const { currentTime } = useTime();

  useEffect(() => {
    const allProducts = getProducts();
    setProducts(allProducts);
    const allMenus = getMenus();
    // Nur Menüs mit status: true anzeigen
    const activeMenus = allMenus.filter((menu) => menu.status === true);
    setMenus(activeMenus);
    if (activeMenus.length > 0) {
      // Setze selectedCategory nur wenn noch keine gesetzt ist
      setSelectedCategory((prev) => prev || activeMenus[0].id);
    }
  }, []);

  // Funktion zum Finden des nächsten freien Timeslots
  const findNextAvailableTimeSlot = useCallback(async (currentPickupTime: string, allOrders: Order[]): Promise<string | null> => {
    const locations = getLocations();
    const activeLocation = locations.find((loc) => loc.status === true);
    
    if (!activeLocation || !activeLocation.openDays) {
      return null;
    }

    const now = currentTime;
    const todayStr = now.toISOString().split("T")[0];
    const bufferMinutes = activeLocation.bufferTime || 8;
    const minAvailableTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);

    const dayOfWeek = now.getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[dayOfWeek];
    const dayConfig = activeLocation.openDays.find((d) => d.day === currentDay);
    
    if (!dayConfig || !dayConfig.isOpen) {
      return null;
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
        const prepSeconds = isRush
          ? (activeLocation.rushHourDisplaySeconds ?? 0)
          : (activeLocation.regularDisplaySeconds ?? 0);

        totalSeconds += orderProduct.quantity * prepSeconds;
      }

      // Aufrunden zu Minuten
      return Math.ceil(totalSeconds / 60);
    };

    // Sammle gebuchte Zeiten UND blockierte Minuten (heute, nicht storniert)
    const booked = new Set<string>();
    const blockedMinutes = new Set<string>();
    
    allOrders.forEach((order: Order) => {
      if (order.pickupTime && order.status !== "CANCELLED" && order.id) {
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
        if (orderDate === todayStr) {
          // Markiere Pickup-Zeit als gebucht
          booked.add(order.pickupTime);
          
          // Berechne blockierte Minuten für diese Bestellung
          const blockMinutes = calculateBlockedMinutesForOrder(order);
          
          // Markiere alle Minuten im blockierten Fenster [pickupTime, pickupTime + blockMinutes - 1]
          // Blockierung erfolgt NACH der Pickup-Zeit
          const pickupMinutes = timeToMinutes(order.pickupTime);
          for (let i = 0; i < blockMinutes; i++) {
            const blockedMinute = pickupMinutes + i;
            const blockedTimeStr = minutesToTime(blockedMinute);
            blockedMinutes.add(blockedTimeStr);
          }
        }
      }
    });

    console.log(`[findNextAvailableTimeSlot] Gebuchte Zeiten: ${Array.from(booked).sort().join(", ")}`);
    console.log(`[findNextAvailableTimeSlot] Blockierte Minuten: ${Array.from(blockedMinutes).sort().slice(0, 20).join(", ")}...`);

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
      return null;
    }

    // Finde nächste verfügbare Zeit (nicht gebucht UND nicht blockiert)
    const current = new Date(startTime);
    while (current <= closeTime) {
      const hours = current.getHours().toString().padStart(2, "0");
      const minutes = current.getMinutes().toString().padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;
      
      // Prüfe ob Zeit verfügbar ist (nicht gebucht UND nicht blockiert)
      if (current >= minAvailableTime && !booked.has(timeStr) && !blockedMinutes.has(timeStr)) {
        console.log(`[findNextAvailableTimeSlot] ✅ Nächste verfügbare Zeit: ${timeStr}`);
        return timeStr;
      }
      
      current.setMinutes(current.getMinutes() + 1);
    }
    
    return null;
  }, []);

  // Funktion zum Reservieren des nächsten freien Timeslots für überfällige Bestellungen
  const checkAndReserveTimeSlots = useCallback(async () => {
    try {
      let allOrders = await getOrdersAsync();
      const now = currentTime;
      const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      // Konvertiere aktuelle Zeit zu Minuten
      const [currentHours, currentMins] = currentTimeStr.split(":").map(Number);
      const currentTotalMins = currentHours * 60 + currentMins;

      console.log(`[Kunden-Seite] [Timeslot-Reservierung] Aktuelle Zeit: ${currentTimeStr} (${currentTotalMins} Minuten)`);
      console.log(`[Kunden-Seite] [Timeslot-Reservierung] Prüfe ${allOrders.length} Bestellungen...`);

      let hasChanges = false;
      let maxIterations = 50;
      let iteration = 0;
      const todayStr = now.toISOString().split("T")[0];

      // Fortlaufend prüfen und reservieren, bis alle Bestellungen einen zukünftigen Slot haben
      while (iteration < maxIterations) {
        iteration++;
        
        // Finde überfällige PENDING Bestellungen (aktuelle Zeit > pickupTime)
        // WICHTIG: Prüfe auch Bestellungen von anderen Tagen, wenn sie heute überfällig sind
        const overdueOrders = allOrders.filter((order) => {
          if (order.status !== "PENDING" || !order.pickupTime) {
            return false;
          }
          
          const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
          const [orderHours, orderMins] = order.pickupTime.split(":").map(Number);
          const orderTotalMins = orderHours * 60 + orderMins;
          
          // Prüfe ob Bestellung überfällig ist
          // Wenn Bestellung von heute ist: aktuelle Zeit > pickupTime
          // Wenn Bestellung von gestern/älter ist: immer überfällig (wenn PENDING)
          let isOverdue = false;
          if (orderDate === todayStr) {
            // Bestellung von heute: prüfe ob aktuelle Zeit > pickupTime
            isOverdue = currentTotalMins > orderTotalMins;
          } else {
            // Bestellung von gestern oder älter: immer überfällig wenn PENDING
            isOverdue = true;
          }
          
          if (isOverdue) {
            console.log(`[Kunden-Seite] [Timeslot-Reservierung] Überfällige Bestellung gefunden: ${order.id}, pickupTime: ${order.pickupTime} (${orderTotalMins} Min), Status: ${order.status}, Datum: ${orderDate}, Heute: ${todayStr}`);
          }
          
          return isOverdue;
        });

        console.log(`[Kunden-Seite] [Timeslot-Reservierung] Iteration ${iteration}: ${overdueOrders.length} überfällige Bestellungen gefunden`);

        // Wenn keine überfälligen Bestellungen mehr vorhanden sind, sind wir fertig
        if (overdueOrders.length === 0) {
          console.log(`[Kunden-Seite] [Timeslot-Reservierung] Keine überfälligen Bestellungen mehr - fertig`);
          break;
        }

        // Reserviere den nächsten freien Timeslot für jede überfällige Bestellung
        let iterationHasChanges = false;
        for (const order of overdueOrders) {
          console.log(`[Kunden-Seite] [Timeslot-Reservierung] Suche nächsten freien Slot für Bestellung ${order.id} (aktuell: ${order.pickupTime})`);
          const nextSlot = await findNextAvailableTimeSlot(order.pickupTime!, allOrders);
          if (nextSlot && nextSlot !== order.pickupTime) {
            console.log(`[Kunden-Seite] [Timeslot-Reservierung] ✅ Bestellung ${order.id}: Reserviere nächsten freien Timeslot ${nextSlot} (vorher: ${order.pickupTime})`);
            // Reserviere den Timeslot durch Aktualisierung der pickupTime
            await updateOrder(order.id, { pickupTime: nextSlot });
            // Aktualisiere allOrders für nächste Iteration
            const index = allOrders.findIndex(o => o.id === order.id);
            if (index !== -1) {
              allOrders[index] = { ...allOrders[index], pickupTime: nextSlot };
            }
            iterationHasChanges = true;
            hasChanges = true;
          } else if (!nextSlot) {
            console.log(`[Kunden-Seite] [Timeslot-Reservierung] ⚠️ Bestellung ${order.id}: Kein freier Timeslot mehr verfügbar`);
          } else {
            console.log(`[Kunden-Seite] [Timeslot-Reservierung] ℹ️ Bestellung ${order.id}: Slot ${nextSlot} ist bereits reserviert`);
          }
        }

        // Wenn in dieser Iteration keine Änderungen vorgenommen wurden, breche ab
        if (!iterationHasChanges) {
          console.log(`[Kunden-Seite] [Timeslot-Reservierung] Keine Änderungen in Iteration ${iteration} - breche ab`);
          break;
        }

        // Lade Bestellungen neu, um aktuelle Daten zu haben
        allOrders = await getOrdersAsync();
      }

      if (hasChanges) {
        console.log(`[Kunden-Seite] [Timeslot-Reservierung] ✅ Änderungen vorgenommen`);
      } else {
        console.log(`[Kunden-Seite] [Timeslot-Reservierung] ℹ️ Keine Änderungen notwendig`);
      }
    } catch (error) {
      console.error("[Kunden-Seite] [Timeslot-Reservierung] ❌ Fehler beim Reservieren von Timeslots:", error);
    }
  }, [findNextAvailableTimeSlot]);

  // Prüfe alle 10 Sekunden und reserviere nächste freie Timeslots für überfällige Bestellungen
  useEffect(() => {
    console.log("[Kunden-Seite] Starte automatische Timeslot-Reservierung...");
    checkAndReserveTimeSlots();
    const interval = setInterval(() => {
      console.log("[Kunden-Seite] Prüfe auf überfällige Bestellungen...");
      checkAndReserveTimeSlots();
    }, 10000); // Alle 10 Sekunden
    return () => {
      console.log("[Kunden-Seite] Stoppe automatische Timeslot-Reservierung...");
      clearInterval(interval);
    };
  }, [checkAndReserveTimeSlots]);

  const filteredProducts = selectedCategory
    ? products.filter(
        (product) => 
          product.categoryId === selectedCategory && 
          (product.status === undefined || product.status === true) && 
          (product.showInApp === undefined || product.showInApp === true)
      )
    : [];

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddToCart = (
    product: Product,
    selectedIngredients: string[],
    selectedAddOns: string[],
    quantity: number
  ) => {
    // Erstelle eine Kopie des Produkts mit Customization-Daten
    const customizedProduct: Product = {
      ...product,
      ingredients: selectedIngredients,
      addOns: selectedAddOns,
    };

    setCartItems((prevItems) => {
      // Prüfe, ob bereits ein identisches Produkt im Warenkorb ist
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.product.ingredients) === JSON.stringify(selectedIngredients) &&
          JSON.stringify(item.product.addOns) === JSON.stringify(selectedAddOns)
      );

      if (existingItemIndex >= 0) {
        // Erhöhe die Menge des existierenden Items
        return prevItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Füge neues Item hinzu
        return [...prevItems, { product: customizedProduct, quantity }];
      }
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleCheckout = async (pickupTime: string) => {
    if (cartItems.length === 0) return;

    const addOns = getAddOns();
    const ingredients = getIngredients();
    const allProducts = getProducts();
    
    // Berechne Gesamtpreis
    const totalPrice = cartItems.reduce((sum, item) => {
      let itemPrice = item.product.price;
      if (item.product.addOns && item.product.addOns.length > 0) {
        item.product.addOns.forEach((addOnId) => {
          const addOn = addOns.find((a) => a.id === addOnId);
          if (addOn) {
            itemPrice += addOn.price;
          }
        });
      }
      return sum + itemPrice * item.quantity;
    }, 0);

    // Erstelle Produktliste mit Add-Ons als extras und entfernten Ingredients
    const products = cartItems.map((item) => {
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

      // Add-Ons als extras
      const extras: string[] = [];
      if (item.product.addOns && item.product.addOns.length > 0) {
        item.product.addOns.forEach((addOnId) => {
          const addOn = addOns.find((a) => a.id === addOnId);
          if (addOn) {
            extras.push(addOn.name);
          }
        });
      }

      return {
        name: item.product.name,
        quantity: item.quantity,
        extras: extras.length > 0 ? extras.join(", ") : undefined,
        removedIngredients: removedIngredientNames.length > 0 ? removedIngredientNames.join(", ") : undefined,
      };
    });

    // Hole aktive Location ID
    const locations = getLocations();
    const activeLocation = locations.find(l => l.status === true);

    // Erstelle Bestellung
    const now = currentTime;
    const order: Order = {
      id: generateId(),
      contact: "Kunde", // Könnte später durch ein Formular ergänzt werden
      time: now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", hour12: false }),
      pickupTime: pickupTime,
      products: products,
      price: totalPrice,
      paymentStatus: "Unpaid",
      status: "PENDING",
      createdAt: now.toISOString(),
      locationId: activeLocation?.id,
    };

    console.log('[ORDER PLACEMENT] 📦 Creating new order:', {
      orderId: order.id,
      pickupTime: order.pickupTime,
      createdAt: order.createdAt,
      locationId: order.locationId,
      productCount: order.products.length,
      totalPrice: order.price
    });

    // Speichere Bestellung
    await addOrder(order);
    console.log('[ORDER PLACEMENT] ✅ Order saved successfully');

    // Leere Warenkorb
    setCartItems([]);
    setIsCartOpen(false);

    // Zeige Bestätigung
    alert(`Bestellung erfolgreich aufgegeben!\nAbholzeit: ${pickupTime}\nGesamtpreis: €${totalPrice.toFixed(2).replace(".", ",")}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartItems={cartItems} onCartClick={() => setIsCartOpen(true)} />
      <Hero />
      
      <div className="bg-white">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
            Herzlich Willkommen! 👋
          </h2>
          <Navigation
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={menus.map((m) => ({ id: m.id, name: m.name }))}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <MenuList products={filteredProducts} onProductClick={handleProductClick} />
      </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
