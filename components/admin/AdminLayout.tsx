"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getLocations } from "@/lib/storage";
import { type Location } from "@/types";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const loadLocations = () => {
      try {
        const allLocations = getLocations();
        setLocations(allLocations);
        // Setze erste aktive Location als Standard
        const active = allLocations.find((loc) => loc.status === true);
        if (active) {
          setActiveLocation(active);
        } else if (allLocations.length > 0) {
          // Falls keine aktive Location, aber Locations vorhanden: Setze erste als Standard
          setActiveLocation(allLocations[0]);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Locations:", error);
        // Stelle sicher, dass mindestens eine Location existiert
        const fallbackLocations = getLocations();
        setLocations(fallbackLocations);
        if (fallbackLocations.length > 0) {
          setActiveLocation(fallbackLocations[0]);
        }
      }
    };
    
    loadLocations();
    
    // Lade auch bei Storage-Änderungen
    const handleStorageChange = () => {
      loadLocations();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Polling als Fallback (prüfe alle 2 Sekunden auf Änderungen)
    const interval = setInterval(loadLocations, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Auto-Close Sidebar nach 30 Sekunden
  useEffect(() => {
    if (!sidebarOpen) return; // Nur wenn Sidebar geöffnet ist

    const timer = setTimeout(() => {
      setSidebarOpen(false);
    }, 30000); // 30 Sekunden

    return () => {
      clearTimeout(timer);
    };
  }, [sidebarOpen]);

  // Dynamische Generierung der Location-SubItems (memoized)
  const locationSubItems = useMemo(() => {
    return locations
      .filter((loc) => loc.status === true)
      .map((loc) => {
        const urlPath = loc.id;
        
        return {
          name: loc.name,
          path: `/admin/locations/${urlPath}`,
          subSubItems: [
            { name: "Menu", path: `/admin/locations/${urlPath}/menu` },
            { name: "Products", path: `/admin/locations/${urlPath}/products` },
            { name: "Latest Orders", path: `/admin/locations/${urlPath}/orders` },
            { name: "Orders Details", path: `/admin/locations/${urlPath}/orders/details` },
          ],
        };
      });
  }, [locations]);

  // Menu Items (memoized)
  const menuItems = useMemo(() => {
    return [
      { id: "home", name: "Home", icon: "🏠", path: "/admin" },
      { id: "customers", name: "Customers", icon: "👥", path: "/admin/customers" },
      { id: "employees", name: "Employees", icon: "👤", path: "/admin/employees" },
      {
        id: "locations",
        name: "Locations",
        icon: "📍",
        path: "/admin/locations",
        subItems: locationSubItems,
      },
      { id: "ingredients", name: "Ingredients", icon: "📦", path: "/admin/ingredients" },
      { id: "addons", name: "Add On", icon: "🛒", path: "/admin/addons" },
      { id: "settings", name: "Settings", icon: "⚙️", path: "/admin/settings" },
    ];
  }, [locationSubItems]);

  // isActive function (memoized)
  const isActive = useCallback(
    (path: string) => pathname === path || pathname?.startsWith(path + "/"),
    [pathname]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-gray-900">DENIS KEBAP</h1>
            )}
            <button
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                // Timer wird automatisch zurückgesetzt durch useEffect
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <nav className="p-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <Link
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
              {item.subItems && sidebarOpen && isActive(item.path) && (
                <div className="ml-8 mt-2 space-y-1">
                  {item.subItems.map((subItem) => (
                    <div key={subItem.path}>
                      <Link
                        href={subItem.path}
                        className={`block px-4 py-2 rounded-lg transition-colors ${
                          isActive(subItem.path)
                            ? "bg-gray-800 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {subItem.name}
                      </Link>
                      {subItem.subSubItems && isActive(subItem.path) && (
                        <div className="ml-4 mt-1 space-y-1">
                          {subItem.subSubItems.map((subSubItem) => (
                            <Link
                              key={subSubItem.path}
                              href={subSubItem.path}
                              className={`block px-4 py-2 rounded-lg transition-colors text-sm ${
                                isActive(subSubItem.path)
                                  ? "bg-gray-700 text-white"
                                  : "text-gray-500 hover:bg-gray-100"
                              }`}
                            >
                              {subSubItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            </div>
            <div className="flex items-center gap-4">
              {activeLocation && (
                <span className="text-sm text-gray-600">{activeLocation.name}</span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}

