"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { TimeWindow } from "@/lib/calculators/bandwidth";

const OPTIONS: { value: TimeWindow; label: string }[] = [
  { value: "weekly",    label: "This Week"    },
  { value: "monthly",   label: "This Month"   },
  { value: "quarterly", label: "This Quarter" },
];

interface Props {
  current: TimeWindow;
}

export default function TimeWindowToggle({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(value: TimeWindow) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("window", value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex bg-dash-surface-2 rounded-lg p-0.5 gap-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => select(opt.value)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            current === opt.value
              ? "bg-dash-inset text-dash-text"
              : "text-dash-text-muted hover:text-dash-text"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
