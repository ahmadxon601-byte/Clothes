'use client';
import { useState, useEffect } from 'react';
import { mockApi } from '../../../services/mockServer';
import type { Comment } from '../../../shared/types';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { useToast } from '../../../shared/ui/useToast';
import { useTelegram } from '../../../telegram/useTelegram';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useTranslation } from '../../../shared/lib/i18n';

export function CommentList({ productId }: { productId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();
    const { user } = useTelegram();
    const { t } = useTranslation();

    useEffect(() => {
        mockApi.listComments(productId).then(data => {
            setComments(data);
            setLoading(false);
        });
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        setIsSubmitting(true);
        try {
            const username = user?.username || user?.first_name || 'Anonymous User';
            const newComment = await mockApi.addComment(productId, username, text);
            setComments(prev => [...prev, newComment]);
            setText('');
            showToast({ message: t.comment_added, type: 'success' });
        } catch (err) {
            showToast({ message: t.failed_to_add_comment, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-6 border-t border-[var(--color-border)] pt-8">
            <h3 className="text-[18px] font-bold mb-6 text-[var(--color-text)]">{t.comments}</h3>

            <div className="space-y-4 mb-8">
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-20 w-full rounded-[20px]" />
                        <Skeleton className="h-20 w-full rounded-[20px]" />
                    </div>
                ) : comments.length > 0 ? (
                    comments.map(c => (
                        <div key={c.id} className="p-5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[24px]">
                            <div className="text-[12px] font-bold text-[var(--color-hint)] mb-2 uppercase tracking-wider">{c.userId}</div>
                            <div className="text-[15px] text-[var(--color-text)] font-medium leading-relaxed">{c.text}</div>
                        </div>
                    ))
                ) : (
                    <div className="py-10 text-center">
                        <p className="text-[15px] text-[var(--color-hint)] font-medium">{t.no_comments}</p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    placeholder={t.add_comment}
                    value={text}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
                    disabled={isSubmitting}
                />
                <Button
                    type="submit"
                    disabled={!text.trim() || isSubmitting}
                    isLoading={isSubmitting}
                    className="shrink-0"
                >
                    {t.send}
                </Button>
            </form>
        </div>
    );
}
