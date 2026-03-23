'use client';

import { List, ListOrdered, RemoveFormatting, Bold, Italic, Underline } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { normalizeRichText, stripRichText } from '../lib/richText';

type Command = 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'removeFormat';

function action(exec: Command) {
  document.execCommand(exec, false);
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
  const ref = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const next = normalizeRichText(value);
    if (ref.current && ref.current.innerHTML !== next) {
      ref.current.innerHTML = next;
    }
    setEmpty(!stripRichText(next));
  }, [value]);

  const sync = () => {
    const html = normalizeRichText(ref.current?.innerHTML ?? '');
    setEmpty(!stripRichText(html));
    onChange(html);
  };

  const run = (command: Command) => {
    ref.current?.focus();
    action(command);
    sync();
  };

  return (
    <div className={`rounded-[22px] border border-white/8 bg-white/[0.04] p-3 transition-all dark:bg-[#101010] ${focused ? 'border-[#22c55e]/55 shadow-[0_0_0_4px_rgba(34,197,94,0.12)]' : ''}`}>
      <div className="mb-3 flex flex-wrap gap-2 border-b border-white/8 pb-3">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('bold')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-[#64748b] transition-colors hover:text-[#111111] dark:text-[#94a3b8] dark:hover:text-white">
          <Bold size={15} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('italic')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-[#64748b] transition-colors hover:text-[#111111] dark:text-[#94a3b8] dark:hover:text-white">
          <Italic size={15} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('underline')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-[#64748b] transition-colors hover:text-[#111111] dark:text-[#94a3b8] dark:hover:text-white">
          <Underline size={15} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertUnorderedList')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-[#64748b] transition-colors hover:text-[#111111] dark:text-[#94a3b8] dark:hover:text-white">
          <List size={15} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertOrderedList')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-[#64748b] transition-colors hover:text-[#111111] dark:text-[#94a3b8] dark:hover:text-white">
          <ListOrdered size={15} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('removeFormat')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-[#64748b] transition-colors hover:text-[#111111] dark:text-[#94a3b8] dark:hover:text-white">
          <RemoveFormatting size={15} />
        </button>
      </div>
      <div className="relative">
        {empty && placeholder ? (
          <div className="pointer-events-none absolute left-0 top-0 text-[14px] text-[#9ca3af]">
            {placeholder}
          </div>
        ) : null}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            sync();
          }}
          onInput={sync}
          className="min-h-[120px] text-[14px] leading-7 text-[#111111] outline-none dark:text-white [&_ol]:ml-5 [&_ol]:list-decimal [&_p+ul]:mt-2 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-black [&_ul]:ml-5 [&_ul]:list-disc"
        />
      </div>
    </div>
  );
}
