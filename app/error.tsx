"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Etwas ist schiefgelaufen!</h2>
        <p className="text-gray-600 mb-2">{error.message}</p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-6">Fehler-ID: {error.digest}</p>
        )}
        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Erneut versuchen
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  );
}