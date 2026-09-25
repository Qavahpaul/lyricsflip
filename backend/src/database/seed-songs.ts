/**
 * Seeds the database from the shared seed file (repo-root `seed/songs.json`).
 * The same file is used for on-chain seeding by `onchain/scripts/seed-cards.sh`,
 * so the database and the contract always hold the same catalogue.
 *
 * Usage: DATABASE_URL=postgres://... npm run seed
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DataSource } from 'typeorm';

export interface SeedSong {
  genre: number;
  artist: string;
  title: string;
  year: number;
  lyrics: string;
  source: string;
  license: string;
}

/** Maximum snippet length allowed by docs/content-policy.md. */
export const MAX_SNIPPET_WORDS = 20;

export function loadSeedSongs(
  file = resolve(__dirname, '../../../seed/songs.json'),
): SeedSong[] {
  const songs: SeedSong[] = JSON.parse(readFileSync(file, 'utf8'));
  for (const song of songs) {
    if (!song.source) {
      throw new Error(`"${song.title}" is missing a source attribution`);
    }
    if (song.lyrics.split(/\s+/).length > MAX_SNIPPET_WORDS) {
      throw new Error(`"${song.title}" exceeds ${MAX_SNIPPET_WORDS} words`);
    }
  }
  return songs;
}

async function seed() {
  const songs = loadSeedSongs();
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
  });
  await dataSource.initialize();

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS seed_songs (
      id SERIAL PRIMARY KEY,
      genre INTEGER NOT NULL,
      artist TEXT NOT NULL,
      title TEXT NOT NULL,
      year INTEGER NOT NULL,
      lyrics TEXT NOT NULL,
      source TEXT NOT NULL,
      license TEXT NOT NULL,
      UNIQUE (artist, title)
    )`);

  for (const s of songs) {
    await dataSource.query(
      `INSERT INTO seed_songs (genre, artist, title, year, lyrics, source, license)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (artist, title) DO UPDATE
       SET genre = EXCLUDED.genre, year = EXCLUDED.year, lyrics = EXCLUDED.lyrics,
           source = EXCLUDED.source, license = EXCLUDED.license`,
      [s.genre, s.artist, s.title, s.year, s.lyrics, s.source, s.license],
    );
  }

  console.log(`Seeded ${songs.length} songs`);
  await dataSource.destroy();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
