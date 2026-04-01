'use client';

import { normalizeRichText } from '../lib/richText';

export function RichTextContent({ html, className = '' }: { html: string; className?: string }) {
  const safeHtml = normalizeRichText(html);
  if (!safeHtml) return null;

  return (
    <div
      className={`max-w-full break-words [overflow-wrap:anywhere] [&_li]:break-words [&_ol]:max-w-full [&_p]:max-w-full [&_ul]:max-w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
