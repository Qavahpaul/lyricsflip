// Shared realtime protocol between the frontend and the backend Socket.IO
// gateway (LF-091). Keep event names and payloads in sync with the backend.

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface SongOption {
  title: string;
  artist: string;
}

export interface RoomData {
  id: string;
  name: string;
  description: string;
  timeLeft: string;
  potWin: string;
  scores: number;
  players: Player[];
  currentLyric: {
    text: string;
    title?: string;
    artist?: string;
  };
  songOptions: SongOption[];
}

/** Events emitted by the server. */
export interface ServerToClientEvents {
  room_data: (payload: RoomData) => void;
  player_joined: (payload: Player) => void;
  player_left: (payload: { playerId: string }) => void;
  player_answered: (payload: { playerId: string; songIndex: number }) => void;
  score_update: (payload: {
    playerId: string;
    score: number;
    totalScore: number;
  }) => void;
  time_update: (payload: { timeLeft: string }) => void;
  new_lyric: (payload: {
    lyric: RoomData['currentLyric'];
    songOptions: SongOption[];
  }) => void;
  room_error: (payload: { message: string }) => void;
}

/** Events emitted by the client. */
export interface ClientToServerEvents {
  join_room: (payload: { roomId: string; playerName: string }) => void;
  select_song: (payload: { roomId: string; songIndex: number }) => void;
  leave_room: (payload: { roomId: string }) => void;
}
