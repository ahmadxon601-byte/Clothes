'use client';

import { normalizeRichText } from '../lib/richText';

export function RichTextContent({ html, className = '' }: { html: string; className?: string }) {
  const safeHtml = normalizeRichText(html);
  if (!safeHtml) return null;

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
