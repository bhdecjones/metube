'use client';

import { useEffect, useMemo, useState } from 'react';
import { Channel, Profile } from '@mytube/shared-model';

interface ChannelWithProfile extends Channel {
  profileId: string;
}

interface Props {
  profiles: Profile[];
  channelsByProfile: Record<string, Channel[]>;
}

export function AdminDashboardClient({ profiles, channelsByProfile }: Props) {
  const parentProfiles = useMemo(() => profiles.filter((profile) => profile.kind === 'parent'), [profiles]);
  const childProfiles = useMemo(() => profiles.filter((profile) => profile.kind === 'child'), [profiles]);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => childProfiles[0]?.id ?? parentProfiles[0]?.id ?? null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelUrl, setChannelUrl] = useState('');
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    const search = async () => {
      setIsSearching(true);
      setError(null);
      try {
        const response = await fetch(`/api/channels/search?q=${encodeURIComponent(searchTerm)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const data = await response.json();
          setError(data.error ?? 'Failed to search channels');
        } else {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err?.message ?? 'Search failed');
        }
      } finally {
        setIsSearching(false);
      }
    };

    const timeout = setTimeout(search, 300);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  const handleAddChannel = async (channel: Channel) => {
    if (!selectedProfileId) return;
    const response = await fetch(`/api/profiles/${selectedProfileId}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channel),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? 'Failed to add channel');
      return;
    }
    window.location.reload();
  };

  const handleRemoveChannel = async (channel: ChannelWithProfile) => {
    const response = await fetch(`/api/profiles/${channel.profileId}/channels/${channel.channelId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? 'Failed to remove channel');
      return;
    }
    window.location.reload();
  };

  const selectedChannels = selectedProfileId ? channelsByProfile[selectedProfileId] ?? [] : [];

  const parseChannelInput = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      if (url.pathname.includes('/channel/')) {
        const [, , id] = url.pathname.split('/');
        if (id?.startsWith('UC')) {
          return { channelId: id };
        }
      }
      if (url.pathname.startsWith('/@')) {
        return { handle: url.pathname.replace('/', '') };
      }
    } catch (error) {
      if (trimmed.startsWith('UC')) {
        return { channelId: trimmed };
      }
      if (trimmed.startsWith('@')) {
        return { handle: trimmed };
      }
    }
    return null;
  };

  const handleAddByUrl = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProfileId) return;
    const parsedInput = parseChannelInput(channelUrl);
    if (!parsedInput) {
      setError('Could not parse channel URL or ID.');
      return;
    }
    setIsResolvingUrl(true);
    setError(null);
    try {
      const query = parsedInput.channelId
        ? `id=${encodeURIComponent(parsedInput.channelId)}`
        : `handle=${encodeURIComponent(parsedInput.handle!)}`;
      const response = await fetch(`/api/channels/info?${query}`);
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Failed to resolve channel');
        return;
      }
      const channel = await response.json();
      await handleAddChannel(channel);
      setChannelUrl('');
    } finally {
      setIsResolvingUrl(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-400">Choose profile</label>
            <select
              value={selectedProfileId ?? ''}
              onChange={(event) => setSelectedProfileId(event.target.value)}
              className="rounded bg-gray-900 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.kind})
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
          <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h2 className="text-lg font-semibold">Search channels</h2>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by channel name"
              className="w-full rounded bg-black px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            />
            <form onSubmit={handleAddByUrl} className="space-y-2">
              <label className="block text-xs uppercase text-gray-500">Or paste channel URL/ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={channelUrl}
                  onChange={(event) => setChannelUrl(event.target.value)}
                  placeholder="https://youtube.com/@channel"
                  className="w-full rounded bg-black px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                />
                <button
                  type="submit"
                  disabled={isResolvingUrl}
                  className="rounded bg-white px-3 py-2 text-sm text-black hover:bg-gray-200 disabled:opacity-60"
                >
                  {isResolvingUrl ? 'Adding…' : 'Add'}
                </button>
              </div>
            </form>
            {isSearching ? <p className="text-sm text-gray-400">Searching…</p> : null}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <ul className="space-y-2">
              {searchResults.map((channel) => (
                <li key={channel.channelId} className="flex items-center justify-between rounded border border-gray-800 bg-black px-3 py-2">
                  <div>
                    <p className="font-semibold">{channel.title}</p>
                    <p className="text-xs text-gray-500">{channel.channelId}</p>
                  </div>
                  <button
                    onClick={() => handleAddChannel(channel)}
                    className="rounded bg-white px-3 py-1 text-sm text-black hover:bg-gray-200"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h2 className="text-lg font-semibold">Whitelisted channels</h2>
            <ul className="space-y-2">
              {selectedChannels.map((channel) => (
                <li key={channel.channelId} className="flex items-center justify-between rounded border border-gray-800 bg-black px-3 py-2">
                  <div>
                    <p className="font-semibold">{channel.title}</p>
                    <p className="text-xs text-gray-500">{channel.channelId}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveChannel({ ...channel, profileId: selectedProfileId! })}
                    className="rounded border border-white px-3 py-1 text-sm text-white hover:bg-white/10"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {selectedChannels.length === 0 ? (
                <li className="rounded border border-dashed border-gray-800 bg-black px-3 py-6 text-center text-sm text-gray-500">
                  No channels yet.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
