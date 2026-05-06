"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  FolderOpen,
  Users,
  ListChecks,
  Settings,
  Target,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface SidebarProps {
  user: { name?: string | null; email?: string | null };
}

const NAV = [
  { label: "Home",        href: "/",            icon: Home },
  { label: "Daily Focus", href: "/daily-focus",  icon: Target },
  { label: "Projects",    href: "/projects",     icon: FolderOpen, children: [
    { label: "Overview", href: "/projects"         },
    { label: "Archive",  href: "/projects/archive" },
  ]},
  { label: "Team",        href: "/team",         icon: Users, children: [
    { label: "Bandwidth", href: "/team/bandwidth" },
    { label: "Timeline",  href: "/team/timeline"  },
  ]},
  { label: "My Work",     href: "/my-work",      icon: ListChecks, children: [
    { label: "All My Tasks",    href: "/my-work/tasks"        },
    { label: "My Action Items", href: "/my-work/action-items" },
  ]},
  { label: "Settings",    href: "/settings",     icon: Settings },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-dash-surface border-r border-dash-border flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-dash-border">
        <p className="text-sm font-semibold text-dash-text truncate">Project Dashboard</p>
        <p className="text-xs text-dash-text-dim truncate mt-0.5">{user.email}</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-dash-surface-2 text-dash-accent"
                    : "text-dash-text-muted hover:bg-dash-surface-2 hover:text-dash-text"
                }`}
              >
                <Icon size={15} className="shrink-0" />
                {item.label}
              </Link>
              {item.children && (
                <div className="ml-6 mt-0.5 space-y-0.5">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-1.5 rounded-md text-xs transition-colors ${
                          childActive
                            ? "bg-dash-surface-2 text-dash-accent"
                            : "text-dash-text-dim hover:bg-dash-surface-2 hover:text-dash-text-muted"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-dash-border space-y-2">
        <ThemeToggle />
        <div className="flex items-center justify-between">
          <p className="text-xs text-dash-text-dim truncate">{user.name ?? user.email}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-dash-text-dim hover:text-red-400 transition-colors shrink-0 ml-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
