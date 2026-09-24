'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useStellar } from '@/lib/stellar/hooks/useStellar';
import { GENRE_VALUES, type Genre } from '@/lib/stellar/types';
import { Button } from '@/components/atoms/button';

export default function MultiplayerLobbyPage() {
  const router = useRouter();
  const [roundId, setRoundId] = useState('');
  const isValid = /^\d+$/.test(roundId.trim());

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) router.push(`/multiplayer/${roundId.trim()}`);
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
      <button onClick={() => router.push('/')} className="flex items-center text-gray-600 mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Multiplayer Game</h1>
      <form onSubmit={handleJoin} className="max-w-md mx-auto">
        <div className="mb-4">
          <input
            type="text"
            inputMode="numeric"
            value={roundId}
            onChange={(e) => setRoundId(e.target.value)}
            placeholder="Enter Round ID"
            className="w-full px-4 py-2 border rounded"

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
        <Button type="submit" disabled={!isValid} className="w-full">
          Go to Round
        </Button>
      </form>
      </div>

      {errorState && (
        <p className="text-red-500 mt-4 text-center">{errorState}</p>
      )}
    </div>
  );
}
