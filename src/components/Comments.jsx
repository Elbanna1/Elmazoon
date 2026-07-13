import { useCallback, useEffect, useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Input, Textarea } from '@/components/ui/Field';
import Skeleton from '@/components/ui/Skeleton';
import { api, endpoints, toMessage } from '@/lib/api';

const MAX_COMMENT = 1000;
const MAX_NAME = 60;

/**
 * Comments on a fatwa.
 *
 * There is no moderation. The backend publishes a comment the moment it is
 * written — verified against the live API: an anonymous caller and the admin now
 * receive the identical list, and `isApproved` has been removed from the DTO
 * entirely. The Ma'zoun's only powers over a comment are to reply or to delete.
 *
 * So this renders exactly what the server sends and filters nothing. A client
 * that decides for itself which comments are fit to show is a client that can be
 * made to show the wrong ones.
 */
export default function Comments({ articleId, initialCount = 0 }) {
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | idle | error
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const { data } = await api.get(endpoints.comments(articleId));
      setComments(Array.isArray(data) ? data : []);
      setStatus('idle');
    } catch (err) {
      setError(toMessage(err, 'تعذّر تحميل التعليقات.'));
      setStatus('error');
    }
  }, [articleId]);

  useEffect(() => {
    load();
  }, [load]);

  // Count what is actually on screen once loaded; fall back to the article's
  // own commentCount before then, so the heading does not flash from 0.
  const count = status === 'idle' ? countAll(comments) : initialCount;

  return (
    <section aria-labelledby="comments-heading" className="mt-16">
      <h2
        id="comments-heading"
        className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl"
      >
        التعليقات
        {count > 0 && (
          <span className="ms-2 text-base font-normal text-ink-400">
            (<span className="ltr-nums">{count}</span>)
          </span>
        )}
      </h2>

      <div className="mt-6">
        <CommentForm
          articleId={articleId}
          parentCommentId={null}
          onPosted={load}
        />
      </div>

      <div className="mt-10">
        {status === 'loading' && (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <Alert tone="error">{error}</Alert>
            <Button variant="secondary" onClick={load}>
              إعادة المحاولة
            </Button>
          </div>
        )}

        {status === 'idle' && comments.length === 0 && (
          <EmptyState
            title="لا توجد تعليقات بعد"
            description="كن أول من يعلّق على هذه الفتوى."
          />
        )}

        {status === 'idle' && comments.length > 0 && (
          <ul className="space-y-6">
            {comments.map((comment) => (
              <li key={comment._id}>
                <Comment
                  comment={comment}
                  articleId={articleId}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  onPosted={load}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Top-level comments plus their nested replies. */
function countAll(comments) {
  return comments.reduce((total, c) => total + 1 + (c.replies?.length ?? 0), 0);
}

/* ------------------------------------------------------------------ */

function Comment({ comment, articleId, replyTo, setReplyTo, onPosted, depth = 0 }) {
  const initial = (comment.name || '؟').trim().charAt(0);
  const isReplying = replyTo === comment._id;

  return (
    <article
      className="rounded-2xl border border-ink-100 bg-surface p-5"
    >
      <header className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-50 text-sm font-semibold text-ink-500"
          aria-hidden="true"
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-900">
            {comment.name}
            {comment.isMine && (
              <span className="ms-2 text-xs font-normal text-gold-700">(تعليقك)</span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">
            <time dateTime={comment.createdAt} className="ltr-nums">
              {formatDate(comment.createdAt)}
            </time>
          </p>
        </div>
      </header>

      <p className="ugc mt-4 whitespace-pre-line text-[0.9375rem] leading-[1.95] text-ink-700">
        {comment.comment}
      </p>

      {comment.adminReply && (
        <div className="mt-4 rounded-xl border-e-2 border-gold-400 bg-gold-50/50 p-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-700">
            رد المأذون
          </p>
          <p className="ugc whitespace-pre-line text-[0.9375rem] leading-[1.95] text-ink-700">
            {comment.adminReply}
          </p>
        </div>
      )}

      {/* One level of nesting only. A reply-to-a-reply threads under the same
          parent, which is what the backend models (`parentCommentId` is a single
          id, not a path) — pretending to infinite depth would be a lie. */}
      {depth === 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setReplyTo(isReplying ? null : comment._id)}
            className="text-sm font-medium text-ink-500 transition-colors hover:text-gold-700"
          >
            {isReplying ? 'إلغاء' : 'رد'}
          </button>

          {isReplying && (
            <div className="mt-4">
              <CommentForm
                articleId={articleId}
                parentCommentId={comment._id}
                onPosted={() => {
                  setReplyTo(null);
                  onPosted();
                }}
                compact
              />
            </div>
          )}
        </div>
      )}

      {comment.replies?.length > 0 && (
        <ul className="mt-5 space-y-4 border-s border-ink-100 ps-5">
          {comment.replies.map((reply) => (
            <li key={reply._id}>
              <Comment
                comment={reply}
                articleId={articleId}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                onPosted={onPosted}
                depth={depth + 1}
              />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */

function CommentForm({ articleId, parentCommentId, onPosted, compact = false }) {
  const [values, setValues] = useState({ name: '', comment: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [message, setMessage] = useState('');

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    const name = values.name.trim();
    const comment = values.comment.trim();

    if (!name) next.name = 'برجاء كتابة اسمك.';
    else if (name.length < 2) next.name = 'الاسم قصير جدًا.';

    if (!comment) next.comment = 'برجاء كتابة تعليقك.';
    else if (comment.length < 3) next.comment = 'التعليق قصير جدًا.';
    else if (comment.length > MAX_COMMENT) next.comment = `الحد الأقصى ${MAX_COMMENT} حرف.`;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (status === 'submitting') return;
    if (!validate()) return;

    setStatus('submitting');
    setMessage('');

    try {
      await api.post(endpoints.comments(articleId), {
        name: values.name.trim(),
        comment: values.comment.trim(),
        parentCommentId,
      });

      setStatus('success');
      setMessage('تم نشر تعليقك.');
      setValues({ name: '', comment: '' });
      onPosted();
    } catch (err) {
      setStatus('error');
      setMessage(toMessage(err, 'تعذّر إرسال تعليقك.'));
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={`rounded-2xl border border-ink-100 bg-surface ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
    >
      <div className="space-y-4">
        <Input
          label="الاسم"
          name="name"
          value={values.name}
          onChange={onChange}
          error={errors.name}
          maxLength={MAX_NAME}
          autoComplete="name"
          placeholder="اكتب اسمك"
          required
        />
        <Textarea
          label={parentCommentId ? 'ردّك' : 'تعليقك'}
          name="comment"
          value={values.comment}
          onChange={onChange}
          error={errors.comment}
          maxLength={MAX_COMMENT}
          rows={compact ? 3 : 4}
          placeholder="اكتب تعليقك…"
          required
        />
      </div>

      {status === 'success' && (
        <Alert tone="success" className="mt-4">
          {message}
        </Alert>
      )}
      {status === 'error' && (
        <Alert tone="error" className="mt-4">
          {message}
        </Alert>
      )}

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-xs leading-relaxed text-ink-400">
          يظهر تعليقك على الفتوى فور إرساله.
        </p>
        <Button type="submit" loading={status === 'submitting'}>
          {status === 'submitting' ? 'جارٍ الإرسال…' : 'أرسل'}
        </Button>
      </div>
    </form>
  );
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
