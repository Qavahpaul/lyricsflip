# LyricsFlip Real-Time Multiplayer Protocol

## Overview

This document specifies the real-time communication protocol between the LyricsFlip client and server using WebSocket (Socket.IO). The server acts as a relay for on-chain state and events, with the Soroban blockchain serving as the source of truth for game correctness and results.

## Architecture

- **Namespaces**: `/game` for game state and gameplay events
- **Transport**: WebSocket with Socket.IO (fallback to polling)
- **Authentication**: JWT token in socket handshake auth
- **CORS**: Configured via environment variable `CORS_ORIGINS`

## Client → Server Messages

### Room Management

#### `room:join`
Client joins a game room/round.

```typescript
socket.emit('room:join', {
  roomId: string;    // UUID of the game room/round
  playerId: string;  // User's wallet address or ID
});

// Response (server emits back):
// Success: { success: true, roomState: RoomState }
// Error: { success: false, error: string }
```

#### `room:leave`
Client leaves the room. Automatically called on disconnect.

```typescript
socket.emit('room:leave', {
  roomId: string;
});

// Response: { success: true }
```

#### `room:ready`
Player signals they are ready to start the round.

```typescript
socket.emit('room:ready', {
  roomId: string;
});

// Response: { success: true }
```

### Gameplay

#### `answer:submitted`
Player submits their answer to the current question.

```typescript
socket.emit('answer:submitted', {
  roomId: string;
  answer: string;           // The submitted answer
  roundIndex: number;       // Current round number
});

// Response: { success: true }
// Note: Validation and scoring happen on-chain; server relays the submission event
```

## Server → Client Messages (Events)

All server events are scoped to rooms using `socket.to(roomId).emit()`. Clients only receive events for rooms they've joined.

### Room State

#### `room:state`
Complete room state. Sent on join and after significant state changes.

```typescript
{
  roomId: string;
  status: 'waiting' | 'starting' | 'playing' | 'completed';
  players: Player[];
  currentRoundIndex: number;
  maxRounds: number;
  createdAt: ISO8601;
}

Player {
  playerId: string;
  username: string;
  isReady: boolean;
  score: number;
  joinedAt: ISO8601;
}
```

### Player Events

#### `player:joined`
A new player has joined the room.

```typescript
{
  playerId: string;
  username: string;
  playerCount: number;
  timestamp: ISO8601;
}
```

#### `player:left`
A player has left the room.

```typescript
{
  playerId: string;
  username: string;
  playerCount: number;
  timestamp: ISO8601;
}
```

#### `player:ready`
A player is ready (for round transitions).

```typescript
{
  playerId: string;
  readyCount: number;
  totalPlayers: number;
}
```

### Gameplay Events

#### `card:next`
A new question/lyric card is presented. Emitted when the round starts.

```typescript
{
  roundIndex: number;
  question: {
    id: string;
    lyrics: string;           // Partial or obfuscated lyrics
    options: string[];        // Multiple choice options (if applicable)
    timeLimit: number;        // Milliseconds to answer
  };
  timestamp: ISO8601;
}
```

#### `timer:tick`
Periodic timer update (1Hz or on-demand).

```typescript
{
  roundIndex: number;
  remainingMs: number;
  timestamp: ISO8601;
}
```

#### `score:update`
A player's score has changed (on-chain validation).

```typescript
{
  playerId: string;
  score: number;
  pointsGained: number;
  timestamp: ISO8601;
}
```

#### `round:completed`
A round has finished (on-chain events processed).

```typescript
{
  roundIndex: number;
  correctAnswer: string;
  playerResults: {
    playerId: string;
    answer: string;
    isCorrect: boolean;
    pointsEarned: number;
  }[];
  timestamp: ISO8601;
}
```

### System Events

#### `error`
An error occurred (validation, room not found, etc.).

```typescript
{
  code: string;           // e.g., 'ROOM_NOT_FOUND', 'INVALID_ANSWER'
  message: string;
  timestamp: ISO8601;
}
```

#### `disconnect`
Server is closing the connection (maintenance, auth failure, etc.).

```typescript
{
  reason: string;
  message: string;
}
```

## Event Source of Truth

1. **On-Chain Events** (Soroban):
   - `RoundCreated` → Server creates/initializes room
   - `RoundStarted` → Server broadcasts `card:next`
   - `AnswerSubmitted` → Logged and relayed
   - `RoundCompleted` → Server broadcasts `round:completed` with indexed results
   - `NftMinted` → Achievement unlocked (if applicable)

2. **Server-Managed State**:
   - Player join/leave within a room
   - Player ready status
   - Room creation timestamp
   - WebSocket connection state

3. **Client-Managed State**:
   - Local UI rendering (animations, timers)
   - Optimistic answer submission (awaits server validation)

## Connection Lifecycle

```
Client connects
   ↓
Socket auth validated (JWT)
   ↓
room:join
   ↓
Server emits: room:state, player:joined (to others)
   ↓
[Gameplay: card:next, timer:tick, score:update]
   ↓
room:leave or disconnect
   ↓
Server emits: player:left (to others)
   ↓
Connection closed
```

## Error Handling

- Invalid JWT → Disconnect before room operations
- Room not found → Emit `error` event, don't join
- Invalid answer submission → Emit `error` event, don't relay
- On-chain validation failure → Emit `error` event with reason
- RPC outage → Emit `error` event (indexer backlog, server waits for recovery)

## Configuration

**Environment Variables** (backend `.env`):

```
CORS_ORIGINS=http://localhost:3001,https://lyricsflip.example.com
WEBSOCKET_NAMESPACE=/game
SOCKET_IO_ADAPTER_PORT=3000
```

**Socket.IO Adapter Settings** (`config/socket-io.config.ts`):

- `pingInterval`: 10000ms (server → client keepalive)
- `pingTimeout`: 5000ms (wait for pong response)
- `connectTimeout`: 45000ms (initial connection timeout)
- `maxHttpBufferSize`: 1MB
- `transports`: ['websocket', 'polling'] (fallback support)

## Testing Strategy

1. **Unit Tests**: DTO validation, message parsing
2. **Integration Tests**: Socket.IO connection, room join/leave, event broadcasting
3. **E2E Tests** (with fixtures):
   - Two clients join same room → both receive `player:joined`
   - Client in room A doesn't receive events from room B
   - CORS rejection for disallowed origins
   - Graceful reconnection after network interruption

## References

- Issue #508 (LF-091): Real-time multiplayer protocol
- Issue #505 (LF-088): On-chain event indexer (Soroban events → Postgres)
- Related: LF-045 (optional WebSocket broadcast of indexed events)
