"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface Props {
  content: Record<string, unknown> | null;
}

export default function SopBodyRenderer({ content }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content ?? "",
    editable: false,
    editorProps: {
      attributes: {
        class: "sop-prose focus:outline-none",
      },
    },
  });

  if (!content) {
    return <p className="text-sm text-dash-text-dim italic">No procedure written yet.</p>;
  }

  return <EditorContent editor={editor} />;
}
