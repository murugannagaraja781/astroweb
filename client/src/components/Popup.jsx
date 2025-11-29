// components/Popup.jsx
import React from 'react';

const Popup = ({ isOpen, onClose, title, message, onConfirm, confirmText = "OK" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;