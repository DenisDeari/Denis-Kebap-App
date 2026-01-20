"use client";

import { Order } from "@/types";

interface OrderProductCellProps {
  products: Order["products"];
  type: "quantity" | "name" | "extras";
}

export function OrderProductCell({ products, type }: OrderProductCellProps) {
  if (!products || products.length === 0) {
    return <span className="text-gray-400">-</span>;
  }

  if (type === "quantity") {
    return (
      <>
        {products.map((p, idx) => (
          <div key={idx}>{p.quantity}</div>
        ))}
      </>
    );
  }

  if (type === "name") {
    return (
      <>
        {products.map((p, idx) => (
          <div key={idx} className="font-medium">
            {String(p.name || "").trim() || `[Produkt ${idx + 1}]`}
          </div>
        ))}
      </>
    );
  }

  // type === "extras"
  return (
    <>
      {products.map((p, idx) => {
        const parts: React.ReactNode[] = [];
        if (p.removedIngredients) {
          parts.push(
            <span key="removed" className="text-red-600">
              {p.removedIngredients}
            </span>
          );
        }
        if (p.extras) {
          parts.push(
            <span key="extras" className="text-green-600">
              {p.extras}
            </span>
          );
        }
        return (
          <div key={idx}>
            {parts.length > 0 ? (
              parts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < parts.length - 1 && ", "}
                </span>
              ))
            ) : (
              <span>-</span>
            )}
          </div>
        );
      })}
    </>
  );
}
