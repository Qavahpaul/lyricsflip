import { loadSeedSongs, MAX_SNIPPET_WORDS } from './seed-songs';

describe('seed/songs.json', () => {
  const songs = loadSeedSongs();

  it('has at least 5 songs per genre', () => {
    const counts = new Map<number, number>();
    songs.forEach((s) => counts.set(s.genre, (counts.get(s.genre) ?? 0) + 1));
    counts.forEach((n) => expect(n).toBeGreaterThanOrEqual(5));
  });

  it('respects the content policy', () => {
    for (const s of songs) {
      expect(s.source).toBeTruthy();
      expect(s.lyrics.split(/\s+/).length).toBeLessThanOrEqual(MAX_SNIPPET_WORDS);
    }
  });
});
