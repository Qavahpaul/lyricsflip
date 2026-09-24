'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/atoms/button';

export default function MultiplayerLobbyPage() {
  const router = useRouter();
  const [roundId, setRoundId] = useState('');
  const isValid = /^\d+$/.test(roundId.trim());

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) router.push(`/multiplayer/${roundId.trim()}`);
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
          />
        </div>
        <Button type="submit" disabled={!isValid} className="w-full">
          Go to Round
        </Button>
      </form>
    </div>
  );
}
