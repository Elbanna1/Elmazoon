import { API_BASE_URL } from "@/lib/config";
import type { ArticleDto } from "@/types/api";

/**
 * The URL an article's cover image is served from.
 *
 * The backend is the source of truth: `imageUrl` is used when present. The
 * fallback to `{API}/uploads/{image}` is not a workaround for a bug — it is the
 * construction the OpenAPI document itself prescribes ("`image` is a bare
 * filename; the client builds the URL as `{server}/uploads/{image}`"), and it
 * keeps images rendering if `imageUrl` ever comes back null on an older row.
 *
 * Both fields are nullable: an article legitimately has no image, and callers
 * must render a placeholder for null rather than an empty <img>.
 */
export function articleImageUrl(
  article: Pick<ArticleDto, "image" | "imageUrl"> | null | undefined,
): string | null {
  if (!article) return null;
  if (article.imageUrl) return article.imageUrl;
  if (article.image) return `${API_BASE_URL}/uploads/${article.image}`;
  return null;
}
