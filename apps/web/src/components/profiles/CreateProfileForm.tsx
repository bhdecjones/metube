'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileKind } from '@mytube/shared-model';

interface Props {
  kind: ProfileKind;
  requirePin?: boolean;
}

export function CreateProfileForm({ kind, requirePin = false }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, kind }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? 'Failed to create profile');
      setLoading(false);
      return;
    }

    const profile = await response.json();

    if (requirePin) {
      const pinResponse = await fetch(`/api/profiles/${profile.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!pinResponse.ok) {
        const pinData = await pinResponse.json();
        setError(pinData.error ?? 'Failed to set PIN');
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border border-gray-800 p-6">
      <h2 className="text-xl font-semibold">Create {kind} profile</h2>
      <label className="flex flex-col gap-2 text-sm">
        <span>Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="rounded bg-gray-800 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        />
      </label>
      {requirePin ? (
        <label className="flex flex-col gap-2 text-sm">
          <span>Parent PIN</span>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            minLength={4}
            maxLength={10}
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            required
            className="rounded bg-gray-800 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          />
        </label>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-white px-4 py-2 text-black hover:bg-gray-200 disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
