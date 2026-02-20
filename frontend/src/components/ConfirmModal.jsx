import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

/**
 * Custom confirm dialog — replaces native window.confirm
 * Matches the app's dark/light theme instead of using the ugly browser default.
 */
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", danger = false }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon + Title */}
                <div className="flex flex-col items-center pt-8 pb-4 px-6 text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                        <FaExclamationTriangle className={`text-2xl ${danger ? 'text-red-500' : 'text-amber-500'}`} />
                    </div>
                    <h3 className="text-lg font-black text-gray-800 dark:text-white mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
                </div>

                {/* Warning Badge */}
                <div className="mx-6 mb-5 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                    <p className="text-[11px] font-bold text-red-600 dark:text-red-400 text-center uppercase tracking-widest">
                        ⚠️ This action cannot be undone
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <div className="w-px bg-gray-100 dark:bg-gray-800" />
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-4 text-sm font-black transition-colors ${danger ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
