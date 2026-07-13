"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import type { ApiError } from "@/lib/errors";
import { notificationsService } from "@/services/notifications.service";

const POLL_MS = 60_000;

export function useAdminNotifications({ unreadOnly = false, take = 20 } = {}) {
  return useQuery({
    queryKey: qk.notifications.admin(unreadOnly, take),
    queryFn: () => notificationsService.listForAdmin({ unreadOnly, take }),
    // A notification the admin never sees is not a notification. Poll, but slowly:
    // a bell that refreshes every second is a battery drain, not a feature.
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    // No id → mark everything read.
    mutationFn: (id?: string) => notificationsService.markAdminRead(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.all });
      if (!id) toast.success("تم تعليم كل الإشعارات كمقروءة.");
    },
    onError: (error: ApiError) => {
      toast.error("تعذّر تحديث الإشعارات.", {
        description: error.detail ?? error.message,
      });
    },
  });
}
