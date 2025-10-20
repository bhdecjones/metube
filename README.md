# MyTube

MyTube is a minimal, family-friendly web app that only surfaces YouTube videos from parent-approved channels.

## Getting Started

1. Install dependencies using pnpm:

   ```bash
   pnpm install
   ```

2. Copy the environment template for the web app:

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

3. Populate the environment file with your project credentials:

   ```env
   NEXT_PUBLIC_APP_NAME=MyTube
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=service-role-key-for-server-actions
   YOUTUBE_API_KEY=your-youtube-api-key
   ALLOW_GOOGLE_OAUTH=false
   NEXT_PUBLIC_DISABLE_AUTOPLAY=true
   NEXT_PUBLIC_MIN_DURATION_SECONDS=60
   PRIVACY_POLICY_URL=https://example.com/privacy
   ```

   > **Note:** `SUPABASE_SERVICE_ROLE_KEY` is only used by server-side route handlers that manage cached metadata. Do **not** expose this key to the browser. Leave it blank if you prefer to use row-level security policies exclusively.

4. Run database migrations in Supabase using the provided SQL:

   ```sql
   create table profiles (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users(id) on delete cascade,
     name text not null,
     kind text not null check (kind in ('parent','child')),
     parent_pin text,
     created_at timestamptz default now()
   );

   create index on profiles(user_id);

   create table profile_channels (
     id uuid primary key default gen_random_uuid(),
     profile_id uuid not null references profiles(id) on delete cascade,
     channel_id text not null,
     channel_title text not null,
     channel_thumb_url text,
     created_at timestamptz default now(),
     unique (profile_id, channel_id)
   );

   create table channel_cache (
     channel_id text primary key,
     title text not null,
     thumb_url text,
     last_refreshed timestamptz not null
   );

   create table video_cache (
     video_id text primary key,
     channel_id text not null,
     title text not null,
     duration_seconds int not null,
     published_at timestamptz,
     thumb_url text,
     last_refreshed timestamptz not null
   );
   ```

5. Start the development server:

   ```bash
   pnpm --filter @mytube/web dev
   ```

The app runs on [http://localhost:3000](http://localhost:3000).

## YouTube API Setup

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **YouTube Data API v3**.
3. Create an API key and add it to your `apps/web/.env.local` file as `YOUTUBE_API_KEY`.
4. Restrict the key to your deployment origin for security.

## Cron & Cache Policy

Cached channel and video metadata must be refreshed or deleted within 30 days. A nightly cron job (implemented outside of this repo) should:

- Refresh cached data for active channels.
- Delete cache rows older than 30 days.

## Privacy Policy

Expose the `PRIVACY_POLICY_URL` environment variable to display a footer link. Customize the destination to your published privacy policy.
