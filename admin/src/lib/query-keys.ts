import type { AuditLogParams } from "@/services/analytics.service";
import type { ArticleListParams } from "@/services/articles.service";
import type { AdminCommentsParams } from "@/services/comments.service";
import type { QuestionListParams } from "@/services/questions.service";

/**
 * One hierarchy for every cached query.
 *
 * Keys nest so a mutation can invalidate a whole area at once — answering a
 * question drops every page and filter of the questions list, and the dashboard
 * too, because its pending/answered counts just moved.
 */
export const qk = {
  auth: ["auth"] as const,

  dashboard: {
    all: ["dashboard"] as const,
    overview: (recentCount: number) => ["dashboard", "overview", recentCount] as const,
    charts: (days: number, months: number) => ["dashboard", "charts", days, months] as const,
  },

  questions: {
    all: ["questions"] as const,
    list: (params: QuestionListParams) => ["questions", "list", params] as const,
  },

  articles: {
    all: ["articles"] as const,
    list: (params: ArticleListParams) => ["articles", "list", params] as const,
    detail: (id: string) => ["articles", "detail", id] as const,
  },

  comments: {
    all: ["comments"] as const,
    forArticle: (articleId: string) => ["comments", "article", articleId] as const,
    adminList: (params: AdminCommentsParams) => ["comments", "admin", params] as const,
  },

  notifications: {
    all: ["notifications"] as const,
    admin: (unreadOnly: boolean, take: number) =>
      ["notifications", "admin", unreadOnly, take] as const,
  },

  auditLog: {
    all: ["audit-log"] as const,
    list: (params: AuditLogParams) => ["audit-log", "list", params] as const,
  },
} as const;
