import { api } from "@/lib/api";
import { UPLOAD_TIMEOUT_MS } from "@/lib/config";
import { endpoints } from "@/services/endpoints";
import type {
  ArticleDto,
  ArticleFormValues,
  ArticleViewCountDto,
  ArticlesEnvelope,
  Paged,
} from "@/types/api";

export interface ArticleListParams {
  page: number;
  limit: number;
  search?: string;
}

/**
 * Create and update are `multipart/form-data`, not JSON — the OpenAPI document is
 * explicit, and the fields are `title`, `content`, `image`, `removeImage`.
 * A JSON body here is rejected with a 400.
 */
function toFormData({ title, content, image, removeImage }: ArticleFormValues): FormData {
  const body = new FormData();
  body.append("title", title.trim());
  body.append("content", content.trim());

  // Appending a null/undefined file sends the literal string "null" and the
  // server stores it as a filename. Only append a real File.
  if (image instanceof File) body.append("image", image);
  if (removeImage) body.append("removeImage", "true");

  return body;
}

export const articlesService = {
  async list({ page, limit, search }: ArticleListParams): Promise<Paged<ArticleDto>> {
    const { data } = await api.get<ArticlesEnvelope>(endpoints.articles.list, {
      params: {
        page,
        limit,
        ...(search?.trim() ? { search: search.trim() } : {}),
      },
    });

    const items = data?.articles ?? [];
    const totalPages = data?.totalPages ?? 1;

    return {
      items,
      page: data?.currentPage ?? page,
      totalPages,
      // This endpoint returns pages but not a row count. Deriving one would mean
      // inventing a number on the last page, so report what we can stand behind.
      totalCount: totalPages > 1 ? totalPages * limit : items.length,
    };
  },

  async byId(id: string): Promise<ArticleDto> {
    const { data } = await api.get<ArticleDto>(endpoints.articles.byId(id));
    return data;
  },

  async create(values: ArticleFormValues): Promise<void> {
    await api.post(endpoints.articles.create, toFormData(values), {
      timeout: UPLOAD_TIMEOUT_MS,
    });
  },

  async update(id: string, values: ArticleFormValues): Promise<void> {
    await api.put(endpoints.articles.update(id), toFormData(values), {
      timeout: UPLOAD_TIMEOUT_MS,
    });
  },

  async remove(id: string): Promise<void> {
    await api.delete(endpoints.articles.remove(id));
  },

  async views(id: string): Promise<ArticleViewCountDto> {
    const { data } = await api.get<ArticleViewCountDto>(endpoints.articles.views(id));
    return data;
  },
};
