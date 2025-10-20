'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile } from '@mytube/shared-model';
import { PinDialog } from '@/components/modals/PinDialog';

interface ProfilePickerProps {
  profiles: Profile[];
}

export function ProfilePicker({ profiles }: ProfilePickerProps) {
  const router = useRouter();
  const [pinProfileId, setPinProfileId] = useState<string | null>(null);

  const handleProfileSelect = async (profile: Profile) => {
    if (profile.kind === 'parent') {
      setPinProfileId(profile.id);
      return;
    }
    router.push(`/profiles/${profile.id}`);
  };

  const handleVerifyPin = async (pin: string) => {
    if (!pinProfileId) return;
    const response = await fetch(`/api/profiles/${pinProfileId}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? 'Invalid PIN');
    }

    setPinProfileId(null);
    router.push(`/profiles/${pinProfileId}`);
  };

  return (
    <div className="flex flex-wrap gap-6">
      {profiles.map((profile) => (
        <button
          key={profile.id}
          onClick={() => handleProfileSelect(profile)}
          className="flex h-32 w-32 flex-col items-center justify-center rounded-xl border border-gray-700 bg-gray-900 text-center text-white shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="text-xl font-semibold">{profile.name}</span>
          <span className="mt-2 text-xs uppercase text-gray-400">{profile.kind}</span>
        </button>
      ))}
      <PinDialog
        open={Boolean(pinProfileId)}
        onClose={() => setPinProfileId(null)}
        onSubmit={handleVerifyPin}
        title="Enter parent PIN"
      />
    </div>
  );
}
