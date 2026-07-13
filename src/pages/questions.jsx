import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Seo, { breadcrumbSchema, faqSchema, graph } from '@/components/Seo';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Accordion from '@/components/ui/Accordion';
import EmptyState from '@/components/ui/EmptyState';
import QuestionCard from '@/components/QuestionCard';
import MyQuestions from '@/components/MyQuestions';
import Reveal from '@/components/Reveal';
import { QuestionSkeleton } from '@/components/ui/Skeleton';
import { Input, Textarea } from '@/components/ui/Field';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { api, endpoints, toMessage } from '@/lib/api';
import { faqs, site } from '@/lib/site';

const PAGE_SIZE = 30;
const MAX_QUESTION = 1000;
const MAX_NAME = 60;

/**
 * Questions are now fetched on the server and revalidated, so the page ships
 * with its content already in the HTML. Previously every question was fetched
 * client-side in useEffect, which meant Google indexed an empty page — on a
 * site whose entire commercial value is being found when someone searches for a
 * ruling about زواج or طلاق.
 */
export async function getStaticProps() {
  try {
    const { data } = await api.get(endpoints.questions, {
      params: { page: 1, limit: PAGE_SIZE },
    });
    return {
      props: { initialQuestions: data?.data ?? [], initialError: false },
      revalidate: 60,
    };
  } catch {
    // The backend being unreachable must never fail the build. The page falls
    // back to fetching on the client.
    return { props: { initialQuestions: [], initialError: true }, revalidate: 30 };
  }
}

export default function QuestionsPage({ initialQuestions, initialError }) {
  return (
    <>
      <Seo
        title="اسأل المأذون"
        description="اسأل المأذون الشرعي عن شروط الزواج وإجراءات كتب الكتاب وتوثيق العقد واستخراج قسيمة الزواج — وتصفّح إجابات الأسئلة الشائعة."
        jsonLd={graph(
          faqSchema(faqs),
          breadcrumbSchema([
            { name: 'الرئيسية', path: '/' },
            { name: 'اسأل المأذون', path: '/questions' },
          ]),
        )}
      />

      <Section spacing="tight" className="pt-12 sm:pt-16">
        <Container size="narrow">
          <Reveal>
            <SectionHeading
              as="h1"
              eyebrow="اسأل المأذون"
              title="اسأل المأذون الشرعي"
              lede="اكتب سؤالك عن الزواج أو الطلاق أو التوثيق، وسيتم الرد عليه ونشره في القائمة أدناه ليستفيد منه غيرك."
            />
          </Reveal>
        </Container>
      </Section>

      <Section spacing="tight" className="pt-0">
        <Container size="narrow">
          <Reveal>
            <AskForm />
          </Reveal>
        </Container>
      </Section>

      {/* Renders nothing for a visitor who has never asked anything. */}
      <Section spacing="tight" className="pt-0">
        <Container size="narrow">
          <MyQuestions />
        </Container>
      </Section>

      <Section className="border-t border-ink-100 bg-surface" aria-labelledby="faq-heading">
        <Container size="narrow">
          <Reveal>
            <SectionHeading id="faq-heading" eyebrow="الأسئلة الشائعة" title="قبل أن تسأل" />
          </Reveal>
          <Reveal delay={80} className="mt-10">
            <Accordion items={faqs} />
          </Reveal>
        </Container>
      </Section>

      <Section aria-labelledby="answers-heading">
        <Container size="narrow">
          <QuestionList initialQuestions={initialQuestions} initialError={initialError} />
        </Container>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ */

function AskForm() {
  const [values, setValues] = useState({ name: '', question: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [message, setMessage] = useState('');

  const validate = () => {
    const next = {};
    const name = values.name.trim();
    const question = values.question.trim();

    if (!name) next.name = 'برجاء كتابة اسمك.';
    else if (name.length < 2) next.name = 'الاسم قصير جدًا.';

    // The old form accepted "أ" as a valid question — `required` was its only check.
    if (!question) next.question = 'برجاء كتابة سؤالك.';
    else if (question.length < 10) next.question = 'اكتب سؤالك بتفصيل أكثر (١٠ أحرف على الأقل).';
    else if (question.length > MAX_QUESTION) next.question = `الحد الأقصى ${MAX_QUESTION} حرف.`;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error as soon as the user starts fixing it.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === 'submitting') return;
    if (!validate()) return;

    setStatus('submitting');
    setMessage('');

    try {
      // The server ties this question to the visitor's HttpOnly `visitor_id`
      // cookie on its own — `withCredentials: true` on the axios instance is the
      // whole of the client's part in it. Nothing is stored in the browser.
      await api.post(endpoints.createQuestion, {
        name: values.name.trim(),
        question: values.question.trim(),
      });

      setStatus('success');
      setMessage('تم إرسال سؤالك بنجاح، وسيظهر الرد هنا بعد مراجعة المأذون.');
      setValues({ name: '', question: '' });

      // The old code called router.reload() 1.5s after submitting — a full
      // browser reload that threw away the whole page. Telling the list to
      // refetch is enough.
      window.dispatchEvent(new Event('questions:refresh'));
    } catch (error) {
      setStatus('error');
      setMessage(toMessage(error, 'تعذّر إرسال سؤالك. برجاء المحاولة مرة أخرى.'));
    }
  };

  const remaining = MAX_QUESTION - values.question.length;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-ink-100 bg-surface p-6 shadow-card sm:p-8"
    >
      <div className="space-y-5">
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
          label="سؤالك"
          name="question"
          value={values.question}
          onChange={onChange}
          error={errors.question}
          maxLength={MAX_QUESTION}
          rows={5}
          placeholder="اشرح سؤالك بوضوح…"
          hint={`متبقٍ ${remaining} حرف`}
          required
        />
      </div>

      {status === 'success' && (
        <Alert tone="success" className="mt-5">
          {message}
        </Alert>
      )}
      {status === 'error' && (
        <Alert tone="error" className="mt-5">
          {message}
        </Alert>
      )}

      <div className="mt-6 flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-xs leading-relaxed text-ink-400">
          سيظهر سؤالك واسمك للجميع في قائمة الأسئلة.
        </p>
        <Button type="submit" size="lg" loading={status === 'submitting'} className="w-full sm:w-auto">
          {status === 'submitting' ? 'جارٍ الإرسال…' : 'أرسل سؤالك'}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function QuestionList({ initialQuestions, initialError }) {
  const [items, setItems] = useState(initialQuestions);
  const [page, setPage] = useState(1);
  // If the server had no data (backend down at build time), fetch on mount.
  const [status, setStatus] = useState(initialError ? 'loading' : 'idle');
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(initialQuestions.length === PAGE_SIZE);
  const didMount = useRef(false);

  const load = useCallback(async (targetPage, { append }) => {
    setStatus(append ? 'loadingMore' : 'loading');
    setError('');

    try {
      const { data } = await api.get(endpoints.questions, {
        params: { page: targetPage, limit: PAGE_SIZE },
      });
      const batch = data?.data ?? [];

      // The old "Load More" called setData(batch) — it *replaced* the list
      // instead of appending, so clicking it erased what you were reading, and
      // clicking past the last page left a blank screen.
      setItems((prev) => (append ? [...prev, ...batch] : batch));
      setHasMore(batch.length === PAGE_SIZE);
      setPage(targetPage);
      setStatus('idle');
    } catch (err) {
      setError(toMessage(err, 'تعذّر تحميل الأسئلة.'));
      setStatus('error');
    }
  }, []);

  // Refetch when a new question is submitted, and hydrate if SSR came back empty.
  useEffect(() => {
    const refresh = () => load(1, { append: false });
    window.addEventListener('questions:refresh', refresh);

    if (!didMount.current) {
      didMount.current = true;
      if (initialError) refresh();
    }

    return () => window.removeEventListener('questions:refresh', refresh);
  }, [load, initialError]);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | answered | pending

  const answeredCount = useMemo(() => items.filter((q) => q.response).length, [items]);

  /**
   * Search and filter run over the questions already loaded, not over the whole
   * collection — the backend exposes no search endpoint, and inventing one here
   * would break the contract. "عرض المزيد" stays available while searching so a
   * match further down the list is still reachable.
   */
  const visible = useMemo(() => {
    const needle = normalize(query);

    return items.filter((q) => {
      if (filter === 'answered' && !q.response) return false;
      if (filter === 'pending' && q.response) return false;
      if (!needle) return true;

      return (
        normalize(q.question).includes(needle) ||
        normalize(q.response).includes(needle) ||
        normalize(q.name).includes(needle)
      );
    });
  }, [items, query, filter]);

  const isInitialLoading = status === 'loading' && items.length === 0;
  const isFiltering = Boolean(query.trim()) || filter !== 'all';

  const tabs = [
    { id: 'all', label: 'الكل', count: items.length },
    { id: 'answered', label: 'تمت الإجابة', count: answeredCount },
    { id: 'pending', label: 'بانتظار الرد', count: items.length - answeredCount },
  ];

  return (
    <>
      <Reveal>
        <SectionHeading
          id="answers-heading"
          eyebrow="الأسئلة"
          title="أسئلة الناس وإجابات المأذون"
        />
      </Reveal>

      {items.length > 0 && (
        <Reveal delay={60} className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchField value={query} onChange={setQuery} />

            <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية الأسئلة">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  aria-pressed={filter === tab.id}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-200 ease-premium ${
                    filter === tab.id
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-100 bg-surface text-ink-600 hover:border-ink-200 hover:text-ink-900'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ltr-nums rounded px-1.5 text-xs ${
                      filter === tab.id ? 'bg-white/15' : 'bg-ink-50 text-ink-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Announce result counts to screen readers, which otherwise get no signal
          that typing in the search box changed the list below it. */}
      <p aria-live="polite" className="sr-only">
        {isFiltering ? `${visible.length} نتيجة` : ''}
      </p>

      <div className="mt-8 space-y-4">
        {isInitialLoading &&
          Array.from({ length: 3 }).map((_, i) => <QuestionSkeleton key={i} />)}

        {!isInitialLoading &&
          visible.map((q, i) => (
            <Reveal key={q._id} delay={Math.min(i, 4) * 60}>
              <QuestionCard
                question={q.question}
                commenter={q.name}
                commentedAt={q.createdAt}
                response={q.response}
                highlight={query}
              />
            </Reveal>
          ))}

        {status === 'loadingMore' &&
          Array.from({ length: 2 }).map((_, i) => <QuestionSkeleton key={`more-${i}`} />)}
      </div>

      {status === 'error' && items.length === 0 && (
        <div className="mt-6 space-y-4">
          <Alert tone="error">{error}</Alert>
          <div className="text-center">
            <Button variant="secondary" onClick={() => load(1, { append: false })}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      )}

      {status === 'idle' && items.length === 0 && (
        <EmptyState
          className="mt-6"
          title="لا توجد أسئلة بعد"
          description="كن أول من يطرح سؤالًا على المأذون الشرعي."
        />
      )}

      {/* A filtered-to-nothing list is a different state from an empty database,
          and it needs a way out — not just a blank panel. */}
      {status !== 'loading' && items.length > 0 && visible.length === 0 && (
        <EmptyState
          className="mt-6"
          title="لا توجد نتائج مطابقة"
          description={
            query.trim()
              ? `لم نعثر على سؤال يطابق «${query.trim()}». جرّب كلمة أخرى، أو حمّل المزيد من الأسئلة.`
              : 'لا توجد أسئلة في هذا التصنيف.'
          }
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
            >
              إلغاء التصفية
            </Button>
          }
        />
      )}

      {items.length > 0 && (
        <div className="mt-10 text-center">
          {hasMore ? (
            <Button
              variant="secondary"
              size="lg"
              loading={status === 'loadingMore'}
              onClick={() => load(page + 1, { append: true })}
            >
              عرض المزيد
            </Button>
          ) : (
            // The old button never told you it had run out.
            <p className="text-sm text-ink-400">لا توجد أسئلة أخرى.</p>
          )}
          {status === 'error' && <Alert tone="error" className="mt-5 text-start">{error}</Alert>}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Arabic search needs normalising or it simply does not match:
 * a user typing `اسلام` will never find `إسلام`, and `ة` vs `ه` splits half the
 * vocabulary in two. This folds the alef/ya/ta-marbuta variants together and
 * strips the diacritics and tatweel that appear in written fatwa text.
 */
function normalize(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '') // harakat + tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

function SearchField({ value, onChange }) {
  const id = useId();

  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor={id} className="sr-only">
        ابحث في الأسئلة
      </label>
      <span
        className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-ink-300"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-[1.125rem] w-[1.125rem]">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </span>

      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ابحث في الأسئلة…"
        className="h-11 w-full rounded-lg border border-ink-100 bg-surface ps-10 pe-10 text-[0.9375rem] text-ink-900 placeholder:text-ink-300 transition-[border-color,box-shadow] duration-200 ease-premium focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="مسح البحث"
          className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-ink-300 transition-colors hover:text-ink-700"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
