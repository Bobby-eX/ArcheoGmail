import React, { useState } from 'react';
import { FilterOptions } from '../types';
import {
  Calendar,
  Search,
  Paperclip,
  ArrowUpDown,
  RotateCcw,
  User,
  X,
  SlidersHorizontal,
  Mail,
  FileText,
  Inbox,
  Filter,
  CheckCircle,
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  onSearch: () => void;
  onReset: () => void;
  isLoading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onSearch,
  onReset,
  isLoading,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Helpers to set preset dates & ranges
  const setPresetDate = (yearsAgo: number, daysAgo: number = 0) => {
    const today = new Date();
    const targetDate = new Date(
      today.getFullYear() - yearsAgo,
      today.getMonth(),
      today.getDate() - daysAgo
    );
    const dateStr = targetDate.toISOString().split('T')[0];
    onChange({ ...filters, dateMode: 'single', date: dateStr });
  };

  const setPresetRange = (daysBack: number) => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - daysBack);

    onChange({
      ...filters,
      dateMode: 'range',
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  };

  const setPresetYearRange = (yearsAgo: number) => {
    const today = new Date();
    const year = today.getFullYear() - yearsAgo;
    onChange({
      ...filters,
      dateMode: 'range',
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    });
  };

  const hasActiveFilters =
    filters.keywordQuery ||
    filters.senderQuery ||
    filters.recipientQuery ||
    filters.subjectQuery ||
    filters.onlyWithAttachments ||
    filters.minAttachmentSizeMB > 0 ||
    filters.onlyUnread ||
    filters.dateMode !== 'single';

  return (
    <div className="bg-white border border-[#E5E5E1] p-5 sm:p-6 shadow-sm text-[#1A1A1A] space-y-5">
      {/* Search Header Bar: Keywords Search & Action Buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Szukaj według słów kluczowych (treść, temat, nadawca, odbiorca)..."
            value={filters.keywordQuery}
            onChange={(e) => onChange({ ...filters, keywordQuery: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
            }}
            className="w-full bg-[#F9F8F6] border border-[#E5E5E1] focus:border-black pl-10 pr-9 py-2.5 text-xs text-[#1A1A1A] placeholder-neutral-400 focus:outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          {filters.keywordQuery && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, keywordQuery: '' })}
              className="absolute right-3 top-3 text-neutral-400 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3.5 py-2.5 text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              showAdvanced || filters.senderQuery || filters.recipientQuery || filters.subjectQuery
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-[#F9F8F6] text-[#1A1A1A] border-[#E5E5E1] hover:border-black'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Zaawansowane
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              title="Resetuj wszystkie filtry"
              className="px-3 py-2.5 bg-[#F9F8F6] border border-[#E5E5E1] hover:border-black text-neutral-600 hover:text-black text-xs font-medium transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={onSearch}
            disabled={isLoading}
            className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-50 flex items-center gap-2 h-[38px] shrink-0"
          >
            {isLoading ? (
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            Szukaj
          </button>
        </div>
      </div>

      {/* Date Filtering Section */}
      <div className="pt-4 border-t border-[#E5E5E1] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]" />
              Zakres czasowy:
            </span>
            <div className="inline-flex border border-[#E5E5E1] bg-[#F9F8F6] p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => onChange({ ...filters, dateMode: 'single' })}
                className={`px-3 py-1 transition-colors ${
                  filters.dateMode === 'single'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Wybrany Dzień
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...filters, dateMode: 'range' })}
                className={`px-3 py-1 transition-colors ${
                  filters.dateMode === 'range'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Zakres Dat
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...filters, dateMode: 'all' })}
                className={`px-3 py-1 transition-colors ${
                  filters.dateMode === 'all'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Wszystkie Daty
              </button>
            </div>
          </div>

          {/* Quick Date Presets for Range Mode */}
          {filters.dateMode === 'range' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mr-1 hidden xl:inline">
                Szybki zakres:
              </span>
              <button
                type="button"
                onClick={() => setPresetRange(7)}
                className="px-2.5 py-1 bg-[#F9F8F6] hover:bg-neutral-200 text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E1] transition-colors"
              >
                7 dni
              </button>
              <button
                type="button"
                onClick={() => setPresetRange(30)}
                className="px-2.5 py-1 bg-[#F9F8F6] hover:bg-neutral-200 text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E1] transition-colors"
              >
                30 dni
              </button>
              <button
                type="button"
                onClick={() => setPresetRange(90)}
                className="px-2.5 py-1 bg-[#F9F8F6] hover:bg-neutral-200 text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E1] transition-colors"
              >
                90 dni
              </button>
              <button
                type="button"
                onClick={() => setPresetYearRange(0)}
                className="px-2.5 py-1 bg-[#F9F8F6] hover:bg-neutral-200 text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E1] transition-colors"
              >
                Ten rok
              </button>
              <button
                type="button"
                onClick={() => setPresetYearRange(1)}
                className="px-2.5 py-1 bg-[#F9F8F6] hover:bg-neutral-200 text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E1] transition-colors"
              >
                Poprzedni rok
              </button>
            </div>
          )}
          {filters.dateMode === 'single' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mr-1 hidden xl:inline">
                Szybki wybór:
              </span>
              <button
                type="button"
                onClick={() => setPresetDate(0, 0)}
                className="px-2.5 py-1 bg-[#F9F8F6] hover:bg-neutral-200 text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E1] transition-colors"
              >
                Dzisiaj
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(0, 1)}
                className="px-2.5 py-1 bg-[#F9F8F6] hover:bg-neutral-200 text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E1] transition-colors"
              >
                Wczoraj
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(1)}
                className="px-2.5 py-1 bg-[#F9F8F6] hover:bg-rose-50 text-rose-900 text-[11px] font-medium border border-[#E5E5E1] transition-colors"
              >
                1 rok temu
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(2)}
                className="px-2.5 py-1 bg-[#F9F8F6] hover:bg-amber-50 text-amber-900 text-[11px] font-medium border border-[#E5E5E1] transition-colors"
              >
                2 lata temu
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(5)}
                className="px-2.5 py-1 bg-[#F9F8F6] hover:bg-emerald-50 text-emerald-900 text-[11px] font-medium border border-[#E5E5E1] transition-colors"
              >
                5 lat temu
              </button>
            </div>
          )}
        </div>

        {/* Date Inputs based on Mode */}
        {filters.dateMode === 'single' && (
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={filters.date}
              onChange={(e) => onChange({ ...filters, date: e.target.value })}
              className="bg-[#F9F8F6] border border-[#E5E5E1] text-[#1A1A1A] text-xs font-serif font-bold px-3 py-1.5 focus:outline-none focus:border-black transition-colors"
            />
            <span className="text-xs text-neutral-500 italic">
              Pobierze wiadomości przesłane w ciągu tego konkretnego dnia.
            </span>
          </div>
        )}

        {filters.dateMode === 'range' && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-neutral-500">Od:</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
                className="bg-[#F9F8F6] border border-[#E5E5E1] text-[#1A1A1A] text-xs font-serif font-bold px-3 py-1.5 focus:outline-none focus:border-black"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-neutral-500">Do:</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
                className="bg-[#F9F8F6] border border-[#E5E5E1] text-[#1A1A1A] text-xs font-serif font-bold px-3 py-1.5 focus:outline-none focus:border-black"
              />
            </div>
          </div>
        )}
      </div>

      {/* Advanced Specific Fields Section */}
      {showAdvanced && (
        <div className="p-4 bg-[#F9F8F6] border border-[#E5E5E1] grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-neutral-700" /> Nadawca (Od)
            </label>
            <input
              type="text"
              placeholder="np. jan.kowalski@gmail.com..."
              value={filters.senderQuery}
              onChange={(e) => onChange({ ...filters, senderQuery: e.target.value })}
              className="w-full bg-white border border-[#E5E5E1] focus:border-black px-2.5 py-1.5 text-xs text-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3 text-neutral-700" /> Odbiorca (Do)
            </label>
            <input
              type="text"
              placeholder="np. biuro@firma.pl..."
              value={filters.recipientQuery}
              onChange={(e) => onChange({ ...filters, recipientQuery: e.target.value })}
              className="w-full bg-white border border-[#E5E5E1] focus:border-black px-2.5 py-1.5 text-xs text-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-neutral-700" /> Temat
            </label>
            <input
              type="text"
              placeholder="np. Faktura, Umowa, Raport..."
              value={filters.subjectQuery}
              onChange={(e) => onChange({ ...filters, subjectQuery: e.target.value })}
              className="w-full bg-white border border-[#E5E5E1] focus:border-black px-2.5 py-1.5 text-xs text-[#1A1A1A]"
            />
          </div>
        </div>
      )}

      {/* Attachments, Status & Sorting Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-2 border-t border-[#E5E5E1]">
        {/* Toggles: Attachments & Unread */}
        <div className="md:col-span-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              onChange({ ...filters, onlyWithAttachments: !filters.onlyWithAttachments })
            }
            className={`px-3 py-1.5 text-xs font-medium border transition-all flex items-center gap-1.5 ${
              filters.onlyWithAttachments
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-[#F9F8F6] text-neutral-700 border-[#E5E5E1] hover:border-black'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Załączniki
          </button>

          <select
            value={filters.minAttachmentSizeMB}
            onChange={(e) =>
              onChange({ ...filters, minAttachmentSizeMB: parseFloat(e.target.value) })
            }
            className="bg-[#F9F8F6] border border-[#E5E5E1] text-xs font-medium text-[#1A1A1A] px-2.5 py-1.5 focus:outline-none focus:border-black"
          >
            <option value={0}>Dowolny rozmiar</option>
            <option value={1}>&gt; 1 MB</option>
            <option value={5}>&gt; 5 MB</option>
            <option value={10}>&gt; 10 MB</option>
            <option value={25}>&gt; 25 MB</option>
          </select>

          <button
            type="button"
            onClick={() => onChange({ ...filters, onlyUnread: !filters.onlyUnread })}
            className={`px-3 py-1.5 text-xs font-medium border transition-all flex items-center gap-1.5 ${
              filters.onlyUnread
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-[#F9F8F6] text-neutral-700 border-[#E5E5E1] hover:border-black'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            Nieprzeczytane
          </button>
        </div>

        {/* Sorting Dropdown & Order Toggle */}
        <div className="md:col-span-6 flex items-center justify-end gap-3">
          <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold flex items-center gap-1 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-600" /> Sortowanie:
          </label>
          <div className="flex items-center gap-1">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChange({
                  ...filters,
                  sortBy: e.target.value as FilterOptions['sortBy'],
                })
              }
              className="bg-[#F9F8F6] border border-[#E5E5E1] text-xs font-bold text-[#1A1A1A] px-3 py-1.5 focus:outline-none focus:border-black"
            >
              <option value="date">Data wiadomości</option>
              <option value="size">Całkowity rozmiar</option>
              <option value="attachmentSize">Rozmiar załączników</option>
              <option value="sender">Nadawca</option>
              <option value="subject">Temat</option>
            </select>

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                })
              }
              title={filters.sortOrder === 'asc' ? 'Rosnąco' : 'Malejąco'}
              className="px-2.5 py-1.5 bg-[#F9F8F6] border border-[#E5E5E1] hover:border-black text-[#1A1A1A] text-xs font-mono font-bold transition-colors"
            >
              {filters.sortOrder === 'asc' ? '↑ Rosnąco' : '↓ Malejąco'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


