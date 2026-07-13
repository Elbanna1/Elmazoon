"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";
import { DEV_ADMIN_CREDENTIALS, IS_DEV_PREFILL_ENABLED } from "@/lib/dev-credentials";
import { ApiError } from "@/lib/errors";

const schema = z.object({
  email: z.email("صيغة البريد الإلكتروني غير صحيحة."),
  password: z.string().min(1, "برجاء إدخال كلمة المرور."),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggingIn, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  // Someone already signed in has no business on the login screen.
  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdmin) router.replace("/admin/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEV_ADMIN_CREDENTIALS,
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      router.replace("/admin/dashboard");
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;

      setFormError(
        apiError?.status === 401
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
          : (apiError?.detail ?? apiError?.message ?? "تعذّر تسجيل الدخول."),
      );
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-ink-900 text-base font-bold text-gold-300">
            م
          </span>
          <h1 className="mt-5 text-xl font-semibold text-ink-900">لوحة تحكم المأذون</h1>
          <p className="mt-2 text-sm text-ink-400">سجّل الدخول للمتابعة</p>
        </div>

        <Card className="border-ink-100 shadow-card">
          <CardContent className="p-6 sm:p-7">
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  // An email address is Latin text; forcing it RTL mangles it.
                  dir="ltr"
                  className="text-start"
                  // Without autoComplete, password managers cannot fill this.
                  autoComplete="username"
                  placeholder="admin@almaazoon.com"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
                {errors.email && (
                  <p role="alert" className="text-xs font-medium text-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />
                {errors.password && (
                  <p role="alert" className="text-xs font-medium text-danger">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3.5 py-3 text-sm font-medium text-danger"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn && <Loader2 className="size-4 animate-spin" />}
                {isLoggingIn ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {IS_DEV_PREFILL_ENABLED && (
          <p className="mt-4 text-center text-xs text-ink-400">
            بيانات الدخول مملوءة تلقائيًا في وضع التطوير فقط.
          </p>
        )}

        <p className="mt-6 text-center text-xs text-ink-400">
          تكرار المحاولات الفاشلة يقفل الحساب ١٥ دقيقة.
        </p>
      </div>
    </div>
  );
}
