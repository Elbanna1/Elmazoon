import { AxiosError } from "axios";
import type { ProblemDetails } from "@/types/api";

/** A server or transport failure, reduced to something a human can act on. */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | null;
  readonly isNetwork: boolean;

  constructor(message: string, status: number, detail: string | null, isNetwork = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.isNetwork = isNetwork;
  }
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === "object" && value !== null && "status" in value;
}

/**
 * The spec says every 4xx/5xx is RFC-7807 ProblemDetails. The live server does
 * not agree: `POST /api/admin/login` answers a bad password with
 * `{"message":"Invalid email or password","stack":null}` — no `detail`, no
 * `title`, no `status`. Reading only ProblemDetails would throw away the one
 * sentence the server actually said, so try both shapes.
 */
function serverMessage(data: unknown): string | null {
  if (isProblemDetails(data)) {
    const problem = data as ProblemDetails;
    if (problem.detail) return problem.detail;
    if (problem.title) return problem.title;
  }

  if (typeof data === "object" && data !== null && "message" in data) {
    const { message } = data as { message: unknown };
    if (typeof message === "string" && message.trim()) return message;
  }

  return null;
}

/**
 * Centralised error handling.
 *
 * Every failure the UI can encounter arrives here and leaves as an ApiError with
 * a message worth showing. The API returns RFC-7807 ProblemDetails on every 4xx
 * and 5xx, so its `detail` is preferred over anything we could invent — but the
 * status codes get a human sentence, because "Unprocessable Entity" is not one.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED") {
      return new ApiError("انتهت مهلة الاتصال بالخادم.", 0, "استغرق الخادم وقتًا أطول من المتوقع.", true);
    }

    if (!error.response) {
      return new ApiError(
        "تعذّر الوصول إلى الخادم.",
        0,
        "تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.",
        true,
      );
    }

    const { status, data } = error.response;
    const detail = serverMessage(data);

    switch (status) {
      case 400:
        return new ApiError("تم رفض الطلب.", 400, detail);
      case 401:
        return new ApiError("انتهت صلاحية الجلسة.", 401, detail ?? "سجّل الدخول من جديد للمتابعة.");
      case 403:
        return new ApiError("لا تملك صلاحية تنفيذ هذا الإجراء.", 403, detail);
      case 404:
        return new ApiError("العنصر المطلوب غير موجود.", 404, detail);
      case 422:
        return new ApiError("بعض الحقول تحتاج إلى تصحيح.", 422, detail);
      case 429:
        return new ApiError(
          "عدد كبير من المحاولات.",
          429,
          detail ?? "تكرار المحاولات الفاشلة يقفل الحساب ١٥ دقيقة. انتظر ثم حاول مجددًا.",
        );
      case 502:
        // Our own proxy could not reach the API — a different failure from the
        // API rejecting us, and worth saying so.
        return new ApiError("تعذّر الوصول إلى الخادم.", 502, detail, true);
      default:
        if (status >= 500) {
          return new ApiError("حدث خطأ في الخادم.", status, detail);
        }
        return new ApiError("حدث خطأ غير متوقع.", status, detail);
    }
  }

  if (error instanceof Error) return new ApiError(error.message, 0, null);
  return new ApiError("حدث خطأ غير متوقع.", 0, null);
}
