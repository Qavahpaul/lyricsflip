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
import { useCallback, useEffect, useState } from 'react';
import { LyricCard } from '@/components/organisms/LyricCard';
import { StatisticsPanel } from '@/components/molecules/statistics-panel';
import { SongOptions } from '@/components/molecules/song-options';
import ChallengeInvite from '@/components/organisms/challangeInvite';
import { Button } from '@/components/atoms/button';
import { useMultiplayerRoom } from '@/hooks/use-multiplayer-room';
import { useRoundEvents } from '@/hooks/useRoundEvents';
import { useStellar } from '@/lib/stellar/hooks/useStellar';
import type { Round } from '@/lib/stellar/types';

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
  const rawRoundId = params?.roundId ?? '';
  const isValidId = /^\d+$/.test(rawRoundId);
  const roundId = isValidId ? BigInt(rawRoundId) : null;

  const { systemCalls, account, connect } = useStellar();
  const [round, setRound] = useState<Round | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    isValidId ? null : 'That invite link is not valid.',
  );

  const events = useRoundEvents(round ? roundId : null);
  const allPlayers = Array.from(new Set([...players, ...events.joined]));
  const isStarted = !!round?.is_started || events.started;
  const isReady = !!account && events.ready.includes(account.address);

  const { roomData, selectSong } = useMultiplayerRoom({
    roomId: isStarted ? rawRoundId : '',
    playerName: account?.address ?? 'Guest',
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
    try {
      const [roundData, roundPlayers] = await Promise.all([
        systemCalls.getRound(roundId),
        systemCalls.getRoundPlayers(roundId),
      ]);
      setRound(roundData);
      setPlayers(roundPlayers);
      return { roundData, roundPlayers };
    } catch {
      setError(`Round ${rawRoundId} does not exist or could not be loaded.`);
    } finally {
      setIsLoading(false);
    }
  }, [systemCalls, roundId, rawRoundId]);

  // Load the round, then join it once a wallet is connected.
  useEffect(() => {
    if (!systemCalls || roundId === null) {
      if (roundId === null) setIsLoading(false);
      return;
    }
    const run = async () => {
      const loaded = await loadRound();
      if (!loaded || !account) return;
      const { roundData, roundPlayers } = loaded;
      if (roundData.is_cancelled || roundData.is_completed) {
        setError('This round is no longer open.');
        return;
      }
      if (roundData.is_started || roundPlayers.includes(account.address))
        return;
      try {
        setIsBusy(true);
        await systemCalls.joinRound(roundId);
        await loadRound();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join round');
      } finally {
        setIsBusy(false);
      }
    };
    run();
  }, [systemCalls, roundId, account, loadRound]);

  const handleReady = async () => {
    if (!systemCalls || roundId === null) return;
    setIsBusy(true);
    setError(null);
    try {
      await systemCalls.startRound(roundId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark ready');
    } finally {
      setIsBusy(false);
    }
  };

  const handleBack = () => router.push('/multiplayer');

  const shell = (content: React.ReactNode) => (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="flex items-center text-gray-600 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>
      {content}
    </div>
  );

  if (error && !round) {
    return shell(<p className="text-red-500">{error}</p>);
  }

  if (isLoading || !round) {
    return shell(<p>Loading round…</p>);
  }

  if (!account) {
    return shell(
      <div className="max-w-md mx-auto text-center">
        <p className="mb-4">Connect your wallet to join round {rawRoundId}.</p>
        <Button onClick={() => connect()} className="w-full">
          Connect wallet
        </Button>
      </div>,
    );
  }

  if (!isStarted) {
    return shell(
      <>
        <div className="max-w-md mx-auto mb-6">
          <h2 className="text-xl font-bold mb-2">
            Players ({allPlayers.length})
          </h2>
          <ul className="space-y-1">
            {allPlayers.map((p) => (
              <li key={p} className="flex justify-between text-sm">
                <span className="truncate mr-2">
                  {p === account.address ? `${p} (you)` : p}
                </span>
                <span
                  className={
                    events.ready.includes(p)
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }
                >
                  {events.ready.includes(p) ? 'Ready' : 'Not ready'}
                </span>
              </li>
            ))}
          </ul>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {events.error && (
            <p className="text-red-500 mt-2 text-sm">{events.error}</p>
          )}
        </div>
        <ChallengeInvite
          round={round}
          players={allPlayers}
          isReady={isReady}
          isBusy={isBusy}
          onReady={handleReady}
        />
      </>,
    );
  }

  return shell(
    <>
      <h1 className="text-2xl font-bold mb-6">
        {roomData?.name || `Round ${rawRoundId}`}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-start-2 lg:col-span-1 order-1 lg:order-2">
          <LyricCard
            lyrics={[
              {
                text:
                  roomData?.currentLyric?.text || 'Waiting for the first card…',
                title: roomData?.currentLyric?.title || '',
                artist: roomData?.currentLyric?.artist || '',
              },
            ]}
            isFlipped={false}
          />
        </div>
        <div className="lg:col-start-3 lg:col-span-1 order-2 lg:order-3">
          <StatisticsPanel
            time={roomData?.timeLeft || '00:00'}
            potWin={`${round.wager_amount.toString()}`}
            scores={`${roomData?.scores || 0}`}
          />
        </div>
      </div>
      {roomData?.songOptions && (
        <SongOptions
          options={roomData.songOptions}
          onSelect={(_, index) => selectSong(index)}
        />
      )}
    </>,
  );
}
