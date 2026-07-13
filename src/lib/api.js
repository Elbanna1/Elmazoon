import axios from 'axios';
import { API_BASE_URL } from './config';

/**
 * Single HTTP client for the whole app.
 *
 * The baseURL used to be `process.env.server`, injected by next.config.js, which
 * meant the origin depended on the build phase: localhost:5000 in dev, a plain
 * HTTP DigitalOcean IP in production. It now comes from one config module and
 * points at one backend.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  // Without this a hung backend leaves the UI spinning forever.
  timeout: 12000,
  // The visitor's identity is an HttpOnly `visitor_id` cookie that the server
  // sets and resolves itself. Without credentials the cookie never travels, and
  // `/api/questions/my` and `/api/notifications/my` come back empty forever —
  // the visitor would never see their own answered question.
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

/**
 * Endpoint map — the public site's half of the API.
 *
 * The admin endpoints (login, check-authentication, sign-out, edit-response,
 * make-article, and the deletes) are gone from here along with the pages that
 * called them. Administration now lives in its own application (`admin/`), so
 * the public bundle no longer ships an admin surface at all.
 */
export const endpoints = {
  questions: '/api/questions/get-questions',
  createQuestion: '/api/questions/create-question',
  // Scoped server-side to the visitor_id cookie. No id is sent, and none can be —
  // it is not possible to construct a request for somebody else's questions.
  myQuestions: '/api/questions/my',

  articles: '/api/articles/get-articles',
  article: (id) => `/api/articles/${id}`,
  articleView: (id) => `/api/articles/${id}/view`,

  comments: (articleId) => `/api/articles/${articleId}/comments`,

  myNotifications: '/api/notifications/my',
  myNotificationsRead: '/api/notifications/my/read',

  visit: '/api/analytics/visit',
};

/**
 * The URL an article's cover image is served from.
 *
 * The backend is the source of truth: its `imageUrl` is used when present. The
 * fallback to `{API}/uploads/{image}` is the construction the OpenAPI document
 * itself prescribes ("`image` is a bare filename; the client builds the URL as
 * `{server}/uploads/{image}`"), and it keeps images rendering if `imageUrl` comes
 * back null on an older row.
 *
 * Both fields are nullable — an article legitimately has no image — so callers
 * must render a placeholder for null rather than an empty <img>.
 */
export function articleImage(article) {
  if (!article) return null;
  if (article.imageUrl) return article.imageUrl;
  if (article.image) return `${API_BASE_URL}/uploads/${article.image}`;
  return null;
}

/** Kept for callers that already hold a bare filename or an absolute URL. */
export function uploadUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE_URL}/uploads/${value}`;
}

/** Turns any axios failure into a short Arabic message we can show a user. */
export function toMessage(error, fallback = 'حدث خطأ غير متوقع. برجاء المحاولة مرة أخرى.') {
  if (error?.code === 'ECONNABORTED') return 'انتهت مهلة الاتصال بالخادم. تحقّق من اتصالك بالإنترنت.';
  if (error?.response?.status === 401) return 'انتهت صلاحية الجلسة. برجاء تسجيل الدخول من جديد.';
  if (error?.response?.status === 404) return 'العنصر المطلوب غير موجود.';
  if (!error?.response) return 'تعذّر الوصول إلى الخادم.';
  return error.response?.data?.message || fallback;
}
