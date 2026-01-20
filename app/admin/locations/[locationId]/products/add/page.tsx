"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getMenus, getIngredients, getAddOns, addProduct } from "@/lib/storage";
import { Product, Menu, Ingredient, AddOn } from "@/types";

export default function AddProductPage() {
  const router = useRouter();
  const params = useParams();
  const locationId = params?.locationId as string;
  const [menus, setMenus] = useState<Menu[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [formData, setFormData] = useState({
    menuName: "",
    productName: "",
    productPrice: 6.6,
    tax: 10,
    showProductInApp: true,
    applicablePreparationTime: true,
    selectedIngredients: [] as string[],
    selectedAddOns: [] as string[],
  });

  useEffect(() => {
    async function loadData() {
      const [m, i, a] = await Promise.all([getMenus(), getIngredients(), getAddOns()]);
      setMenus(m);
      setIngredients(i);
      setAddOns(a);
    }
    loadData();
  }, []);

  const handleIngredientToggle = (ingredientId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.includes(ingredientId)
        ? prev.selectedIngredients.filter((id) => id !== ingredientId)
        : [...prev.selectedIngredients, ingredientId],
    }));
  };

  const handleAddOnToggle = (addOnId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedAddOns: prev.selectedAddOns.includes(addOnId)
        ? prev.selectedAddOns.filter((id) => id !== addOnId)
        : [...prev.selectedAddOns, addOnId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.menuName || !formData.productName) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: formData.productName,
      description: "",
      price: formData.productPrice,
      categoryId: formData.menuName,
      status: true,
      tax: formData.tax,
      applicablePreparationTime: formData.applicablePreparationTime,
      showInApp: formData.showProductInApp,
      ingredients: formData.selectedIngredients,
      addOns: formData.selectedAddOns,
    };

    await addProduct(newProduct);
    router.push(`/admin/locations/${locationId}/products`);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/admin/locations/${locationId}/products`}
          className="text-gray-600 hover:text-gray-900"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add Products Details</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu Name <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.menuName}
                onChange={(e) => setFormData({ ...formData, menuName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              >
                <option value="">Select Menu</option>
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Products Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  €
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.productPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, productPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-8 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        productPrice: formData.productPrice + 0.1,
                      })
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        productPrice: Math.max(0, formData.productPrice - 0.1),
                      })
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.tax}
                  onChange={(e) =>
                    setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  %
                </span>
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex flex-col">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        tax: formData.tax + 0.1,
                      })
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        tax: Math.max(0, formData.tax - 0.1),
                      })
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showProductInApp}
                onChange={(e) =>
                  setFormData({ ...formData, showProductInApp: e.target.checked })
                }
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <span className="text-sm font-medium text-gray-700">Show Product In App</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.applicablePreparationTime}
                onChange={(e) =>
                  setFormData({ ...formData, applicablePreparationTime: e.target.checked })
                }
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <span className="text-sm font-medium text-gray-700">Applicable Preparation Time</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Ingredients (Standard-Auswahl beim Kunden)
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                {ingredients.length === 0 ? (
                  <p className="text-sm text-gray-500">Keine Ingredients vorhanden</p>
                ) : (
                  ingredients.map((ingredient) => (
                    <label
                      key={ingredient.id}
                      className="flex items-center justify-between gap-4 py-3 px-3 cursor-pointer hover:bg-gray-50 rounded border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.selectedIngredients.includes(ingredient.id)}
                          onChange={() => handleIngredientToggle(ingredient.id)}
                          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {ingredient.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        {ingredient.price > 0 ? `€${ingredient.price.toFixed(2)}` : "€0,00"}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Add-Ons (Freiwillige Auswahl beim Kunden)
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                {addOns.length === 0 ? (
                  <p className="text-sm text-gray-500">Keine Add-Ons vorhanden</p>
                ) : (
                  addOns.map((addOn) => (
                    <label
                      key={addOn.id}
                      className="flex items-center justify-between gap-4 py-3 px-3 cursor-pointer hover:bg-gray-50 rounded border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.selectedAddOns.includes(addOn.id)}
                          onChange={() => handleAddOnToggle(addOn.id)}
                          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {addOn.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        €{addOn.price.toFixed(2)}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
}
