'use client';

import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { List, ListOrdered, RemoveFormatting, Bold, Italic, Underline as UnderlineIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { normalizeRichText, stripRichText } from '../lib/richText';

function iconButtonClass(active: boolean) {
  return `flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
    active
      ? 'border-[#22c55e]/70 bg-[#22c55e]/15 text-[#166534] shadow-[0_0_0_3px_rgba(34,197,94,0.18)] dark:border-[#22c55e]/65 dark:bg-[#22c55e]/20 dark:text-[#86efac]'
      : 'border-black/10 bg-white text-[#64748b] hover:border-[#22c55e]/35 hover:text-[#111111] dark:border-white/8 dark:bg-white/[0.04] dark:text-[#94a3b8] dark:hover:border-[#22c55e]/35 dark:hover:text-white'
  }`;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [empty, setEmpty] = useState(true);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
    ],
    content: normalizeRichText(value),
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] text-left text-[14px] leading-7 text-[#111111] outline-none dark:text-white [&_li]:text-left [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:text-left [&_p+ul]:mt-2 [&_p+ol]:mt-2 [&_p]:mb-2 [&_p]:text-left [&_p:last-child]:mb-0 [&_strong]:font-black [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:text-left',
        dir: 'ltr',
      },
    },
    onCreate: ({ editor: nextEditor }) => {
      setEmpty(nextEditor.isEmpty);
    },
    onFocus: () => {
      setFocused(true);
    },
    onBlur: () => {
      setFocused(false);
    },
    onUpdate: ({ editor: nextEditor }) => {
      const html = normalizeRichText(nextEditor.getHTML());
      setEmpty(nextEditor.isEmpty || !stripRichText(html));
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const next = normalizeRichText(value);
    const current = normalizeRichText(editor.getHTML());

    if (current !== next) {
      editor.commands.setContent(next || '', { emitUpdate: false });
      setEmpty(!stripRichText(next));
    }
  }, [editor, value]);

  const run = (callback: () => boolean) => {
    if (!editor) return;
    callback();
    editor.commands.focus();
    setEmpty(editor.isEmpty);
  };

  return (
    <div
      className={`rounded-[22px] border border-black/10 bg-[#f8fafc] p-3 transition-all dark:border-white/8 dark:bg-[#101010] ${
        focused ? 'border-[#22c55e]/55 shadow-[0_0_0_4px_rgba(34,197,94,0.12)]' : ''
      }`}
    >
      <div className="mb-3 flex flex-wrap gap-2 border-b border-black/8 pb-3 dark:border-white/8">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run(() => editor?.chain().focus().toggleBold().run() ?? false)} className={iconButtonClass(editor?.isActive('bold') ?? false)}>
          <Bold size={15} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run(() => editor?.chain().focus().toggleItalic().run() ?? false)} className={iconButtonClass(editor?.isActive('italic') ?? false)}>
          <Italic size={15} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run(() => editor?.chain().focus().toggleUnderline().run() ?? false)} className={iconButtonClass(editor?.isActive('underline') ?? false)}>
          <UnderlineIcon size={15} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run(() => editor?.chain().focus().toggleBulletList().run() ?? false)} className={iconButtonClass(editor?.isActive('bulletList') ?? false)}>
          <List size={15} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run(() => editor?.chain().focus().toggleOrderedList().run() ?? false)} className={iconButtonClass(editor?.isActive('orderedList') ?? false)}>
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            run(() => editor?.chain().focus().clearNodes().unsetAllMarks().run() ?? false)
          }
          className={iconButtonClass(false)}
        >
          <RemoveFormatting size={15} />
        </button>
      </div>
      <div className="relative" dir="ltr">
        {empty && placeholder ? (
          <div className="pointer-events-none absolute left-0 top-0 text-left text-[14px] text-[#9ca3af]">
            {placeholder}
          </div>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
