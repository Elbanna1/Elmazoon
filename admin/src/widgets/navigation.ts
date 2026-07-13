import {
  Bell,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * The whole of the admin's navigation. Five destinations, no nesting, no groups.
 *
 * "عرض الموقع" and "تسجيل الخروج" live at the foot of the sidebar rather than in
 * this list: one leaves the admin, the other ends the session, and neither is a
 * page you can be "on".
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/questions", label: "الأسئلة", icon: MessageSquareText },
  { href: "/admin/articles", label: "الفتاوى", icon: FileText },
  { href: "/admin/comments", label: "التعليقات", icon: MessagesSquare },
  { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
];

/** The public site, as seen from the admin. */
export const PUBLIC_SITE_URL = "/";
