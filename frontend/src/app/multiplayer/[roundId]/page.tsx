'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LyricCard } from '@/components/organisms/LyricCard';
import { StatisticsPanel } from '@/components/molecules/statistics-panel';
import { SongOptions } from '@/components/molecules/song-options';
import { useMultiplayerRoom } from '@/hooks/use-multiplayer-room';
import { useCallback, useEffect, useState } from 'react';
import { useStellar } from '@/lib/stellar/hooks/useStellar';
import type { Round } from '@/lib/stellar/types';
import { Button } from '@/components/atoms/button';
import { useStore } from '@/store';
// Define the SongOption type
interface SongOption {
  title: string;
  artist: string;
}

const parseRoundId = (value: string | string[] | undefined): bigint | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && /^\d+$/.test(raw) ? BigInt(raw) : null;
};

export default function MultiplayerRoundPage() {
  const router = useRouter();
  const params = useParams<{ roundId: string }>();
  const roundId = parseRoundId(params?.roundId);
  const playerName = useStore((state) => state.user.username) ?? 'Guest';
  const { systemCalls, account } = useStellar();
  const [isLoading, setIsLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [errorState, setError] = useState<string | null>(null);
  const isPlayer = !!account && players.includes(account.address);

  // Use our custom hook to manage the WebSocket connection and room state
  const { roomData, selectSong, leaveRoom } = useMultiplayerRoom({
    roomId: roundId?.toString() ?? '',
    playerName,
  });

  const loadRound = useCallback(async () => {
    if (!systemCalls || roundId === null) return;
    const [round, roundPlayers] = await Promise.all([
      systemCalls.getRound(roundId),
      systemCalls.getRoundPlayers(roundId),
    ]);
    setCurrentRound(round);
    setPlayers(roundPlayers);
  }, [systemCalls, roundId]);

  useEffect(() => {
    if (roundId === null) {
      setError('Invalid round id');
      return;
    }
    setError(null);
    loadRound().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load round'),
    );
  }, [roundId, loadRound]);

  // Handle back button click
  const handleBack = () => {
    leaveRoom();
    router.push('/multiplayer');
  };

  // Handle song selection
  const handleSongSelect = (option: SongOption, index: number) => {
    selectSong(index);
  };

  const runRoundAction = async (
    action: (id: bigint) => Promise<void>,
    fallbackError: string,
  ) => {
    if (!systemCalls || roundId === null) {
      setError('System calls not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await action(roundId);
      await loadRound();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRound = () =>
    runRoundAction((id) => systemCalls!.joinRound(id), 'Failed to join round');

  const handleStartRound = () =>
    runRoundAction(
      (id) => systemCalls!.startRound(id),
      'Failed to start round',
    );

  // Show loading state while connecting or if no room data
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Connecting to game room...</h2>
          {errorState && <p className="text-red-500">{errorState}</p>}
          <p className="text-sm text-gray-500 mt-2">
            This may take a moment...
          </p>
        </div>
      </div>
    );
  }
  // Fallback data in case roomData is incomplete
  const fallbackLyric = {
    text: '"All I know is that when I dey cock, I hit and go\nAll I know is that when I been shoot, I hit their own"',
    title: 'Unknown Song',
    artist: 'Unknown Artist',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Multiplayer Game</h1>

      {!currentRound ? (
        <p className="text-center text-gray-600">
          {errorState ? '' : `Loading round ${roundId?.toString() ?? ''}...`}
        </p>
      ) : (
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4">
            Round {currentRound.round_id.toString()}
          </h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="mb-2">Creator: {currentRound.admin}</p>
            <p className="mb-2">Genre: {currentRound.genre}</p>
            <p className="mb-2">
              State:{' '}
              {currentRound.is_cancelled
                ? 'Cancelled'
                : currentRound.is_completed
                  ? 'Completed'
                  : currentRound.is_started
                    ? 'Started'
                    : 'Pending'}
            </p>
            <p className="mb-2">Players: {players.length}</p>
            <p className="mb-2">
              Wager: {currentRound.wager_amount.toString()}
            </p>
          </div>

          {!currentRound.is_started && !isPlayer && (
            <Button
              onClick={handleJoinRound}
              disabled={isLoading || !account}
              className="w-full mt-4"
            >
              Join Round
            </Button>
          )}

          {!currentRound.is_started && isPlayer && (
            <Button
              onClick={handleStartRound}
              disabled={isLoading}
              className="w-full mt-4"
            >
              Start Round
            </Button>
          )}
        </div>
      )}

      {errorState && <p className="text-red-500 mt-4">{errorState}</p>}

      {/* Back button and header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold">
          {roomData?.name || 'Multiplayer Room'}
        </h1>
        <p className="text-gray-600 text-sm">{roomData?.description || ''}</p>
      </div>

      {currentRound?.is_started && (
        <>
          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lyric card - center column on desktop, full width on mobile */}
            <div className="lg:col-start-2 lg:col-span-1 order-1 lg:order-2">
              <LyricCard
                lyrics={[
                  {
                    text: roomData?.currentLyric?.text || fallbackLyric.text,
                    title: roomData?.currentLyric?.title || fallbackLyric.title,
                    artist:
                      roomData?.currentLyric?.artist || fallbackLyric.artist,
                  },
                ]}
                isFlipped={false}
              />
            </div>

            {/* Statistics panel - right column */}
            <div className="lg:col-start-3 lg:col-span-1 order-2 lg:order-3">
              <StatisticsPanel
                time={roomData?.timeLeft || '00:00'}
                potWin={roomData?.potWin || '0 STRK'}
                scores={`${roomData?.scores || 0}`}
              />
            </div>
          </div>

          {/* Song options */}
          {roomData?.songOptions && (
            <SongOptions
              options={roomData.songOptions}
              onSelect={handleSongSelect}
            />
          )}
        </>
      )}
    </div>
  );
}
