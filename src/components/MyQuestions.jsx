import { useCallback, useEffect, useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { QuestionSkeleton } from '@/components/ui/Skeleton';
import { SectionHeading } from '@/components/ui/Layout';
import QuestionCard from '@/components/QuestionCard';
import { api, endpoints, toMessage } from '@/lib/api';

/**
 * "أسئلتي" — the questions this visitor asked, and their answers.
 *
 * This is real privacy, enforced by the backend rather than simulated here:
 * `GET /api/questions/my` is scoped to the HttpOnly `visitor_id` cookie that the
 * server sets and resolves itself. The client sends no identifier and *cannot*
 * ask for anyone else's list — there is no parameter to put someone else's id in.
 *
 * It replaces the previous localStorage list, which could only ever be a
 * convenience: it tracked ids in the browser and still read the answers out of
 * the public feed.
 *
 * Renders nothing for a visitor who has never asked anything, which is most of them.
 */
export default function MyQuestions() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | idle | error
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const { data: payload } = await api.get(endpoints.myQuestions);
      setData(payload);
      setStatus('idle');
    } catch (err) {
      setError(toMessage(err, 'تعذّر تحميل أسئلتك.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();

    // A question submitted in this same session should appear here immediately.
    const refresh = () => load();
    window.addEventListener('questions:refresh', refresh);
    return () => window.removeEventListener('questions:refresh', refresh);
  }, [load]);

  /**
   * Marks the visitor's unseen answers as read, so the badge clears.
   *
   * Fire-and-forget: the visitor is looking at the answers right now, and a
   * failure to record that fact must not put an error in front of them.
   */
  const markSeen = useCallback(async () => {
    try {
      await api.post(endpoints.myNotificationsRead);
    } catch {
      /* Nothing the visitor can do about it, and nothing they need to know. */
    }
  }, []);

  useEffect(() => {
    if (status === 'idle' && (data?.unseenAnswers ?? 0) > 0) markSeen();
  }, [status, data?.unseenAnswers, markSeen]);

  // Never asked anything, or the backend has no cookie for this browser yet.
  if (status === 'idle' && (data?.total ?? 0) === 0) return null;

  // A failed fetch here must not push an error box at a visitor who may well have
  // no questions at all. Stay silent and let the public list carry the page.
  if (status === 'error' && !data) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-surface p-5">
        <Alert tone="error">{error}</Alert>
        <Button variant="secondary" className="mt-4" onClick={load}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const items = data?.data ?? [];
  const unseen = data?.unseenAnswers ?? 0;

  return (
    <div>
      <SectionHeading
        align="start"
        eyebrow="أسئلتي"
        title="الأسئلة التي أرسلتها"
        lede="تظهر هنا حالة كل سؤال أرسلته، وردّ المأذون عليه بمجرد نشره."
      />

      {status === 'idle' && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge>{`الإجمالي: ${data?.total ?? 0}`}</Badge>
          <Badge tone="gold">{`بانتظار الرد: ${data?.pending ?? 0}`}</Badge>
          <Badge tone="success">{`تم الرد: ${data?.answered ?? 0}`}</Badge>
          {unseen > 0 && <Badge tone="new">{`${unseen} رد جديد`}</Badge>}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {status === 'loading' &&
          Array.from({ length: 2 }).map((_, i) => <QuestionSkeleton key={i} />)}

        {status === 'idle' &&
          items.map((item) => (
            <QuestionCard
              key={item._id}
              question={item.question}
              commenter={item.name}
              commentedAt={item.createdAt}
              response={item.response}
              mine
              isNew={item.isNew}
            />
          ))}
      </div>
    </div>
  );
}

function Badge({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'border-ink-100 bg-surface text-ink-600',
    gold: 'border-gold-200 bg-gold-50 text-gold-700',
    success: 'border-success/20 bg-success/5 text-success',
    new: 'border-gold-300 bg-gold-100 text-gold-700',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
