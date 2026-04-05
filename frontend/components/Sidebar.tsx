"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BookOpen,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { getInitials, getInitialsBgColor } from "@/lib/ui";

interface SidebarProps {
  variant: "teacher" | "student";
  userName: string;
  schoolName: string;
}

const teacherNav = [
  { href: "/teacher", icon: LayoutDashboard, key: "nav.dashboard" },
  { href: "#", icon: Users, key: "sidebar.classes" },
  { href: "#", icon: ClipboardList, key: "sidebar.assignments" },
  { href: "#", icon: BookOpen, key: "sidebar.library" },
  { href: "#", icon: BarChart3, key: "sidebar.reports" },
];

const studentNav = [
  { href: "/student", icon: LayoutDashboard, key: "nav.dashboard" },
  { href: "#", icon: Users, key: "sidebar.classes" },
  { href: "#", icon: ClipboardList, key: "sidebar.assignments" },
  { href: "#", icon: BookOpen, key: "sidebar.library" },
  { href: "#", icon: BarChart3, key: "sidebar.reports" },
];

export default function Sidebar({ variant, userName, schoolName }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const navItems = variant === "teacher" ? teacherNav : studentNav;
  const initials = getInitials(userName);
  const bgColor = getInitialsBgColor(userName);

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-col border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="px-5 pt-5 pb-2">
        <Link href="/" className="text-xl font-bold text-teal">
          Saber
        </Link>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-white ${bgColor}`}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-navy">{userName}</p>
          <p className="truncate text-xs text-gray-400">{schoolName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-teal/10 text-teal"
                  : "text-gray-500 hover:bg-gray-50 hover:text-navy"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Assign Practice CTA */}
      <div className="px-3 pb-2">
        <button className="w-full rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-coral/90">
          {t("sidebar.assignPractice")}
        </button>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-gray-100 px-3 py-3 space-y-1">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-navy transition-colors">
          <Settings className="h-5 w-5" strokeWidth={1.5} />
          <span>{t("sidebar.settings")}</span>
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-navy transition-colors">
          <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
          <span>{t("sidebar.help")}</span>
        </button>
      </div>
    </aside>
  );
}
