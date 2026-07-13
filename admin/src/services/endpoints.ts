/**
 * Every path this app calls, in one place.
 *
 * Paths only — never an origin. The origin lives in `lib/config.ts` and is applied
 * by the BFF proxy. If a host name ever appears in this file, the promise that
 * NEXT_PUBLIC_API_URL alone repoints the app has been broken.
 *
 * Every entry here is called by something. Endpoints the backend exposes but this
 * admin does not use — `/api/dashboard/stats`, `/api/dashboard/analytics`,
 * `/api/analytics/visitors`, `/api/analytics/searches`,
 * `/api/articles/comments/pending`, `/api/articles/comments/{id}/approve`,
 * `POST /api/articles/{id}/view` — are deliberately absent: `stats` and `analytics`
 * are strict subsets of `dashboard/overview`, which the dashboard already fetches
 * in one call, and the visitor/search screens and the comment-moderation flow were
 * removed from the product. A route map that lists calls nobody makes is a map you
 * cannot trust.
 *
 * The unidiomatic names (`get-questions`, `make-article`, `edit-response`) are the
 * backend's own and are kept verbatim.
 */
export const endpoints = {
  auth: {
    login: "/api/admin/login",
    checkAuthentication: "/api/admin/check-authentication",
    refresh: "/api/admin/refresh",
    // The one route not under /api.
    signOut: "/sign-out",
  },

  dashboard: {
    overview: "/api/dashboard/overview",
    charts: "/api/dashboard/charts",
  },

  questions: {
    list: "/api/questions/get-questions",
    // Scoped server-side to the visitor_id cookie. No id is ever sent.
    mine: "/api/questions/my",
    create: "/api/questions/create-question",
    answer: (id: string) => `/api/questions/${id}/edit-response`,
    remove: (id: string) => `/api/questions/${id}/delete-question`,
  },

  articles: {
    list: "/api/articles/get-articles",
    byId: (id: string) => `/api/articles/${id}`,
    create: "/api/articles/make-article",
    update: (id: string) => `/api/articles/${id}`,
    remove: (id: string) => `/api/articles/${id}/delete-article`,
    views: (id: string) => `/api/articles/${id}/views`,
  },

  comments: {
    forArticle: (articleId: string) => `/api/articles/${articleId}/comments`,
    create: (articleId: string) => `/api/articles/${articleId}/comments`,
    // The admin's flat, paged list. Lives under /dashboard, not /articles.
    adminList: "/api/dashboard/comments",
    reply: (id: string) => `/api/articles/comments/${id}/reply`,
    remove: (id: string) => `/api/articles/comments/${id}`,
  },

  notifications: {
    // The admin's own feed.
    admin: "/api/notifications",
    adminRead: "/api/notifications/read",
    // The visitor's, scoped to the visitor_id cookie.
    mine: "/api/notifications/my",
    mineRead: "/api/notifications/my/read",
  },

  analytics: {
    // The record of what each admin did, and when. The visitor/search analytics
    // this endpoint's siblings expose (`/visitors`, `/searches`) are live and
    // working, but nothing in this app reads them — there is no screen for them.
    auditLog: "/api/analytics/audit-log",
  },
} as const;
