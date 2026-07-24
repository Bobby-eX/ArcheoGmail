import React from 'react';
import { DeleteOperationSummary } from '../types';
import { formatBytes } from '../lib/gmail';
import { AlertTriangle, Trash2, X, RotateCcw } from 'lucide-react';

interface ConfirmDeleteModalProps {
  summary: DeleteOperationSummary | null;
  isOpen: boolean;
  isExecuting: boolean;
  progress: { completed: number; total: number };
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  summary,
  isOpen,
  isExecuting,
  progress,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !summary) return null;

  const isPermanent = summary.action === 'permanent';
  const count = summary.emails.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn">
      <div className="bg-white border border-[#E5E5E1] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl text-[#1A1A1A]">
        {/* Modal Header */}
        <div
          className={`p-5 border-b flex items-center justify-between gap-3 ${
            isPermanent
              ? 'bg-rose-50 border-rose-200'
              : 'bg-[#F9F8F6] border-[#E5E5E1]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 flex items-center justify-center shrink-0 ${
                isPermanent
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-neutral-200 text-[#1A1A1A]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif italic text-lg font-bold text-[#1A1A1A]">
                {isPermanent ? 'Potwierdź TRWAŁE usunięcie' : 'Przenieś do kosza'}
              </h2>
              <p className="text-xs text-neutral-500">
                {isPermanent
                  ? 'Te wiadomości zostaną nieodwracalnie usunięte z konta Gmail.'
                  : 'Wiadomości zostaną przeniesione do folderu Kosz.'}
              </p>
            </div>
          </div>

          {!isExecuting && (
            <button
              onClick={onCancel}
              className="p-1.5 text-neutral-500 hover:text-black bg-white border border-[#E5E5E1] transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Summary Stats Box */}
          <div className="grid grid-cols-2 gap-4 bg-[#F9F8F6] p-4 border border-[#E5E5E1]">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Liczba e-maili:</p>
              <p className="text-2xl font-serif text-[#1A1A1A]">{count} szt.</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Zwolnisz miejsce:</p>
              <p className="text-2xl font-serif text-emerald-700">
                {formatBytes(summary.totalSize)}
              </p>
            </div>
          </div>

          {/* List preview of items to be deleted */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">
              Wybór zawiera wiadomości:
            </p>
            <div className="bg-[#F9F8F6] border border-[#E5E5E1] p-3 max-h-48 overflow-y-auto space-y-2">
              {summary.emails.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-center justify-between text-[#1A1A1A] pb-2 border-b border-[#E5E5E1] last:border-0 last:pb-0"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-xs truncate">{msg.subject}</p>
                    <p className="text-[10px] text-neutral-500 truncate">Od: {msg.fromName}</p>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-neutral-700 shrink-0">
                    {formatBytes(msg.sizeEstimate)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar when executing */}
          {isExecuting && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A]">
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-neutral-700" />
                  Przetwarzanie usuwania...
                </span>
                <span className="font-mono">
                  {progress.completed} / {progress.total}
                </span>
              </div>
              <div className="w-full h-2 bg-[#F9F8F6] border border-[#E5E5E1]">
                <div
                  className="h-full bg-[#1A1A1A] transition-all duration-300"
                  style={{
                    width: `${
                      progress.total > 0 ? (progress.completed / progress.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E5E5E1] bg-[#F9F8F6] flex items-center justify-end gap-2">
          {!isExecuting ? (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-white border border-[#E5E5E1] hover:border-black text-[#1A1A1A] font-medium text-xs transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2.5 text-white font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                  isPermanent
                    ? 'bg-[#E11D48] hover:bg-rose-700'
                    : 'bg-[#1A1A1A] hover:bg-neutral-800'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isPermanent ? 'Tak, usuń trwale' : 'Tak, przenieś do kosza'}
              </button>
            </>
          ) : (
            <p className="text-xs text-neutral-500 italic">Nie zamykaj okna w trakcie pracy...</p>
          )}
        </div>
      </div>
    </div>
  );
};

