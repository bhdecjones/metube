# MyTube Architecture

MyTube is a minimal multi-profile YouTube viewer that limits playback to whitelisted channels defined by a parent account.

## Overview

- **Frontend**: Next.js App Router application located at `apps/web`. It is written in TypeScript and styled with Tailwind CSS using a black and white palette.
- **Packages**: Shared libraries live under `packages/`.
  - `@mytube/shared-model` contains Zod schemas shared across server and client for request/response validation.
  - `@mytube/design` exposes design tokens and the MyTube logotype SVG.
- **Backend helpers**: `backend/` contains utilities for interacting with Supabase and the YouTube Data API.
- **Database**: Supabase hosts authentication and Postgres tables. The schema is defined in `README.md` and mirrors the SQL provided in the product brief.
- **Routing**: Profiles, admin tools, and channel/video browsing are implemented as nested routes inside the App Router.

## Data Flow

1. Users authenticate via Supabase email/password. On first login a parent profile with PIN is required.
2. Parent users manage child profiles and assign YouTube channels. Assignments are persisted in Supabase `profile_channels`.
3. Server route handlers under `/app/api` proxy requests to Supabase and the YouTube Data API. Responses are validated with shared schemas.
4. Videos are fetched per profile from cached data in Supabase. When cache entries are stale, the YouTube API is queried and results stored.
5. Playback is handled via the YouTube IFrame API. On video end, playback is halted and an overlay offers replay or navigation back to the grid.

## Remote & Accessibility Support

The grid UI implements a roving tabindex pattern, ensuring arrow keys move focus predictably for TV remotes. Focus outlines are highly visible for accessibility.

## Caching & Cron

Metadata returned from the YouTube API is cached in Supabase tables `channel_cache` and `video_cache`. A nightly backend script (to be deployed separately) refreshes the most popular channels and deletes cache entries older than 30 days to satisfy YouTube data retention policies.
