"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getIngredientById, updateIngredient } from "@/lib/storage";

export default function EditIngredientPage() {
  const router = useRouter();
  const params = useParams();
  const ingredientId = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
  });

  useEffect(() => {
    const loadIngredient = async () => {
      const ingredient = await getIngredientById(ingredientId);
      if (ingredient) {
        setFormData({
          name: ingredient.name,
          price: ingredient.price,
        });
      }
    };
    loadIngredient();
  }, [ingredientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert("Bitte geben Sie einen Namen ein.");
      return;
    }

    await updateIngredient(ingredientId, {
      name: formData.name,
      price: formData.price,
    });

    router.push("/admin/ingredients");
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/ingredients" className="text-gray-600 hover:text-gray-900">
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Ingredients</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                €
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            Save Ingredient
          </button>
        </div>
      </form>
    </div>
  );
}

