'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminI18n } from '../../../src/context/AdminI18nContext';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import {
  AdminPageSection,
  DesktopTable,
  Table,
  THead,
  TH,
  TR,
  TD,
  MobileCardList,
  MobileCard,
  FilterBar,
  EmptyState,
  SkeletonRows,
} from '../../../src/features/admin/components/DataViews';
import { adminApi } from '../../../src/lib/adminApi';
import type { AuditLog } from '../../../src/lib/adminApi';

const ENTITIES = ['user', 'product', 'store', 'seller_request', 'order', 'banner'];
const ACTIONS = ['create', 'update', 'delete', 'approve', 'reject', 'promote', 'ban', 'unban', 'update_profile', 'change_password'];

const LOCALE_MAP: Record<string, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-GB' };

function formatDate(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  return d.toLocaleString(LOCALE_MAP[lang] ?? 'uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function DetailsCell({ details }: { details: Record<string, unknown> | null | undefined }) {
  if (!details) return <span className='text-[var(--admin-muted)]'>—</span>;
  const entries = Object.entries(details).slice(0, 3);
  return (
    <div className='space-y-0.5'>
      {entries.map(([k, v]) => (
        <p key={k} className='text-xs text-[var(--admin-muted)]'>
          <span className='font-medium text-[var(--admin-text)]'>{k}:</span>{' '}
          {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
        </p>
      ))}
    </div>
  );
}

export default function AuditLogsPage() {
  const { t, locale } = useAdminI18n();
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');

  const params = {
    page,
    limit: 20,
    ...(entity ? { entity } : {}),
    ...(action ? { action } : {}),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => adminApi.getAuditLogs(params),
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <AdminShell title={t('audit.title')}>
      <AdminPageSection title={t('audit.title')} description={t('audit.subtitle')} />

      {/* Filters */}
      <FilterBar>
        <select
          className='admin-select'
          value={entity}
          onChange={(e) => { setEntity(e.target.value); setPage(1); }}
        >
          <option value=''>{t('audit.allEntities')}</option>
          {ENTITIES.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        <select
          className='admin-select'
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
        >
          <option value=''>{t('audit.allActions')}</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </FilterBar>

      {isLoading ? (
        <SkeletonRows />
      ) : error ? (
        <EmptyState title={t('common.error')} description={String(error)} />
      ) : logs.length === 0 ? (
        <EmptyState title={t('audit.empty')} description={t('audit.subtitle')} />
      ) : (
        <>
          {/* Desktop table */}
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>{t('audit.time')}</TH>
                  <TH>{t('audit.admin')}</TH>
                  <TH>{t('audit.action')}</TH>
                  <TH>{t('audit.entity')}</TH>
                  <TH>{t('audit.details')}</TH>
                </tr>
              </THead>
              <tbody>
                {logs.map((log: AuditLog) => (
                  <TR key={log.id}>
                    <TD className='whitespace-nowrap text-xs text-[var(--admin-muted)]'>
                      {formatDate(log.created_at, locale)}
                    </TD>
                    <TD>
                      <p className='font-medium text-[var(--admin-text)]'>{log.admin_name ?? '—'}</p>
                    </TD>
                    <TD>
                      <span className='inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-500'>
                        {log.action}
                      </span>
                    </TD>
                    <TD>
                      <span className='text-sm text-[var(--admin-text)]'>{log.entity}</span>
                      {log.entity_id && (
                        <p className='text-xs text-[var(--admin-muted)]'>{log.entity_id.slice(0, 8)}…</p>
                      )}
                    </TD>
                    <TD>
                      <DetailsCell details={log.details as Record<string, unknown> | null | undefined} />
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </DesktopTable>

          {/* Mobile cards */}
          <MobileCardList>
            {logs.map((log: AuditLog) => (
              <MobileCard key={log.id}>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-500'>
                        {log.action}
                      </span>
                      <span className='text-xs text-[var(--admin-muted)]'>{log.entity}</span>
                    </div>
                    <p className='mt-1 text-sm font-medium text-[var(--admin-text)]'>{log.admin_name ?? '—'}</p>
                    <p className='text-xs text-[var(--admin-muted)]'>{formatDate(log.created_at, locale)}</p>
                    {log.details && (
                      <div className='mt-1'>
                        <DetailsCell details={log.details as Record<string, unknown>} />
                      </div>
                    )}
                  </div>
                </div>
              </MobileCard>
            ))}
          </MobileCardList>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className='mt-4 flex items-center justify-center gap-2'>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className='admin-btn-secondary px-3 py-1.5 text-sm disabled:opacity-40'
              >
                {t('common.previous')}
              </button>
              <span className='text-sm text-[var(--admin-muted)]'>
                {page} / {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
                className='admin-btn-secondary px-3 py-1.5 text-sm disabled:opacity-40'
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
