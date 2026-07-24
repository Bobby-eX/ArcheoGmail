import React from 'react';
import { EmailMessage } from '../types';
import { formatBytes } from '../lib/gmail';
import { Mail, Paperclip, HardDrive, CheckSquare, Trash2 } from 'lucide-react';

interface EmailStatsCardProps {
  messages: EmailMessage[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectWithAttachments: () => void;
  onSelectLarge: () => void;
  onOpenDeleteModal: (permanent: boolean) => void;
}

export const EmailStatsCard: React.FC<EmailStatsCardProps> = ({
  messages,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  onSelectWithAttachments,
  onSelectLarge,
  onOpenDeleteModal,
}) => {
  const totalCount = messages.length;
  const countWithAttachments = messages.filter((m) => m.hasAttachments).length;
  const totalAttachmentBytes = messages.reduce((sum, m) => sum + m.totalAttachmentSize, 0);

  // Selected stats
  const selectedMessages = messages.filter((m) => selectedIds.has(m.id));
  const selectedCount = selectedMessages.length;
  const selectedEstimateBytes = selectedMessages.reduce(
    (sum, m) => sum + m.sizeEstimate,
    0
  );

  if (totalCount === 0) return null;

  return (
    <div className="bg-white border border-[#E5E5E1] p-5 sm:p-6 shadow-sm text-[#1A1A1A] space-y-5">
      {/* Editorial Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[#F9F8F6] border border-[#E5E5E1] flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-2 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-neutral-600" />
            Wiadomości
          </span>
          <p className="text-3xl font-serif text-[#1A1A1A]">{totalCount}</p>
        </div>

        <div className="p-4 bg-[#F9F8F6] border border-[#E5E5E1] flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-2 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-neutral-600" />
            Załączniki
          </span>
          <p className="text-3xl font-serif text-[#1A1A1A]">{countWithAttachments}</p>
        </div>

        <div className="p-4 bg-[#F9F8F6] border border-[#E5E5E1] flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-2 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-neutral-600" />
            Rozmiar
          </span>
          <p className="text-2xl font-serif text-[#1A1A1A]">
            {formatBytes(totalAttachmentBytes)}
          </p>
        </div>

        <div className="p-4 bg-[#F9F8F6] border border-[#E5E5E1] flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-2 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-neutral-600" />
            Zaznaczone
          </span>
          <p className="text-3xl font-serif text-[#1A1A1A]">{selectedCount}</p>
        </div>
      </div>

      {/* Selection Control Bar & Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-[#E5E5E1]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mr-1">
            Zaznacz:
          </span>
          <button
            onClick={onSelectAll}
            className="px-3 py-1.5 bg-[#F9F8F6] border border-[#E5E5E1] hover:border-black text-[11px] font-medium text-[#1A1A1A] transition-colors"
          >
            Wszystkie
          </button>
          <button
            onClick={onSelectWithAttachments}
            className="px-3 py-1.5 bg-[#F9F8F6] border border-[#E5E5E1] hover:border-black text-[11px] font-medium text-[#1A1A1A] transition-colors"
          >
            Z załącznikami
          </button>
          <button
            onClick={onSelectLarge}
            className="px-3 py-1.5 bg-[#F9F8F6] border border-[#E5E5E1] hover:border-black text-[11px] font-medium text-[#1A1A1A] transition-colors"
          >
            Duże (&gt; 5 MB)
          </button>
          {selectedCount > 0 && (
            <button
              onClick={onDeselectAll}
              className="px-3 py-1.5 bg-[#F9F8F6] border border-[#E5E5E1] hover:border-black text-[11px] text-neutral-500 hover:text-black transition-colors"
            >
              Odznacz
            </button>
          )}
        </div>

        {/* Delete Actions if Items Selected */}
        {selectedCount > 0 ? (
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs font-mono text-emerald-700 font-medium mr-1 hidden lg:inline">
              Zwolnisz: {formatBytes(selectedEstimateBytes)}
            </span>
            <button
              onClick={() => onOpenDeleteModal(false)}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Do Kosza ({selectedCount})
            </button>
            <button
              onClick={() => onOpenDeleteModal(true)}
              className="px-4 py-2 bg-[#E11D48] hover:bg-rose-700 text-white text-[10px] uppercase tracking-widest font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Usuń trwale ({selectedCount})
            </button>
          </div>
        ) : (
          <p className="text-xs text-neutral-400 italic">Zaznacz e-maile, aby zwolnić miejsce.</p>
        )}
      </div>
    </div>
  );
};

