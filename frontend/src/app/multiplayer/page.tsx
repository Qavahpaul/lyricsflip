'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStellar } from '@/lib/stellar/hooks/useStellar';
import { GENRE_VALUES, type Genre } from '@/lib/stellar/types';
import { Button } from '@/components/atoms/button';

export default function MultiplayerPage() {
  const router = useRouter();
  const { systemCalls, account, connect } = useStellar();
  const [genre, setGenre] = useState<Genre>(GENRE_VALUES[0]);
  const [roundId, setRoundId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setError] = useState<string | null>(null);

  const handleCreateRound = async () => {
    if (!account) {
      await connect();
      return;
    }
    if (!systemCalls) {
      setError('System calls not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const id = await systemCalls.createRound(genre);
      router.push(`/multiplayer/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create round');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRound = () => {
    if (!/^\d+$/.test(roundId.trim())) {
      setError('Round ID must be a number');
      return;
    }
    router.push(`/multiplayer/${roundId.trim()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Multiplayer Game</h1>

      <div className="max-w-md mx-auto space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Create multiplayer round</h2>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as Genre)}
            className="w-full px-4 py-2 border rounded mb-4"
          >
            {GENRE_VALUES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <Button
            onClick={handleCreateRound}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading
              ? 'Creating…'
              : account
                ? 'Create Round'
                : 'Connect wallet to create'}
          </Button>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Join with a round ID</h2>
          <input
            type="text"
            value={roundId}
            onChange={(e) => setRoundId(e.target.value)}
            placeholder="Enter Round ID"
            className="w-full px-4 py-2 border rounded mb-4"
          />
          <Button
            onClick={handleJoinRound}
            disabled={!roundId}
            className="w-full"
          >
            Join Round
          </Button>
        </div>
      </div>

      {errorState && (
        <p className="text-red-500 mt-4 text-center">{errorState}</p>
      )}
    </div>
  );
}
