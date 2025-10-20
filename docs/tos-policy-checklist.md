# YouTube ToS & Policy Checklist

- [x] Use the official YouTube IFrame API with default controls (`rel=0`, `modestbranding=1`, `controls=1`, `playsinline=1`).
- [x] Do **not** hide or modify YouTube branding, UI chrome, or advertisements.
- [x] Do **not** inject scripts into the YouTube player iframe or manipulate its DOM.
- [x] Disable autoplay by default and exit playback when the video ends to avoid showing end suggestions.
- [x] Filter out YouTube Shorts and other short-form content by enforcing a minimum duration (default 60 seconds).
- [x] Cache YouTube metadata for no longer than 30 days. Refresh or delete outdated cache entries via nightly maintenance.
- [x] Provide a Privacy Policy link in the footer, collect minimal analytics, and avoid behavioral tracking.
- [x] If Google OAuth import is enabled, request read-only YouTube subscription scopes and never publish content on behalf of users.
