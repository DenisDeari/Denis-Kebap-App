import { Location } from "@/types";

export const formatPrice = (price: number): string => {
  return `€ ${price.toFixed(2).replace(".", ",")}`;
};

export const formatDate = (date: string | Date): string => {
  if (typeof date === "string") {
    return date;
  }
  return date.toLocaleDateString("de-DE");
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatOpeningHours = (location: Location): string => {
  if (location.openDays && location.openDays.length > 0) {
    // Gruppiere Tage mit gleichen Öffnungszeiten
    const dayAbbr: { [key: string]: string } = {
      Monday: "Mo",
      Tuesday: "Di",
      Wednesday: "Mi",
      Thursday: "Do",
      Friday: "Fr",
      Saturday: "Sa",
      Sunday: "So",
    };

    const openDays = location.openDays.filter((day) => day.isOpen);
    if (openDays.length === 0) return "";

    // Gruppiere nach Öffnungszeiten
    const groups: { [key: string]: string[] } = {};
    openDays.forEach((day) => {
      const timeKey = `${day.openTime}-${day.closeTime}`;
      if (!groups[timeKey]) {
        groups[timeKey] = [];
      }
      groups[timeKey].push(dayAbbr[day.day] || day.day);
    });

    // Formatiere Gruppen
    const formattedGroups = Object.entries(groups)
      .map(([timeKey, days]) => {
        const [openTime, closeTime] = timeKey.split("-");
        const timeStr = `${openTime.slice(0, 5)}-${closeTime.slice(0, 5)}`;
        if (days.length === 1) {
          return `${days[0]}: ${timeStr}`;
        } else {
          return `${days[0]}-${days[days.length - 1]}: ${timeStr}`;
        }
      })
      .join(" | ");

    return formattedGroups;
  }
  // Fallback zu address, falls keine openDays vorhanden
  return location.address;
};

