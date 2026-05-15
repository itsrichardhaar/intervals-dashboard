"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Download } from "lucide-react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function SopPrintArea({ title, children }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: title,
    pageStyle: `
      @page { margin: 1.5cm 2cm; }
      @media print {
        body { font-size: 11pt; color: #1a1a1a; background: white; }
        .sop-prose h2 { font-size: 13pt; }
        .sop-prose h3 { font-size: 12pt; }
        .sop-prose { color: #1a1a1a; }
      }
    `,
  });

  return (
    <div>
      <div ref={contentRef} className="sop-print-content">
        {children}
      </div>
      <div className="no-print mt-2">
        <button
          onClick={() => handlePrint()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dash-border text-sm text-dash-text-muted hover:text-dash-text hover:bg-dash-surface-2 transition-colors"
        >
          <Download size={13} />
          Download PDF
        </button>
      </div>
    </div>
  );
}
