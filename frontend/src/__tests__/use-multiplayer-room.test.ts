import { act, renderHook } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useMultiplayerRoom } from '../hooks/use-multiplayer-room';
import type { RoomData } from '../types/realtime';

type Handler = (payload?: unknown) => void;

const handlers: Record<string, Handler> = {};
const mockSocket: Record<string, jest.Mock> = {
  on: jest.fn((event: string, handler: Handler) => {
    handlers[event] = handler;
  }),
  emit: jest.fn(),
  disconnect: jest.fn(),
  removeAllListeners: jest.fn(),
};

jest.mock('socket.io-client', () => ({ io: jest.fn(() => mockSocket) }));

const room: RoomData = {
  id: 'r1',
  name: 'Room',
  description: '',
  timeLeft: '01:00',
  potWin: '0',
  scores: 0,
  players: [{ id: 'p1', name: 'Alice', score: 0 }],
  currentLyric: { text: 'lyric' },
  songOptions: [],
};

const fire = (event: string, payload?: unknown) =>
  act(() => handlers[event](payload));

describe('useMultiplayerRoom', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(handlers).forEach((k) => delete handlers[k]);
  });

  const setup = () => {
    const hook = renderHook(() =>
      useMultiplayerRoom({ roomId: 'r1', playerName: 'Alice', token: 'jwt' }),
    );
    fire('connect');
    fire('room_data', room);
    return hook;
  };

  it('connects with auth and joins the room on connect', () => {
    const { result } = setup();
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: 'jwt' }, reconnection: true }),
    );
    expect(mockSocket.emit).toHaveBeenCalledWith('join_room', {
      roomId: 'r1',
      playerName: 'Alice',
    });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.roomData).toEqual(room);
  });

  it('handles player_joined and player_left', () => {
    const { result } = setup();
    fire('player_joined', { id: 'p2', name: 'Bob', score: 0 });
    expect(result.current.roomData?.players.map((p) => p.id)).toEqual([
      'p1',
      'p2',
    ]);
    fire('player_left', { playerId: 'p1' });
    expect(result.current.roomData?.players.map((p) => p.id)).toEqual(['p2']);
  });

  it('handles score_update', () => {
    const { result } = setup();
    fire('score_update', { playerId: 'p1', score: 5, totalScore: 5 });
    expect(result.current.roomData?.players[0].score).toBe(5);
    expect(result.current.roomData?.scores).toBe(5);
  });

  it('handles time_update and new_lyric', () => {
    const { result } = setup();
    fire('time_update', { timeLeft: '00:30' });
    expect(result.current.roomData?.timeLeft).toBe('00:30');
    const songOptions = [{ title: 'T', artist: 'A' }];
    fire('new_lyric', { lyric: { text: 'next' }, songOptions });
    expect(result.current.roomData?.currentLyric.text).toBe('next');
    expect(result.current.roomData?.songOptions).toEqual(songOptions);
  });

  it('handles room_error, connect_error and disconnect', () => {
    const { result } = setup();
    fire('room_error', { message: 'Room full' });
    expect(result.current.error).toBe('Room full');
    fire('disconnect');
    expect(result.current.isConnected).toBe(false);
    fire('connect_error');
    expect(result.current.error).toBe('Failed to connect to the game server');
  });

  it('emits select_song and leave_room', () => {
    const { result } = setup();
    act(() => result.current.selectSong(2));
    expect(mockSocket.emit).toHaveBeenCalledWith('select_song', {
      roomId: 'r1',
      songIndex: 2,
    });
    act(() => result.current.leaveRoom());
    expect(mockSocket.emit).toHaveBeenCalledWith('leave_room', {
      roomId: 'r1',
    });
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
