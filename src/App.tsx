import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/auth';
import { fetchEmails, executeBatchDelete, verifyDeletePermissions, formatBytes } from './lib/gmail';
import {
  EmailMessage,
  FilterOptions,
  DeleteOperationSummary,
} from './types';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { EmailStatsCard } from './components/EmailStatsCard';
import { EmailCard } from './components/EmailCard';
import { EmailDetailModal } from './components/EmailDetailModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { LoginView } from './components/LoginView';
import {
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Inbox,
  ShieldAlert,
} from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Today date formatted YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Filter options state
  const [filters, setFilters] = useState<FilterOptions>({
    dateMode: 'single',
    date: todayStr,
    startDate: todayStr,
    endDate: todayStr,
    keywordQuery: '',
    senderQuery: '',
    recipientQuery: '',
    subjectQuery: '',
    onlyWithAttachments: false,
    minAttachmentSizeMB: 0,
    onlyUnread: false,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Data states
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [detailMessage, setDetailMessage] = useState<EmailMessage | null>(null);
  const [deleteSummary, setDeleteSummary] = useState<DeleteOperationSummary | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExecutingDelete, setIsExecutingDelete] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ completed: 0, total: 0 });

  // Toast message state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Initialize Auth
  useEffect(() => {
    initAuth(
      (currUser) => {
        setUser(currUser);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
  }, []);

  // Handle Login
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setNeedsAuth(false);
        showToast('Zalogowano pomyślnie z kontem Google!');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Nie udało się zalogować. Sprawdź okno autoryzacji i spróbuj ponownie.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    setMessages([]);
    setSelectedIds(new Set());
    setHasSearched(false);
  };

  // Search / Fetch Emails handler
  const handleSearch = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setSelectedIds(new Set());

    try {
      const token = await getAccessToken();
      if (!token) {
        setNeedsAuth(true);
        setIsLoading(false);
        return;
      }

      const result = await fetchEmails({
        accessToken: token,
        filters,
      });

      setMessages(result.messages);
      setHasSearched(true);
    } catch (err: unknown) {
      console.error('Błąd pobierania e-maili:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('401') || errMsg.includes('token')) {
        setError('Sesja wygasła. Zaloguj się ponownie.');
        setNeedsAuth(true);
      } else {
        setError(`Nie udało się pobrać e-maili: ${errMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setFilters({
      dateMode: 'single',
      date: todayStr,
      startDate: todayStr,
      endDate: todayStr,
      keywordQuery: '',
      senderQuery: '',
      recipientQuery: '',
      subjectQuery: '',
      onlyWithAttachments: false,
      minAttachmentSizeMB: 0,
      onlyUnread: false,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  // Auto-fetch when user logs in or search has not yet run
  useEffect(() => {
    if (user && !needsAuth && !hasSearched) {
      handleSearch();
    }
  }, [user, needsAuth, hasSearched, handleSearch]);

  // Client-side filtering & sorting for instant responsiveness
  const processedMessages = useMemo(() => {
    let list = [...messages];

    if (filters.keywordQuery.trim()) {
      const q = filters.keywordQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q) ||
          m.fromName.toLowerCase().includes(q) ||
          m.fromEmail.toLowerCase().includes(q) ||
          (m.toName && m.toName.toLowerCase().includes(q)) ||
          (m.toEmail && m.toEmail.toLowerCase().includes(q))
      );
    }

    if (filters.senderQuery.trim()) {
      const q = filters.senderQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.fromName.toLowerCase().includes(q) ||
          m.fromEmail.toLowerCase().includes(q)
      );
    }

    if (filters.recipientQuery.trim()) {
      const q = filters.recipientQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          (m.toName && m.toName.toLowerCase().includes(q)) ||
          (m.toEmail && m.toEmail.toLowerCase().includes(q)) ||
          (m.to && m.to.toLowerCase().includes(q))
      );
    }

    if (filters.subjectQuery.trim()) {
      const q = filters.subjectQuery.toLowerCase().trim();
      list = list.filter((m) => m.subject.toLowerCase().includes(q));
    }

    if (filters.onlyWithAttachments) {
      list = list.filter((m) => m.hasAttachments);
    }

    if (filters.minAttachmentSizeMB > 0) {
      const minBytes = filters.minAttachmentSizeMB * 1024 * 1024;
      list = list.filter((m) => m.totalAttachmentSize >= minBytes);
    }

    if (filters.onlyUnread) {
      list = list.filter((m) => m.isUnread);
    }

    // Sort
    list.sort((a, b) => {
      let comp = 0;
      if (filters.sortBy === 'date') {
        comp = a.date.getTime() - b.date.getTime();
      } else if (filters.sortBy === 'size') {
        comp = a.sizeEstimate - b.sizeEstimate;
      } else if (filters.sortBy === 'attachmentSize') {
        comp = a.totalAttachmentSize - b.totalAttachmentSize;
      } else if (filters.sortBy === 'sender') {
        comp = a.fromName.localeCompare(b.fromName);
      } else if (filters.sortBy === 'subject') {
        comp = a.subject.localeCompare(b.subject);
      }
      return filters.sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [messages, filters]);

  // Selection handlers
  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set(processedMessages.map((m) => m.id));
    setSelectedIds(all);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const selectWithAttachments = () => {
    const ids = new Set(processedMessages.filter((m) => m.hasAttachments).map((m) => m.id));
    setSelectedIds(ids);
  };

  const selectLarge = () => {
    const minBytes = 5 * 1024 * 1024;
    const ids = new Set(
      processedMessages.filter((m) => m.totalAttachmentSize >= minBytes).map((m) => m.id)
    );
    setSelectedIds(ids);
  };

  // Open delete confirm modal for bulk or single items
  const openDeleteModal = (targetMessages: EmailMessage[], action: 'trash' | 'permanent') => {
    const totalSize = targetMessages.reduce((sum, m) => sum + m.sizeEstimate, 0);
    setDeleteSummary({
      action,
      emails: targetMessages,
      totalSize,
    });
    setIsDeleteModalOpen(true);
  };

  const handleBulkDeleteTrigger = (permanent: boolean) => {
    const selected = processedMessages.filter((m) => selectedIds.has(m.id));
    if (selected.length === 0) return;
    openDeleteModal(selected, permanent ? 'permanent' : 'trash');
  };

  // Verify OAuth permissions for email deletion
  const handleVerifyPermissions = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        showToast('Najpierw zaloguj się do konta Google.', 'error');
        return;
      }
      showToast('Weryfikacja uprawnień do usuwania e-maili w Gmail API...');
      const check = await verifyDeletePermissions(token);
      if (check.hasModifyPermission) {
        showToast(
          `Uprawnienia AKTYWNE: Masz pełny dostęp do modyfikacji i usuwania wiadomości w Gmail (${
            check.userEmail || user?.email || ''
          }).`
        );
      } else {
        showToast(
          check.error ||
            'Brak wystarczających uprawnień do usuwania e-maili w Gmail. Przeloguj się i zaakceptuj uprawnienia.',
          'error'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Błąd weryfikacji uprawnień: ${msg}`, 'error');
    }
  }, [user, showToast]);

  // Execute deletion
  const executeDelete = async () => {
    if (!deleteSummary) return;

    setIsExecutingDelete(true);
    setDeleteProgress({ completed: 0, total: deleteSummary.emails.length });

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Brak autoryzacji. Zaloguj się ponownie.');
      }

      // Pre-verify permissions
      const permCheck = await verifyDeletePermissions(token);
      if (!permCheck.hasModifyPermission) {
        throw new Error(
          permCheck.error ||
            'Brak uprawnień do modyfikacji/kasowania e-maili w Gmail API. Wyloguj się i zaloguj ponownie z pełnymi uprawnieniami.'
        );
      }

      const ids = deleteSummary.emails.map((m) => m.id);
      const isPermanent = deleteSummary.action === 'permanent';

      const result = await executeBatchDelete({
        ids,
        accessToken: token,
        permanent: isPermanent,
        onProgress: (completed, total) => {
          setDeleteProgress({ completed, total });
        },
      });

      // Remove succeeded emails from local state
      const succeededSet = new Set(result.succeeded);
      setMessages((prev) => prev.filter((m) => !succeededSet.has(m.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        succeededSet.forEach((id) => next.delete(id));
        return next;
      });

      setIsDeleteModalOpen(false);

      if (result.failed.length === 0) {
        showToast(
          `Pomyślnie ${
            isPermanent ? 'trwale usunięto' : 'przeniesiono do kosza'
          } ${result.succeeded.length} e-maili (zwolniono ${formatBytes(
            deleteSummary.totalSize
          )}).`
        );
      } else {
        showToast(
          `Przetworzono ${result.succeeded.length} z ${ids.length} e-maili. Błędy: ${result.failed.length}`,
          'error'
        );
      }
    } catch (err: unknown) {
      console.error('Błąd podczas usuwania:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Wystąpił błąd podczas usuwania: ${errMsg}`, 'error');
    } finally {
      setIsExecutingDelete(false);
      setDeleteSummary(null);
    }
  };

  const dateDescriptionLabel = useMemo(() => {
    if (filters.dateMode === 'single') return `Dzień: ${filters.date}`;
    if (filters.dateMode === 'range') return `Zakres: ${filters.startDate} — ${filters.endDate}`;
    return 'Wszystkie daty';
  }, [filters]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md px-5 py-3.5 border shadow-2xl flex items-center gap-3 text-xs font-medium animate-slideUp bg-white ${
            toast.type === 'success'
              ? 'border-[#1A1A1A] text-[#1A1A1A]'
              : 'border-rose-600 text-rose-900'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onSignIn={handleLogin}
        isLoggingIn={isLoggingIn}
        onVerifyPermissions={handleVerifyPermissions}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* If user needs login */}
        {needsAuth ? (
          <LoginView onSignIn={handleLogin} isLoggingIn={isLoggingIn} />
        ) : (
          <>
            {/* Filter Controls */}
            <FilterBar
              filters={filters}
              onChange={setFilters}
              onSearch={handleSearch}
              onReset={handleResetFilters}
              isLoading={isLoading}
            />

            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900 text-xs">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">{error}</p>
                  <p className="text-[11px] text-rose-700 mt-1">
                    Jeśli błąd się powtarza, upewnij się, że wyrażono zgodę na dostęp do wiadomości Gmail.
                  </p>
                </div>
              </div>
            )}

            {/* Statistics Banner */}
            <EmailStatsCard
              messages={processedMessages}
              selectedIds={selectedIds}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              onSelectWithAttachments={selectWithAttachments}
              onSelectLarge={selectLarge}
              onOpenDeleteModal={handleBulkDeleteTrigger}
            />

            {/* Email List Section */}
            {isLoading ? (
              <div className="bg-white border border-[#E5E5E1] p-16 text-center space-y-4">
                <RotateCcw className="w-8 h-8 text-[#1A1A1A] animate-spin mx-auto" />
                <p className="font-serif italic text-lg font-bold text-[#1A1A1A]">
                  Przeszukiwanie wiadomości Gmail ({dateDescriptionLabel})...
                </p>
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                  Przeszukanie nagłówków, słów kluczowych oraz analiza załączników
                </p>
              </div>
            ) : processedMessages.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1 text-xs text-neutral-500 font-mono">
                  <span>
                    Wyniki ({processedMessages.length}): <strong className="text-[#1A1A1A]">{dateDescriptionLabel}</strong>
                  </span>
                  {selectedIds.size > 0 && (
                    <span className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[11px]">
                      Zaznaczono {selectedIds.size} z {processedMessages.length}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {processedMessages.map((msg) => (
                    <EmailCard
                      key={msg.id}
                      message={msg}
                      isSelected={selectedIds.has(msg.id)}
                      onToggleSelect={toggleSelectId}
                      onViewDetail={(m) => setDetailMessage(m)}
                      onSingleTrash={(m) => openDeleteModal([m], 'trash')}
                      onSingleDelete={(m) => openDeleteModal([m], 'permanent')}
                    />
                  ))}
                </div>
              </div>
            ) : hasSearched ? (
              <div className="bg-white border border-[#E5E5E1] p-16 text-center space-y-4">
                <div className="w-12 h-12 bg-[#F9F8F6] border border-[#E5E5E1] text-[#1A1A1A] flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="font-serif italic text-xl font-bold text-[#1A1A1A]">
                  Brak wiadomości dla wybranych kryteriów
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                  Nie znaleziono e-maili spełniających wybrane kryteria wyszukiwania ({dateDescriptionLabel}). Spróbuj zmienić słowa kluczowe lub zresetować filtry.
                </p>
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Detail Modal */}
      <EmailDetailModal
        message={detailMessage}
        onClose={() => setDetailMessage(null)}
        onTrash={(m) => openDeleteModal([m], 'trash')}
        onDeletePermanent={(m) => openDeleteModal([m], 'permanent')}
      />

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        summary={deleteSummary}
        isOpen={isDeleteModalOpen}
        isExecuting={isExecutingDelete}
        progress={deleteProgress}
        onConfirm={executeDelete}
        onCancel={() => {
          if (!isExecutingDelete) {
            setIsDeleteModalOpen(false);
            setDeleteSummary(null);
          }
        }}
      />
    </div>
  );
}


