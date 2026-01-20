"use client";

import { useState, useEffect } from "react";
import { Product, Ingredient, AddOn } from "@/types";
import { getIngredients, getAddOns } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedIngredients: string[], selectedAddOns: string[], quantity: number) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && product) {
      setIngredients(getIngredients());
      setAddOns(getAddOns());
      // Standard-Ingredients vorauswählen
      setSelectedIngredients(product.ingredients || []);
      setSelectedAddOns([]);
      setQuantity(1);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleIngredientToggle = (ingredientId: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredientId)
        ? prev.filter((id) => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  // Verfügbare Ingredients (nur die, die im Admin für dieses Produkt ausgewählt wurden)
  const availableIngredients = ingredients.filter((ing) =>
    product.ingredients?.includes(ing.id) && ing.status !== false
  );

  // Verfügbare Add-Ons (nur die, die im Admin für dieses Produkt ausgewählt wurden)
  const availableAddOns = addOns.filter((addOn) =>
    product.addOns?.includes(addOn.id) && addOn.status !== false
  );

  const calculateTotal = () => {
    let total = product.price;
    
    // Add-On Preise hinzufügen
    selectedAddOns.forEach((addOnId) => {
      const addOn = addOns.find((a) => a.id === addOnId);
      if (addOn) {
        total += addOn.price;
      }
    });

    return total * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(product, selectedIngredients, selectedAddOns, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Draggable Handle */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-4 md:hidden"></div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Zutaten Section */}
          {availableIngredients.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Zutaten</h3>
              <div className="space-y-2">
                {availableIngredients.map((ingredient) => {
                  const isSelected = selectedIngredients.includes(ingredient.id);
                  return (
                    <label
                      key={ingredient.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={(e) => {
                        // Verhindere doppeltes Toggle wenn direkt auf Checkbox geklickt wird
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                          e.preventDefault();
                          handleIngredientToggle(ingredient.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleIngredientToggle(ingredient.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {ingredient.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {ingredient.price > 0 ? formatPrice(ingredient.price) : "€ 0,00"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Zusätzlich Section */}
          {availableAddOns.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Zusätzlich</h3>
              <div className="space-y-2">
                {availableAddOns.map((addOn) => {
                  const isSelected = selectedAddOns.includes(addOn.id);
                  return (
                    <label
                      key={addOn.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={(e) => {
                        // Verhindere doppeltes Toggle wenn direkt auf Checkbox geklickt wird
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                          e.preventDefault();
                          handleAddOnToggle(addOn.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleAddOnToggle(addOn.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {addOn.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatPrice(addOn.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector & Add Button */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 bg-gray-100 rounded-lg px-4 py-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
              >
                −
              </button>
              <span className="text-lg font-semibold text-gray-900 w-8 text-center">
              {quantity}
            </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
            >
              Artikel hinzufügen {formatPrice(calculateTotal())}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

