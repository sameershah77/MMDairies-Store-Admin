import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Loader2, Play, Send, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { MediaPreview } from '@/components/ui/MediaPreview';
import { useToast } from '@/context/ToastContext';
import { getComplaintById, replyToComplaint, resolveComplaint } from '@/api/complaints';
import { ApiError } from '@/lib/apiClient';
import { uploadMediaToS3 } from '@/lib/s3Upload';
import { ComplaintStatus, complaintStatusTone } from '@/lib/complaintStatus';
import { formatDateTime } from '@/lib/format';
import { PermissionPage } from '@/components/permissions/PermissionPage';
import { PERMISSION } from '@/lib/permissions';
import type {
  ComplaintAttachmentInput,
  ComplaintAttachmentDto,
  ComplaintDetailsDto,
  ComplaintMessageDto,
} from '@/types/api';

const MAX_ATTACHMENTS = 5;
const MAX_BODY = 2000;

function isCustomer(role: string) {
  return role.toLowerCase() === 'customer';
}

function MessageBubble({
  message,
  onPreview,
}: {
  message: ComplaintMessageDto;
  onPreview: (item: ComplaintAttachmentDto) => void;
}) {
  const customer = isCustomer(message.sender_role);
  const attachments = [...(message.attachments || [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <div className={`flex ${customer ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${
          customer
            ? 'rounded-bl-md bg-ink-50 text-ink-900'
            : 'rounded-br-md bg-brand-500 text-white'
        }`}
      >
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-semibold ${customer ? 'text-ink-700' : 'text-white/90'}`}
          >
            {message.sender_name || (customer ? 'Customer' : 'Store Admin')}
          </span>
          <span className={`text-[10px] ${customer ? 'text-ink-400' : 'text-white/70'}`}>
            {customer ? 'Customer' : 'Store Admin'}
          </span>
        </div>
        {message.body && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
        )}
        {attachments.length > 0 && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {attachments.map((att, idx) => {
              const key = `${att.url}-${idx}`;
              if (att.media_type === 'video') {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onPreview(att)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                      customer ? 'bg-white text-ink-700' : 'bg-white/15 text-white'
                    }`}
                  >
                    <Play className="size-3.5" />
                    View video
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onPreview(att)}
                  className="block w-full overflow-hidden rounded-xl"
                >
                  <img
                    src={att.url}
                    alt="Attachment"
                    className="h-28 w-full rounded-xl object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
        <p className={`mt-2 text-[10px] ${customer ? 'text-ink-400' : 'text-white/70'}`}>
          {formatDateTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

export function ComplaintDetailPage() {
  return (
    <PermissionPage
      title="Complaints"
      subtitle="Customer tickets for your store"
      permissionId={PERMISSION.ChatWithCustomer}
    >
      <ComplaintDetailBoard />
    </PermissionPage>
  );
}

function ComplaintDetailBoard() {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [complaint, setComplaint] = useState<ComplaintDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<ComplaintAttachmentInput[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const busyRef = useRef(false);
  const seqRef = useRef(0);
  const threadRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<ComplaintAttachmentDto | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!complaintId) return;
    const silent = opts?.silent === true;
    if (silent && busyRef.current) return;

    busyRef.current = true;
    const seq = ++seqRef.current;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await getComplaintById(complaintId);
      if (seq !== seqRef.current) return;
      setComplaint(data);
      setError('');
    } catch (err) {
      if (seq !== seqRef.current || silent) return;
      const message = err instanceof ApiError ? err.message : 'Failed to load complaint';
      setError(message);
      setComplaint(null);
    } finally {
      if (seq === seqRef.current) {
        busyRef.current = false;
        if (!silent) setLoading(false);
      }
    }
  }, [complaintId]);

  useEffect(() => {
    void load();

    const poll = () => {
      if (document.hidden) return;
      void load({ silent: true });
    };
    const timer = window.setInterval(poll, 5000);
    const onVisibility = () => {
      if (!document.hidden) void load({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);

  useEffect(() => {
    const msgs = [...(complaint?.messages ?? [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const lastId = msgs.at(-1)?.message_id ?? null;
    const el = threadRef.current;
    if (!el) return;
    if (lastId === lastMessageIdRef.current) return;
    const instant = lastMessageIdRef.current === null;
    lastMessageIdRef.current = lastId;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: instant ? 'auto' : 'smooth' });
    });
  }, [complaint, loading]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      toast('Maximum 5 attachments allowed', 'error');
      return;
    }

    setUploading(true);
    try {
      const selected = Array.from(files).slice(0, remaining);
      const uploaded: ComplaintAttachmentInput[] = [];
      for (const file of selected) {
        const result = await uploadMediaToS3(file);
        uploaded.push({
          url: result.url,
          mediaType: result.mediaType,
          sortOrder: attachments.length + uploaded.length,
        });
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleReply = async () => {
    if (!complaint) return;
    const text = body.trim();
    if (!text) {
      toast('Message is required', 'error');
      return;
    }
    if (text.length > MAX_BODY) {
      toast(`Message must be at most ${MAX_BODY} characters`, 'error');
      return;
    }

    seqRef.current += 1;
    busyRef.current = true;
    setSending(true);
    try {
      const updated = await replyToComplaint(complaint.complaint_id, {
        body: text,
        attachments: attachments.map((a, i) => ({ ...a, sortOrder: i })),
      });
      setComplaint(updated);
      setBody('');
      setAttachments([]);
      toast('Reply sent');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to send reply', 'error');
    } finally {
      busyRef.current = false;
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!complaint) return;
    seqRef.current += 1;
    busyRef.current = true;
    setResolving(true);
    try {
      const note = resolveNote.trim();
      const updated = await resolveComplaint(complaint.complaint_id, {
        note: note || null,
      });
      setComplaint(updated);
      setResolveOpen(false);
      setResolveNote('');
      toast('Complaint resolved');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to resolve complaint', 'error');
    } finally {
      busyRef.current = false;
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-ink-500">
        <Loader2 className="size-5 animate-spin" />
        Loading complaint...
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <EmptyState
        title="Complaint not found"
        description={error || 'This ticket could not be loaded.'}
        actionLabel="Back to Complaints"
        onAction={() => navigate('/complaints')}
      />
    );
  }

  const canReply = complaint.can_reply && complaint.status !== ComplaintStatus.Resolved;
  const canResolve = complaint.status !== ComplaintStatus.Resolved;
  const messages = [...(complaint.messages || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <div>
      <PageHeader
        title={complaint.complaint_number}
        subtitle={`${complaint.order_number} · ${complaint.store_name}`}
        actions={
          <>
            <Button
              variant="outline"
              icon={<ArrowLeft className="size-4" />}
              onClick={() => navigate('/complaints')}
            >
              Back
            </Button>
            {canResolve && (
              <Button variant="danger" onClick={() => setResolveOpen(true)}>
                Resolve
              </Button>
            )}
          </>
        }
      />

      <div className="mb-5 rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone={complaintStatusTone(complaint.status)}>{complaint.status_text}</Badge>
          {!canReply && <Badge tone="neutral">View only</Badge>}
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Order', complaint.order_number, `/orders/${complaint.order_id}`],
            ['Store', complaint.store_name, null],
            ['Customer', complaint.customer_name, null],
            ['Phone', complaint.customer_phone, null],
            ['Created', formatDateTime(complaint.created_at), null],
            ['Updated', formatDateTime(complaint.updated_at), null],
          ].map(([label, value, href]) => (
            <div key={label} className="rounded-xl bg-ink-50 px-4 py-3">
              <dt className="text-[10px] font-medium tracking-wide text-ink-400 uppercase">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink-800">
                {href ? (
                  <Link to={href} className="text-brand-600 hover:text-brand-700">
                    {value || '—'}
                  </Link>
                ) : (
                  value || '—'
                )}
              </dd>
            </div>
          ))}
        </dl>
        {complaint.resolve_note && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-500/30 dark:bg-green-500/10">
            <p className="text-xs font-semibold tracking-wide text-green-700 uppercase dark:text-green-300">
              Resolve note
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-green-800 dark:text-green-200">
              {complaint.resolve_note}
            </p>
            {complaint.resolved_at && (
              <p className="mt-1 text-xs text-green-600/80">
                Resolved {formatDateTime(complaint.resolved_at)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex h-[min(80rem,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-sm">
        <h2 className="shrink-0 px-4 pt-2.5 pb-1 font-display text-sm font-bold text-ink-900 sm:px-5">
          Conversation
        </h2>
        <div
          ref={threadRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
        >
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.message_id}
                message={msg}
                onPreview={setPreview}
              />
            ))
          )}
        </div>

        {canReply ? (
          <div className="shrink-0 border-t border-ink-100 px-3 py-2 sm:px-4">
            {attachments.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-1.5">
                {attachments.map((a, i) => (
                  <li
                    key={`${a.url}-${i}`}
                    className="relative size-12 overflow-hidden rounded-lg ring-1 ring-ink-100"
                  >
                    {a.mediaType === 'video' ? (
                      <video src={a.url} className="size-full object-cover" />
                    ) : (
                      <img src={a.url} alt="" className="size-full object-cover" />
                    )}
                    <button
                      type="button"
                      className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-stretch gap-2">
              <div className="relative min-w-0 flex-1">
                <textarea
                  placeholder="Write a reply…"
                  value={body}
                  maxLength={MAX_BODY}
                  rows={2}
                  onChange={(e) => setBody(e.target.value)}
                  className="h-full min-h-[4.25rem] w-full resize-none rounded-xl border border-ink-200 bg-surface px-3 py-2 pr-14 text-sm text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-3 focus:ring-brand-500/15"
                />
                <span className="pointer-events-none absolute right-2 bottom-1.5 text-[10px] text-ink-400">
                  {body.trim().length}/{MAX_BODY}
                </span>
              </div>
              <div className="flex w-[7.25rem] shrink-0 flex-col gap-1.5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleFiles(e.target.files)}
                />
                <Button
                  className="h-auto min-h-0 flex-1 w-full"
                  size="sm"
                  icon={<Send className="size-3.5" />}
                  loading={sending}
                  disabled={uploading}
                  onClick={() => void handleReply()}
                >
                  Send
                </Button>
                <Button
                  className="h-auto min-h-0 flex-1 w-full"
                  size="sm"
                  variant="outline"
                  icon={<ImagePlus className="size-3.5" />}
                  loading={uploading}
                  disabled={attachments.length >= MAX_ATTACHMENTS}
                  onClick={() => fileRef.current?.click()}
                >
                  Attach
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mx-4 mb-4 shrink-0 rounded-xl bg-ink-50 px-4 py-3 text-center text-xs text-ink-400 sm:mx-5">
            This ticket is resolved. Composer is hidden until the customer replies and reopens it.
          </p>
        )}
      </div>

      <MediaPreview item={preview} onClose={() => setPreview(null)} />

      <Modal
        open={resolveOpen}
        onClose={() => {
          if (resolving) return;
          setResolveOpen(false);
          setResolveNote('');
        }}
        title="Resolve complaint?"
        description="Customer cannot open another complaint on this order. Resolve only if fully done."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              disabled={resolving}
              onClick={() => {
                setResolveOpen(false);
                setResolveNote('');
              }}
            >
              Keep Open
            </Button>
            <Button variant="danger" loading={resolving} onClick={() => void handleResolve()}>
              Resolve
            </Button>
          </>
        }
      >
        <Textarea
          label="Resolve note (optional)"
          placeholder="e.g. Replacement sent / refund processed"
          value={resolveNote}
          maxLength={1000}
          onChange={(e) => setResolveNote(e.target.value)}
          rows={3}
        />
      </Modal>
    </div>
  );
}
