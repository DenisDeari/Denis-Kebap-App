import { Order, Location } from "@/types";

/**
 * Konvertiert Zeit-String (HH:MM) zu Gesamtminuten
 */
function timeToMinutes(timeStr: string): number {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
}

/**
 * Konvertiert Gesamtminuten zu Zeit-String (HH:MM)
 */
function minutesToTime(totalMins: number): string {
  const hours = Math.floor(totalMins / 60) % 24;
  const mins = totalMins % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Berechnet die blockierten Minuten für eine Bestellung basierend auf Location-Einstellungen
 */
export function calculateBlockedMinutesForOrder(order: Order, location: Location): number {
  // Summe der Sekunden für alle Produkte mit applicablePreparationTime
  let totalSeconds = 0;
  
  // Standard-Werte falls nicht gesetzt
  const prepSeconds = location.rushHourDisplaySeconds ?? 90;
  
  for (const item of order.products) {
    // Produkte ohne applicablePreparationTime werden übersprungen
    // Da wir die Produktdetails nicht haben, nehmen wir an dass alle Produkte zählen
    // außer "System Blocker"
    if (item.name === "System Blocker") continue;
    totalSeconds += item.quantity * prepSeconds;
  }
  
  return Math.ceil(totalSeconds / 60);
}

/**
 * Findet den nächsten verfügbaren Timeslot basierend auf Öffnungszeiten und gebuchten Zeiten
 * WICHTIG: Berücksichtigt auch die Vorbereitungszeit VOR jeder Bestellung!
 */
export async function findNextAvailableTimeSlot(
  locationId: string,
  allOrders: Order[],
  getLocations: () => Promise<Location[]>,
  referenceDate?: Date
): Promise<string | null> {
  const locations = await getLocations();
  const activeLocation = locations.find((loc) => loc.id === locationId);
  
  if (!activeLocation || !activeLocation.openDays) {
    return null;
  }

  const now = referenceDate ? new Date(referenceDate) : new Date();
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

  // Sammle gebuchte Pickup-Zeiten UND blockierte Vorbereitungsminuten
  const blockedMinutes = new Set<string>();
  
  allOrders.forEach((order: Order) => {
    if (order.status === "CANCELLED" || !order.pickupTime) return;
    
    const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
    if (orderDate !== todayStr) return;
    
    // Die pickupTime selbst ist belegt
    blockedMinutes.add(order.pickupTime);
    
    // Berechne blockierte Minuten VOR der pickupTime (Vorbereitungszeit)
    const blockMins = calculateBlockedMinutesForOrder(order, activeLocation);
    const pickupTotalMins = timeToMinutes(order.pickupTime);
    
    // Blockiere Minuten VOR der pickupTime
    // Beispiel: pickupTime 13:35, blockMins 10 → blockiert 13:26 bis 13:35
    for (let i = 1; i < blockMins; i++) {
      const blockedMinute = pickupTotalMins - i;
      if (blockedMinute >= 0) {
        blockedMinutes.add(minutesToTime(blockedMinute));
      }
    }
  });

  // Parse Öffnungszeiten
  const [openHour, openMinute] = dayConfig.openTime.split(":").map(Number);
  const [closeHour, closeMinute] = dayConfig.closeTime.split(":").map(Number);
  const todayDate = new Date(now);
  todayDate.setHours(0, 0, 0, 0);
  const openTime = new Date(todayDate);
  openTime.setHours(openHour, openMinute, 0, 0);
  const closeTime = new Date(todayDate);
  closeTime.setHours(closeHour, closeMinute, 0, 0);
  
  const currentTime = new Date(now);
  currentTime.setSeconds(0, 0);
  const startTime = currentTime > openTime ? currentTime : openTime;
  
  if (startTime > closeTime) {
    return null;
  }

  // Finde nächste verfügbare Zeit
  const current = new Date(startTime);
  while (current <= closeTime) {
    const hours = current.getHours().toString().padStart(2, "0");
    const minutes = current.getMinutes().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;
    
    // Prüfe ob Zeit verfügbar ist (nicht in blockedMinutes)
    if (current >= minAvailableTime && !blockedMinutes.has(timeStr)) {
      return timeStr;
    }
    
    current.setMinutes(current.getMinutes() + 1);
  }
  
  return null;
}

/**
 * Sortiert Bestellungen nach Abholzeit (aufsteigend)
 */
export function sortByPickupTimeAsc(a: Order, b: Order): number {
  const timeA = a.pickupTime || a.time || "00:00";
  const timeB = b.pickupTime || b.time || "00:00";
  const [hoursA, minsA] = timeA.split(":").map(Number);
  const [hoursB, minsB] = timeB.split(":").map(Number);
  const totalMinsA = (hoursA || 0) * 60 + (minsA || 0);
  const totalMinsB = (hoursB || 0) * 60 + (minsB || 0);
  return totalMinsA - totalMinsB;
}

/**
 * Sortiert Bestellungen nach Abholzeit (absteigend)
 */
export function sortByPickupTimeDesc(a: Order, b: Order): number {
  return -sortByPickupTimeAsc(a, b);
}
