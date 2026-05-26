"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

interface Props {
  content: Record<string, unknown> | null;
}

export default function SopBodyRenderer({ content }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, TaskList, TaskItem.configure({ nested: true })],
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
