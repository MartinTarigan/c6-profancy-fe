"use client";

import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center bg-[#5171E3] px-6 py-4 text-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="btn-close-modal text-white hover:text-gray-200 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center text-[#333]">
          <p className="text-md">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 px-6 pb-6">
          <button
            onClick={onClose}
            className="btn-cancel-modal text-[#5171E3] border border-[#5171E3] px-4 py-2 rounded-md hover:bg-[#EFF2FF] transition duration-200"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-[#5171E3] text-white px-4 py-2 rounded-md hover:bg-[#4159b0] transition duration-200"
          >
            Ya, Batalkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
