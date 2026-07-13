/**
 * Types for the AlMazoon API, transcribed from `components.schemas` in the live
 * OpenAPI document. Where the spec declares a `200` with no schema, the shape was
 * read off the live server and is marked as such. Nothing here is `any`.
 *
 * Only the DTOs this admin actually consumes are declared. The backend also
 * exposes analytics (`VisitorStatsDto`, `SearchAnalyticsDto`, the audit log) and
 * the comment-moderation DTOs — those screens were removed from the product, so
 * carrying their types would be carrying a map to rooms that no longer exist.
 */

/* -------------------------------------------------------------------------- */
/* Articles                                                                    */
/* -------------------------------------------------------------------------- */

export interface ArticleDto {
  _id: string;
  title: string;
  content: string;
  /** Bare filename. `imageUrl` is the resolved absolute URL. Both are nullable —
   *  a fatwa legitimately has no image. */
  image: string | null;
  imageUrl: string | null;
  views: number;
  commentCount: number;
  lastViewedAt: string | null;
  lastCommentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `GET /api/articles/get-articles` — envelope confirmed against the live server. */
export interface ArticlesEnvelope {
  articles: ArticleDto[];
  currentPage: number;
  totalPages: number;
}

export interface ArticleViewCountDto {
  id: string;
  views: number;
  counted: boolean;
}

export interface ArticleFormValues {
  title: string;
  content: string;
  image?: File | null;
  removeImage?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Questions                                                                   */
/* -------------------------------------------------------------------------- */

export interface QuestionDto {
  _id: string;
  name: string;
  question: string;
  response: string | null;
  createdAt: string;
}

/**
 * `GET /api/questions/get-questions` → `{status, data}`.
 * There is no pagination in the body; totals arrive as `X-Total-Count` and
 * `X-Total-Pages` response headers.
 */
export interface QuestionsEnvelope {
  status: string;
  data: QuestionDto[];
}

/**
 * `GET /api/questions/my` — the caller's own questions, scoped server-side to the
 * HttpOnly `visitor_id` cookie. The client sends no identifier and cannot ask for
 * anyone else's list; that is the whole privacy guarantee, and the server enforces it.
 */
export interface MyQuestionDto {
  _id: string;
  name: string;
  question: string;
  response: string | null;
  status: string;
  createdAt: string;
  answeredAt: string | null;
  /** The answer has not been seen by this visitor yet. Drives the badge. */
  isNew: boolean;
}

export interface MyQuestionsDto {
  status: string;
  data: MyQuestionDto[];
  total: number;
  pending: number;
  answered: number;
  unseenAnswers: number;
}

export interface CreateQuestionRequest {
  name: string;
  question: string;
}

export interface AnswerQuestionRequest {
  response: string;
}

/**
 * The spec types this filter as a bare `integer` enum (0|1|2) with no names, so
 * the meaning of each number is not recoverable from the document. The API's enum
 * binder accepts names, and a name is the only form whose meaning we can stand
 * behind — verified against the live server (`?status=Pending` returns pending).
 */
export const QuestionStatus = {
  All: "All",
  Pending: "Pending",
  Answered: "Answered",
} as const;

export type QuestionStatus = (typeof QuestionStatus)[keyof typeof QuestionStatus];

/* -------------------------------------------------------------------------- */
/* Comments                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A comment on a fatwa, as returned threaded by `GET /api/articles/{id}/comments`.
 *
 * There is no `isApproved`: moderation was removed from the backend, and a comment
 * is public the moment it is written. Verified against the live API — an anonymous
 * caller and the admin now receive the identical list.
 *
 * `isMine` is resolved by the server. This client never filters on it, or on
 * anything else: a client that decides for itself which comments are fit to show
 * is a client that can be made to show the wrong ones.
 */
export interface CommentDto {
  _id: string;
  articleId: string;
  parentCommentId: string | null;
  name: string;
  comment: string;
  createdAt: string;
  adminReply: string | null;
  adminRepliedAt: string | null;
  isMine: boolean;
  replies: CommentDto[];
}

export interface CreateCommentRequest {
  name: string;
  comment: string;
  parentCommentId?: string | null;
}

/**
 * A row of `GET /api/dashboard/comments` — the admin's flat comment list.
 *
 * Deliberately not a `CommentDto`: it is a management view, not a conversation.
 * It carries the fatwa's title so the page does not have to fetch every article
 * to caption a row.
 */
export interface AdminCommentDto {
  _id: string;
  name: string;
  comment: string;
  articleTitle: string;
  articleId: string;
  createdAt: string;
  adminReply: string | null;
  adminRepliedAt: string | null;
  isReply: boolean;
}

/** `GET /api/dashboard/comments` — undocumented `200`; shape read off the server. */
export interface AdminCommentsEnvelope {
  status: string;
  data: AdminCommentDto[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

export interface NotificationDto {
  _id: string;
  /** Server-defined discriminator (new question, new comment, …). No enum in the spec. */
  type: string;
  message: string;
  targetId: string | null;
  articleId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListDto {
  data: NotificationDto[];
  unreadCount: number;
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

export interface QuestionTotalsDto {
  pending: number;
  answered: number;
  total: number;
}

export interface ArticleTotalsDto {
  total: number;
  totalViews: number;
  totalComments: number;
}

/**
 * Note the fields: `replied` / `awaitingReply`, not `pending` / `approved`.
 * The backend dropped moderation, so a comment is no longer "pending approval" —
 * it is either answered by the Ma'zoun or still waiting for him.
 */
export interface CommentTotalsDto {
  total: number;
  replied: number;
  awaitingReply: number;
}

export interface VisitorTotalsDto {
  today: number;
  week: number;
  month: number;
  total: number;
}

export interface ArticleRankDto {
  id: string;
  title: string;
  views: number;
  commentCount: number;
}

export interface ActivityDto {
  type: string;
  id: string;
  message: string;
  at: string;
  articleId: string | null;
}

export interface DashboardOverviewDto {
  questions: QuestionTotalsDto;
  articles: ArticleTotalsDto;
  comments: CommentTotalsDto;
  visitors: VisitorTotalsDto;
  mostViewedArticles: ArticleRankDto[];
  mostCommentedArticles: ArticleRankDto[];
  recentActivity: ActivityDto[];
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartsDto {
  visitorsPerDay: ChartPoint[];
  articleViewsPerDay: ChartPoint[];
  questionsPerDay: ChartPoint[];
  articlesPerMonth: ChartPoint[];
  commentsPerDay: ChartPoint[];
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

export interface LoginRequest {
  email: string;
  password: string;
}

/** The JWT is an HttpOnly cookie. The body carries no token, by design. */
export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

/**
 * RFC 7807 — what most 4xx/5xx return. Login is the exception: a bad password
 * answers with `{message, stack, correlationId}` instead, which is why the error
 * normaliser reads both shapes.
 */
export interface ProblemDetails {
  type: string | null;
  title: string | null;
  status: number | null;
  detail: string | null;
  instance: string | null;
}

/* -------------------------------------------------------------------------- */
/* Client-side view models                                                     */
/* -------------------------------------------------------------------------- */

/** What every paged list in the UI consumes, regardless of the wire envelope. */
export interface Paged<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalCount: number;
}
