# Content & Lyrics Licensing Policy

LyricsFlip shows short lyric snippets. Most commercial lyrics are copyrighted, so
every snippet shipped in this repository or served by the game must follow this
policy.

## 1. Allowed sources

Only these sources may be used for lyric text:

| Source | Allowed | Notes |
| --- | --- | --- |
| Original demo lyrics written for LyricsFlip | ✅ | Contributed under CC0-1.0. |
| Public-domain songs | ✅ | Composition *and* lyrics must be public domain in the US and the contributor's country. |
| Lyrics licensed from a lyrics provider (e.g. LyricFind, Musixmatch) | ✅ | Only under a written agreement; licensed data must **not** be committed to this repo. |
| Copied from lyrics websites, streaming apps, liner notes | ❌ | Never. |

## 2. Maximum snippet length

- A snippet may be at most **20 words** and a **single line/phrase**.
- Never show more than one snippet of the same song in a single round.
- The seed test (`backend/src/database/seed-songs.spec.ts`) fails if any entry in
  `seed/songs.json` exceeds this limit.

## 3. Source attribution

Every entry in `seed/songs.json` (and every song row in the database) must include:

- `source` — where the text came from (e.g. "Original demo lyrics written for
  LyricsFlip (CC0)", "Public domain: <publication, year>", "Licensed: <provider>").
- `license` — an SPDX identifier or `LicenseRef-<provider>` for licensed data.

Entries without a `source` are rejected by the seed script.

## 4. Seed data

`seed/songs.json` is the single source of truth for demo content:

- `cd backend && npm run seed` loads it into the database.
- `onchain/scripts/seed-cards.sh` loads the same file into the contract.

It currently contains only original demo lyrics (CC0), at least 5 per genre.

## 5. Takedown process

1. Rights holders or users report content by opening a GitHub issue labelled
   `takedown` or by emailing the maintainers listed in `README.md`.
2. Maintainers acknowledge within **2 business days** and, pending review,
   remove the entry from `seed/songs.json` and the database immediately.
3. For on-chain cards, the admin deactivates/removes the card via the contract
   admin functions so it is no longer served in new rounds.
4. The resolution is recorded in the issue and the reporter is notified.
