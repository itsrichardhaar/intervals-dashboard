"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface SidebarProps {
  user: { name?: string | null; email?: string | null };
}

const NAV = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Projects", href: "/projects", icon: "◫", children: [
    { label: "Overview", href: "/projects" },
    { label: "Archive", href: "/projects/archive" },
  ]},
  { label: "Team", href: "/team", icon: "◈", children: [
    { label: "Bandwidth", href: "/team/bandwidth" },
    { label: "Timeline", href: "/team/timeline" },
  ]},
  { label: "My Work", href: "/my-work", icon: "✓", children: [
    { label: "All My Tasks", href: "/my-work/tasks" },
    { label: "My Action Items", href: "/my-work/action-items" },
  ]},
  { label: "Settings", href: "/settings", icon: "⚙" },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-gray-800">
        <p className="text-sm font-semibold text-white truncate">Project Dashboard</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="text-base w-4 text-center">{item.icon}</span>
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
                            ? "bg-gray-800 text-white"
                            : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
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

      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-500 truncate mb-2">{user.name ?? user.email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
