"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addLocation } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { Location } from "@/types";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AddLocationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    tagLine: "",
    orderReadyIn: 7,
    orderCancelBefore: 8,
    bufferTime: 8,
    rushHourDisplaySeconds: 0,
    regularDisplaySeconds: 0,
    openDays: daysOfWeek.map((day) => ({
      day,
      isOpen: day !== "Sunday",
      openTime: "11:00",
      rushStart: "11:15",
      rushEnd: "14:00",
      closeTime: day === "Saturday" ? "15:00" : "19:00",
    })),
  });

  const handleDayToggle = (dayIndex: number) => {
    const newOpenDays = [...formData.openDays];
    newOpenDays[dayIndex].isOpen = !newOpenDays[dayIndex].isOpen;
    setFormData({ ...formData, openDays: newOpenDays });
  };

  const handleDayTimeChange = (
    dayIndex: number,
    field: "openTime" | "rushStart" | "rushEnd" | "closeTime",
    value: string
  ) => {
    const newOpenDays = [...formData.openDays];
    newOpenDays[dayIndex][field] = value;
    setFormData({ ...formData, openDays: newOpenDays });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert("Bitte geben Sie einen Namen ein.");
      return;
    }

    const newLocation: Location = {
      id: generateId(),
      name: formData.name,
      address: formData.address,
      tagLine: formData.tagLine,
      orderReadyIn: formData.orderReadyIn,
      orderCancelBefore: formData.orderCancelBefore,
      bufferTime: formData.bufferTime,
      rushHourDisplaySeconds: formData.rushHourDisplaySeconds,
      regularDisplaySeconds: formData.regularDisplaySeconds,
      status: true,
      openDays: formData.openDays,
    };

    addLocation(newLocation);
    router.push("/admin/locations");
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/locations" className="text-gray-600 hover:text-gray-900">
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
        <h1 className="text-3xl font-bold text-gray-900">Add Location</h1>
      </div>

      <form onSubmit={handleSubmit} lang="de" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Location Name <span className="text-red-500">*</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Location Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tag Line</label>
            <input
              type="text"
              value={formData.tagLine}
              onChange={(e) => setFormData({ ...formData, tagLine: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Ready In <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.orderReadyIn}
                  onChange={(e) =>
                    setFormData({ ...formData, orderReadyIn: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Min
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Cancel Before <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.orderCancelBefore}
                  onChange={(e) =>
                    setFormData({ ...formData, orderCancelBefore: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Min
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buffer Time for Orders <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.bufferTime}
                  onChange={(e) =>
                    setFormData({ ...formData, bufferTime: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Min
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rush Hour Display Seconds <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.rushHourDisplaySeconds}
                  onChange={(e) =>
                    setFormData({ ...formData, rushHourDisplaySeconds: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Sek
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regular Display Seconds <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.regularDisplaySeconds}
                  onChange={(e) =>
                    setFormData({ ...formData, regularDisplaySeconds: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Sek
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Select Open Days</label>
            <div className="space-y-3">
              {formData.openDays.map((dayData, index) => (
                <div key={dayData.day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={dayData.isOpen}
                    onChange={() => handleDayToggle(index)}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="w-24 text-sm font-medium text-gray-700">{dayData.day}</span>
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Open Time:</label>
                      <input
                        type="time"
                        step="1"
                        value={dayData.openTime}
                        onChange={(e) => handleDayTimeChange(index, "openTime", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        disabled={!dayData.isOpen}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Rush Start:</label>
                      <input
                        type="time"
                        step="1"
                        value={dayData.rushStart}
                        onChange={(e) => handleDayTimeChange(index, "rushStart", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        disabled={!dayData.isOpen}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Rush End:</label>
                      <input
                        type="time"
                        value={dayData.rushEnd}
                        onChange={(e) => handleDayTimeChange(index, "rushEnd", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        disabled={!dayData.isOpen}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Close Time:</label>
                      <input
                        type="time"
                        step="1"
                        value={dayData.closeTime}
                        onChange={(e) => handleDayTimeChange(index, "closeTime", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        disabled={!dayData.isOpen}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            Save Branch Location
          </button>
        </div>
      </form>
    </div>
  );
}

