import React from 'react';
import { EmailMessage } from '../types';
import { formatBytes } from '../lib/gmail';
import {
  Paperclip,
  Trash2,
  Eye,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  HardDrive,
  Calendar,
} from 'lucide-react';

interface EmailCardProps {
  message: EmailMessage;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetail: (message: EmailMessage) => void;
  onSingleTrash: (message: EmailMessage) => void;
  onSingleDelete: (message: EmailMessage) => void;
}

export const EmailCard: React.FC<EmailCardProps> = ({
  message,
  isSelected,
  onToggleSelect,
  onViewDetail,
  onSingleTrash,
  onSingleDelete,
}) => {
  // Get icon by mime type / filename
  const getFileIcon = (filename: string, mimeType: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'png', 'gif', 'webp', 'jpeg'].includes(ext) || mimeType.startsWith('image/')) {
      return <ImageIcon className="w-3.5 h-3.5 text-neutral-600" />;
    }
    if (['xlsx', 'xls', 'csv'].includes(ext) || mimeType.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-600" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext) || mimeType.includes('pdf')) {
      return <FileText className="w-3.5 h-3.5 text-neutral-600" />;
    }
    return <File className="w-3.5 h-3.5 text-neutral-600" />;
  };

  return (
    <div
      className={`group bg-white border p-5 transition-all duration-150 ${
        isSelected
          ? 'border-black bg-[#F9F8F6]'
          : 'border-[#E5E5E1] hover:border-black'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Selection Checkbox */}
        <div className="pt-1 shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(message.id)}
            className="w-4 h-4 accent-black cursor-pointer"
          />
        </div>

        {/* Sender Avatar */}
        <div className="w-8 h-8 bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs shrink-0">
          {message.fromName ? message.fromName[0] : 'U'}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {message.isUnread && (
                <span className="px-1.5 py-0.5 bg-[#1A1A1A] text-white font-mono text-[9px] font-bold uppercase tracking-widest shrink-0">
                  Nieprzeczytane
                </span>
              )}
              <span className="font-bold text-xs uppercase tracking-wider text-[#1A1A1A] truncate">
                {message.fromName}
              </span>
              <span className="text-xs text-neutral-400 truncate hidden md:inline">
                &lt;{message.fromEmail}&gt;
              </span>
              {message.toName && (
                <span className="text-[10px] text-neutral-500 font-mono hidden lg:inline">
                  Do: {message.toName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0 text-xs">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-neutral-400" />
                {message.dateString}
              </span>
              <span className="text-[11px] font-mono text-neutral-700 bg-[#F9F8F6] px-2 py-0.5 border border-[#E5E5E1] flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-neutral-500" />
                {formatBytes(message.sizeEstimate)}
              </span>
            </div>
          </div>

          {/* Subject & Snippet */}
          <h3
            onClick={() => onViewDetail(message)}
            className="font-serif font-bold text-base text-[#1A1A1A] hover:underline cursor-pointer leading-snug mb-1 truncate"
          >
            {message.subject}
          </h3>

          <p className="text-xs text-neutral-600 line-clamp-2 mb-2 font-normal leading-relaxed">
            {message.snippet}
          </p>

          {/* Attachments Section */}
          {message.hasAttachments && (
            <div className="mt-3 pt-2.5 border-t border-[#E5E5E1] flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 flex items-center gap-1 mr-1">
                <Paperclip className="w-3 h-3" />
                Załączniki ({message.attachments.length} szt, {formatBytes(message.totalAttachmentSize)}):
              </span>

              {message.attachments.map((att, idx) => (
                <div
                  key={att.id + idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F9F8F6] border border-[#E5E5E1] text-[11px] text-[#1A1A1A] max-w-[220px]"
                >
                  {getFileIcon(att.filename, att.mimeType)}
                  <span className="truncate max-w-[120px]" title={att.filename}>
                    {att.filename}
                  </span>
                  <span className="text-neutral-500 font-mono text-[10px]">({formatBytes(att.size)})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex sm:flex-col items-center gap-1 shrink-0 pt-1">
          <button
            onClick={() => onViewDetail(message)}
            title="Podgląd wiadomości"
            className="p-1.5 text-neutral-400 hover:text-black hover:bg-[#F9F8F6] transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSingleTrash(message)}
            title="Przenieś do kosza"
            className="p-1.5 text-neutral-400 hover:text-amber-700 hover:bg-[#F9F8F6] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSingleDelete(message)}
            title="Usuń trwale"
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-[#F9F8F6] transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

