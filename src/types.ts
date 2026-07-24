export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number; // in bytes
}

export interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to?: string;
  toName?: string;
  toEmail?: string;
  subject: string;
  date: Date;
  dateString: string;
  sizeEstimate: number; // total message size in bytes
  attachments: EmailAttachment[];
  hasAttachments: boolean;
  totalAttachmentSize: number; // sum of attachment sizes in bytes
  labels: string[];
  isUnread?: boolean;
}

export interface FilterOptions {
  dateMode: 'single' | 'range' | 'all';
  date: string; // YYYY-MM-DD for single date
  startDate: string; // YYYY-MM-DD for range
  endDate: string; // YYYY-MM-DD for range
  keywordQuery: string; // keywords in subject, snippet, body
  senderQuery: string; // from:
  recipientQuery: string; // to:
  subjectQuery: string; // subject:
  onlyWithAttachments: boolean;
  minAttachmentSizeMB: number; // 0 for any size
  onlyUnread: boolean;
  sortBy: 'date' | 'size' | 'attachmentSize' | 'sender' | 'subject';
  sortOrder: 'asc' | 'desc';
}

export interface DeleteOperationSummary {
  action: 'trash' | 'permanent';
  emails: EmailMessage[];
  totalSize: number;
}

