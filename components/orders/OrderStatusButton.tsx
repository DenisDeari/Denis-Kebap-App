"use client";

import { useRef } from "react";
import { Order } from "@/types";

interface OrderStatusButtonProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: Order["status"]) => void;
  onLongPress: (orderId: string, orderTime: string, orderContact: string) => void;
}

export function OrderStatusButton({ order, onStatusChange, onLongPress }: OrderStatusButtonProps) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      onLongPress(order.id, order.time, order.contact);
      longPressTimer.current = null;
    }, 3000);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      return;
    }
    onStatusChange(order.id, "READY");
  };

  if (order.status === "CANCELLED") {
    return <span className="text-red-600 font-semibold">STORNIERT</span>;
  }

  return (
    <button
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onClick={handleClick}
      className="text-green-600 hover:text-green-800 text-lg font-semibold"
    >
      ✓
    </button>
  );
}
