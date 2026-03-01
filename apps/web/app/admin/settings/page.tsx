'use client';

import { useState } from 'react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection } from '../../../src/features/admin/components/DataViews';

export default function SettingsPage() {
  const [language, setLanguage] = useState('en');
  const [spamWords, setSpamWords] = useState('fake, scam, replica');
  const [forbiddenWords, setForbiddenWords] = useState('hate, abuse');
  const [imageLimit, setImageLimit] = useState('10');
  const [videoLimit, setVideoLimit] = useState('120');

  return (
    <AdminShell title='Settings'>
      <AdminPageSection title='Global Settings' description='Language defaults, moderation dictionaries and media limits.' />

      <section className='admin-card space-y-4 p-5'>
        <div>
          <label className='mb-2 block text-sm font-medium'>Default language</label>
          <select className='admin-input max-w-sm' value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value='en'>English</option>
            <option value='uz'>Uzbek</option>
            <option value='ru'>Russian</option>
          </select>
        </div>

        <div>
          <label className='mb-2 block text-sm font-medium'>Spam words</label>
          <textarea className='admin-input h-28 resize-none' value={spamWords} onChange={(event) => setSpamWords(event.target.value)} />
        </div>

        <div>
          <label className='mb-2 block text-sm font-medium'>Forbidden words</label>
          <textarea className='admin-input h-28 resize-none' value={forbiddenWords} onChange={(event) => setForbiddenWords(event.target.value)} />
        </div>

        <div className='grid gap-3 md:grid-cols-2'>
          <div>
            <label className='mb-2 block text-sm font-medium'>Max images per product</label>
            <input className='admin-input' type='number' value={imageLimit} onChange={(event) => setImageLimit(event.target.value)} />
          </div>
          <div>
            <label className='mb-2 block text-sm font-medium'>Max video seconds</label>
            <input className='admin-input' type='number' value={videoLimit} onChange={(event) => setVideoLimit(event.target.value)} />
          </div>
        </div>

        <button className='rounded-full bg-[var(--admin-accent)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--admin-accent-hover)]'>
          Save Settings
        </button>
      </section>
    </AdminShell>
  );
}

