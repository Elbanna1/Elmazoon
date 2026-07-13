import { api, readTotals } from "@/lib/api";
import { endpoints } from "@/services/endpoints";
import type {
  AnswerQuestionRequest,
  CreateQuestionRequest,
  MyQuestionsDto,
  Paged,
  QuestionDto,
  QuestionStatus,
  QuestionsEnvelope,
} from "@/types/api";

export interface QuestionListParams {
  page: number;
  limit: number;
  search?: string;
  status?: QuestionStatus;
}

export const questionsService = {
  /**
   * The questions envelope is `{ status, data }` with no pagination in it — the
   * totals come back as `X-Total-Count` / `X-Total-Pages` headers. Articles uses
   * a completely different envelope. Both are normalised to `Paged<T>` here so
   * that no component has to care which is which.
   */
  async list({ page, limit, search, status }: QuestionListParams): Promise<Paged<QuestionDto>> {
    const response = await api.get<QuestionsEnvelope>(endpoints.questions.list, {
      params: {
        page,
        limit,
        // Sending `search=""` is not the same as omitting it; omit it.
        ...(search?.trim() ? { search: search.trim() } : {}),
        ...(status && status !== "All" ? { status } : {}),
      },
    });

    const items = response.data?.data ?? [];
    const { totalCount, totalPages } = readTotals(response.headers, items.length);

    return { items, page, totalPages, totalCount };
  },

  /**
   * The caller's own questions.
   *
   * Identity comes from the HttpOnly `visitor_id` cookie that the server resolves
   * itself — no id is sent, and none can be. That is what makes this private: it is
   * not possible to construct a request for somebody else's questions.
   */
  async mine(): Promise<MyQuestionsDto> {
    const { data } = await api.get<MyQuestionsDto>(endpoints.questions.mine);
    return data;
  },

  /**
   * The OpenAPI document declares this `201` as a bare `QuestionDto`. It is not:
   * the live server returns `{ "status": "success", "data": { …QuestionDto } }`.
   * Typing it the way the spec claims silently yields `undefined` for `_id`, which
   * is exactly what happened — the created question could not be referred to.
   *
   * The server is the authority, so unwrap. Tolerate the documented shape too, in
   * case the backend is later corrected to match its own spec.
   */
  async create(body: CreateQuestionRequest): Promise<QuestionDto> {
    const { data } = await api.post<{ status?: string; data?: QuestionDto } | QuestionDto>(
      endpoints.questions.create,
      body,
    );

    if (data && typeof data === "object" && "data" in data && data.data) return data.data;
    return data as QuestionDto;
  },

  /** Publishes or corrects an answer. The backend treats both as the same call. */
  async answer(id: string, body: AnswerQuestionRequest): Promise<void> {
    await api.post(endpoints.questions.answer(id), body);
  },

  async remove(id: string): Promise<void> {
    await api.delete(endpoints.questions.remove(id));
  },
};
