import { AlertTriangle } from "lucide-react";

const ConfirmModal = ({ target, onConfirm, onCancel, entityLabel = "item" }) => {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 top-[50px] backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal Card */}
      <div className="relative bg-[#111111] border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-slide">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-danger/10 border border-danger/20 mx-auto mb-4">
          <AlertTriangle size={22} className="text-danger" />
        </div>

        {/* Title */}
        <h3 className="text-center text-white font-semibold text-base mb-1">
          Delete {entityLabel}
        </h3>

        {/* Message */}
        <p className="text-center text-slate-400 text-sm mb-6">
          Are you sure you want to delete
          <span className="text-white font-medium">"{target.name}"</span>?
          <span className="text-danger/80">This action cannot be undone.</span>
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            className="flex-1 btn-outline flex items-center justify-center"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 bg-danger/90 hover:bg-danger text-white text-xs font-semibold px-4 py-2 rounded-lg border border-danger/50 transition-colors"
            onClick={onConfirm}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
