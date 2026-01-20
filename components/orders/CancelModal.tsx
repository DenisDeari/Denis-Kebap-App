"use client";

interface CancelModalProps {
  orderTime: string;
  orderContact: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CancelModal({ orderTime, orderContact, onConfirm, onCancel }: CancelModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Bestellung stornieren?
        </h3>
        <p className="text-gray-600 mb-6">
          Möchten Sie die Bestellung von <strong>{orderContact}</strong> um{" "}
          <strong>{orderTime}</strong> wirklich stornieren?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Stornieren
          </button>
        </div>
      </div>
    </div>
  );
}
