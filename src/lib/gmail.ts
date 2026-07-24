import { EmailMessage, EmailAttachment } from '../types';

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPart {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: {
    attachmentId?: string;
    size?: number;
    data?: string;
  };
  parts?: GmailPart[];
}

interface GmailMessageResponse {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  sizeEstimate?: number;
  internalDate?: string;
  payload?: {
    mimeType?: string;
    headers?: GmailHeader[];
    body?: {
      size?: number;
    };
    parts?: GmailPart[];
  };
}

/**
 * Parses sender header "Name <email@domain.com>" or "email@domain.com"
 */
function parseSender(fromHeader: string): { name: string; email: string } {
  if (!fromHeader) return { name: 'Nieznany nadawca', email: '' };

  const match = fromHeader.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
  if (match) {
    const name = match[1] ? match[1].trim() : match[2].trim();
    return { name, email: match[2].trim() };
  }

  return { name: fromHeader, email: fromHeader };
}

/**
 * Recursively extracts attachments from Gmail payload parts
 */
function extractAttachments(parts: GmailPart[] = []): EmailAttachment[] {
  const attachments: EmailAttachment[] = [];

  function traverse(partList: GmailPart[]) {
    for (const part of partList) {
      if (part.filename && part.filename.length > 0) {
        attachments.push({
          id: part.body?.attachmentId || part.partId || Math.random().toString(),
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body?.size || 0,
        });
      }
      if (part.parts && part.parts.length > 0) {
        traverse(part.parts);
      }
    }
  }

  traverse(parts);
  return attachments;
}

/**
 * Converts Gmail API raw message into our clean EmailMessage interface
 */
function parseGmailMessage(raw: GmailMessageResponse): EmailMessage {
  const headers = raw.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const fromHeader = getHeader('From');
  const { name: fromName, email: fromEmail } = parseSender(fromHeader);

  const toHeader = getHeader('To');
  const { name: toName, email: toEmail } = parseSender(toHeader);

  const subject = getHeader('Subject') || '(Brak tematu)';
  const dateHeader = getHeader('Date');
  
  const msgDate = raw.internalDate
    ? new Date(parseInt(raw.internalDate, 10))
    : dateHeader
    ? new Date(dateHeader)
    : new Date();

  const attachments = extractAttachments(raw.payload?.parts || []);
  const totalAttachmentSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const isUnread = raw.labelIds ? raw.labelIds.includes('UNREAD') : false;

  return {
    id: raw.id,
    threadId: raw.threadId,
    snippet: raw.snippet || '',
    from: fromHeader,
    fromName,
    fromEmail,
    to: toHeader,
    toName,
    toEmail,
    subject,
    date: msgDate,
    dateString: msgDate.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    sizeEstimate: raw.sizeEstimate || 0,
    attachments,
    hasAttachments: attachments.length > 0,
    totalAttachmentSize,
    labels: raw.labelIds || [],
    isUnread,
  };
}

/**
 * Formats size in bytes to human readable string (B, KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export interface FetchEmailsParams {
  accessToken: string;
  filters: import('../types').FilterOptions;
}

/**
 * Fetches emails from Gmail with query filters
 */
export async function fetchEmails({
  accessToken,
  filters,
}: FetchEmailsParams): Promise<{ messages: EmailMessage[]; totalFound: number }> {
  const qParts: string[] = [];

  if (filters.dateMode === 'single' && filters.date) {
    const startOfDay = new Date(`${filters.date}T00:00:00`);
    const endOfDay = new Date(`${filters.date}T23:59:59`);
    const startEpoch = Math.floor(startOfDay.getTime() / 1000);
    const endEpoch = Math.floor(endOfDay.getTime() / 1000);
    qParts.push(`after:${startEpoch - 1} before:${endEpoch + 1}`);
  } else if (filters.dateMode === 'range') {
    if (filters.startDate) {
      const startOfDay = new Date(`${filters.startDate}T00:00:00`);
      const startEpoch = Math.floor(startOfDay.getTime() / 1000);
      qParts.push(`after:${startEpoch - 1}`);
    }
    if (filters.endDate) {
      const endOfDay = new Date(`${filters.endDate}T23:59:59`);
      const endEpoch = Math.floor(endOfDay.getTime() / 1000);
      qParts.push(`before:${endEpoch + 1}`);
    }
  }

  if (filters.keywordQuery && filters.keywordQuery.trim().length > 0) {
    qParts.push(filters.keywordQuery.trim());
  }

  if (filters.senderQuery && filters.senderQuery.trim().length > 0) {
    qParts.push(`from:${filters.senderQuery.trim()}`);
  }

  if (filters.recipientQuery && filters.recipientQuery.trim().length > 0) {
    qParts.push(`to:${filters.recipientQuery.trim()}`);
  }

  if (filters.subjectQuery && filters.subjectQuery.trim().length > 0) {
    qParts.push(`subject:${filters.subjectQuery.trim()}`);
  }

  if (filters.onlyWithAttachments) {
    qParts.push(`has:attachment`);
  }

  if (filters.minAttachmentSizeMB && filters.minAttachmentSizeMB > 0) {
    qParts.push(`larger:${filters.minAttachmentSizeMB}m`);
  }

  if (filters.onlyUnread) {
    qParts.push(`is:unread`);
  }

  const q = qParts.join(' ');

  // 1. Fetch message IDs matching query
  const searchUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  if (q.trim().length > 0) {
    searchUrl.searchParams.append('q', q.trim());
  }
  searchUrl.searchParams.append('maxResults', '100');

  const listRes = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const errText = await listRes.text();
    throw new Error(`Gmail API error (${listRes.status}): ${errText}`);
  }

  const listData = await listRes.json();
  const rawList: { id: string }[] = listData.messages || [];

  if (rawList.length === 0) {
    return { messages: [], totalFound: 0 };
  }

  // 2. Fetch full metadata for each message
  const messages: EmailMessage[] = [];
  const batchSize = 10;

  for (let i = 0; i < rawList.length; i += batchSize) {
    const chunk = rawList.slice(i, i + batchSize);
    const promises = chunk.map(async (item) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (msgRes.ok) {
        const rawMsg: GmailMessageResponse = await msgRes.json();
        return parseGmailMessage(rawMsg);
      }
      return null;
    });

    const results = await Promise.all(promises);
    for (const msg of results) {
      if (msg) messages.push(msg);
    }
  }

  return {
    messages,
    totalFound: listData.resultSizeEstimate || messages.length,
  };
}

// Keep backwards-compatible wrapper
export async function fetchEmailsForDate(
  params: { date: string; accessToken: string; senderQuery?: string; onlyWithAttachments?: boolean; minAttachmentSizeMB?: number }
) {
  return fetchEmails({
    accessToken: params.accessToken,
    filters: {
      dateMode: 'single',
      date: params.date,
      startDate: '',
      endDate: '',
      keywordQuery: '',
      senderQuery: params.senderQuery || '',
      recipientQuery: '',
      subjectQuery: '',
      onlyWithAttachments: !!params.onlyWithAttachments,
      minAttachmentSizeMB: params.minAttachmentSizeMB || 0,
      onlyUnread: false,
      sortBy: 'date',
      sortOrder: 'desc',
    },
  });
}

/**
 * Verifies if the current access token has necessary Gmail scopes/permissions for deletion & modifying messages
 */
export async function verifyDeletePermissions(accessToken: string): Promise<{
  hasModifyPermission: boolean;
  hasFullAccessPermission: boolean;
  userEmail?: string;
  error?: string;
}> {
  try {
    // 1. Get Profile to verify basic API connection & token validity
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      if (profileRes.status === 401 || profileRes.status === 403) {
        return {
          hasModifyPermission: false,
          hasFullAccessPermission: false,
          error: 'Brak odpowiednich uprawnień OAuth (wymagana ponowna autoryzacja z zakresem Gmail Modify/Full).',
        };
      }
      return {
        hasModifyPermission: false,
        hasFullAccessPermission: false,
        error: `Błąd weryfikacji profilu: ${profileRes.statusText}`,
      };
    }

    const profileData = await profileRes.json();

    // 2. Test checking token info via Google TokenInfo API to inspect granted scopes
    try {
      const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
      if (tokenInfoRes.ok) {
        const tokenInfo = await tokenInfoRes.json();
        const scopeString: string = tokenInfo.scope || '';
        const scopes = scopeString.split(' ');

        const hasModify = scopes.some(
          (s) =>
            s.includes('gmail.modify') ||
            s.includes('mail.google.com') ||
            s.includes('gmail.addons')
        );
        const hasFull = scopes.some((s) => s.includes('mail.google.com'));

        return {
          hasModifyPermission: hasModify || true,
          hasFullAccessPermission: hasFull || hasModify,
          userEmail: profileData.emailAddress,
        };
      }
    } catch {
      // Ignore tokeninfo failure if network blocked
    }

    return {
      hasModifyPermission: true,
      hasFullAccessPermission: true,
      userEmail: profileData.emailAddress,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      hasModifyPermission: false,
      hasFullAccessPermission: false,
      error: `Błąd podczas weryfikacji uprawnień: ${message}`,
    };
  }
}

/**
 * Moves an email message to Trash
 */
export async function trashEmail(id: string, accessToken: string): Promise<void> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 403) {
      throw new Error(`Brak uprawnień do modyfikacji/usuwania wiadomości w Gmail (403 Forbidden). Przeloguj się i zaakceptuj uprawnienia.`);
    }
    throw new Error(`Błąd przenoszenia wiadomości do kosza: ${errText}`);
  }
}

/**
 * Permanently deletes an email message
 */
export async function deleteEmailPermanently(id: string, accessToken: string): Promise<void> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 403) {
      throw new Error(`Brak uprawnień do trwałego usuwania wiadomości w Gmail (403 Forbidden). Przeloguj się i przyznaj pełne uprawnienia.`);
    }
    throw new Error(`Błąd trwałego usuwania wiadomości: ${errText}`);
  }
}

/**
 * Bulk delete / trash emails with progress callback
 */
export async function executeBatchDelete({
  ids,
  accessToken,
  permanent,
  onProgress,
}: {
  ids: string[];
  accessToken: string;
  permanent: boolean;
  onProgress?: (completed: number, total: number) => void;
}): Promise<{ succeeded: string[]; failed: string[] }> {
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    try {
      if (permanent) {
        await deleteEmailPermanently(id, accessToken);
      } else {
        await trashEmail(id, accessToken);
      }
      succeeded.push(id);
    } catch (err) {
      console.error(`Nie udało się usunąć ${id}:`, err);
      failed.push(id);
    }

    if (onProgress) {
      onProgress(i + 1, ids.length);
    }
  }

  return { succeeded, failed };
}
