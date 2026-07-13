import { api } from "@/lib/api";
import { endpoints } from "@/services/endpoints";
import type {
  AdminCommentDto,
  AdminCommentsEnvelope,
  CommentDto,
  CreateCommentRequest,
  Paged,
} from "@/types/api";

export interface AdminCommentsParams {
  page: number;
  limit: number;
}

export const commentsService = {
  /** Comments on one fatwa, threaded by the server (`replies` is nested). */
  async forArticle(articleId: string): Promise<CommentDto[]> {
    const { data } = await api.get<CommentDto[]>(endpoints.comments.forArticle(articleId));
    return Array.isArray(data) ? data : [];
  },

  async create(articleId: string, body: CreateCommentRequest): Promise<CommentDto> {
    const { data } = await api.post<CommentDto>(endpoints.comments.create(articleId), body);
    return data;
  },

  /**
   * Every comment on the site, flat and paged, for the admin list.
   *
   * This used to be assembled by walking the fatwas and asking each one for its
   * comments — one request per fatwa, because no admin-wide comment endpoint
   * existed. The backend has since added `GET /api/dashboard/comments`, which
   * returns the same rows in a single paged request and carries `articleTitle`,
   * so the page no longer has to fetch an article just to caption a row.
   */
  async all({ page, limit }: AdminCommentsParams): Promise<Paged<AdminCommentDto>> {
    const { data } = await api.get<AdminCommentsEnvelope>(endpoints.comments.adminList, {
      params: { page, limit },
    });

    const items = data?.data ?? [];
    return {
      items,
      page: data?.currentPage ?? page,
      totalPages: data?.totalPages ?? 1,
      totalCount: data?.totalItems ?? items.length,
    };
  },

  /** The Ma'zoun's public reply beneath a comment. */
  async reply(id: string, reply: string): Promise<CommentDto> {
    const { data } = await api.post<CommentDto>(endpoints.comments.reply(id), { reply });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(endpoints.comments.remove(id));
  },
};
