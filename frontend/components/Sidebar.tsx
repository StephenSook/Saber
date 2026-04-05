"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { getInitials, getInitialsBgColor } from "@/lib/ui";
import { logout } from "@/lib/api";

interface SidebarProps {
  variant: "teacher" | "student";
  userName: string;
  schoolName: string;
}

export default function Sidebar({ variant, userName, schoolName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const dashboardHref = variant === "teacher" ? "/teacher" : "/student";
  const initials = getInitials(userName);
  const bgColor = getInitialsBgColor(userName);

  const handleLogout = async (): Promise<void> => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-col border-r border-gray-100 bg-white">
      <div className="px-5 pt-5 pb-2">
        <Link href="/" className="text-xl font-bold text-teal">
          Saber
        </Link>
      </div>

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

      <nav className="flex-1 px-3 py-4">
        <Link
          href={dashboardHref}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            pathname === dashboardHref
              ? "bg-teal/10 text-teal"
              : "text-gray-500 hover:bg-gray-50 hover:text-navy"
          }`}
        >
          <LayoutDashboard className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
          <span>{t("nav.dashboard")}</span>
        </Link>
      </nav>

      <div className="border-t border-gray-100 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-gray-50 hover:text-navy"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
