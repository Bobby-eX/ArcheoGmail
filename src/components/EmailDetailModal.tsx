import React from 'react';
import { EmailMessage } from '../types';
import { formatBytes } from '../lib/gmail';
import { X, Paperclip, Calendar, User, HardDrive, Trash2 } from 'lucide-react';

interface EmailDetailModalProps {
  message: EmailMessage | null;
  onClose: () => void;
  onTrash: (message: EmailMessage) => void;
  onDeletePermanent: (message: EmailMessage) => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  message,
  onClose,
  onTrash,
  onDeletePermanent,
}) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn">
      <div className="bg-white border border-[#E5E5E1] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-[#1A1A1A]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E5E5E1] flex items-start justify-between gap-3 bg-[#F9F8F6]">
          <div className="min-w-0">
            <h2 className="font-serif italic text-xl font-bold text-[#1A1A1A] leading-snug">
              {message.subject}
            </h2>
            <p className="text-xs font-mono text-neutral-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-neutral-600" /> {message.dateString}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-black bg-white border border-[#E5E5E1] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Sender & Recipient Box */}
          <div className="bg-[#F9F8F6] border border-[#E5E5E1] p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-neutral-600" />
                  <span className="font-bold text-[#1A1A1A] uppercase tracking-wider">{message.fromName}</span>
                  <span className="text-neutral-500">&lt;{message.fromEmail}&gt;</span>
                </div>
                {message.to && (
                  <p className="text-[11px] text-neutral-500 font-mono ml-6">
                    Do: <span className="text-[#1A1A1A] font-medium">{message.to}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {message.isUnread && (
                  <span className="px-2 py-0.5 bg-[#1A1A1A] text-white text-[9px] font-mono font-bold uppercase tracking-widest">
                    Nieprzeczytane
                  </span>
                )}
                <span className="text-[11px] font-mono text-neutral-700 bg-white px-2 py-0.5 border border-[#E5E5E1] flex items-center gap-1 w-max">
                  <HardDrive className="w-3 h-3 text-neutral-500" />
                  Rozmiar: {formatBytes(message.sizeEstimate)}
                </span>
              </div>
            </div>
          </div>

          {/* Snippet / Content Preview */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Podgląd treści:
            </h3>
            <div className="bg-[#F9F8F6] border border-[#E5E5E1] p-4 text-[#1A1A1A] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {message.snippet || '(Brak podglądu treści)'}
            </div>
          </div>

          {/* Attachments Section */}
          {message.hasAttachments && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-neutral-700" />
                Załączniki ({message.attachments.length} szt, łącznie{' '}
                {formatBytes(message.totalAttachmentSize)}):
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.attachments.map((att, idx) => (
                  <div
                    key={att.id + idx}
                    className="p-3 bg-[#F9F8F6] border border-[#E5E5E1] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-[#1A1A1A] truncate">{att.filename}</p>
                      <p className="text-[10px] font-mono text-neutral-400 truncate">{att.mimeType}</p>
                    </div>
                    <span className="font-mono text-neutral-700 font-bold text-[11px] shrink-0 bg-white px-2 py-0.5 border border-[#E5E5E1]">
                      {formatBytes(att.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#E5E5E1] bg-[#F9F8F6] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-[#E5E5E1] hover:border-black text-[#1A1A1A] text-xs font-medium transition-colors"
          >
            Zamknij
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                onTrash(message);
                onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[10px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Do Kosza
            </button>
            <button
              onClick={() => {
                onDeletePermanent(message);
                onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#E11D48] hover:bg-rose-700 text-white text-[10px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Usuń trwale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

