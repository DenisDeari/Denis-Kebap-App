"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function LocationManagementPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Automatisch zur Products-Seite weiterleiten
    if (params?.locationId) {
      router.push(`/admin/locations/${params.locationId}/products`);
    }
  }, [router, params]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Weiterleitung...</p>
    </div>
  );
}

