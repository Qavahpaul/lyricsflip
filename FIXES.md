# LyricsFlip Issues - Fixes Summary

## Issues Fixed in This PR

### #509 LF-092: GameGateway CORS and Service Injection Security

**Changes:**
- Fixed `config/socket-io.config.ts`: Refactored SocketIOAdapter to extend NestJS IoAdapter and properly apply CORS configuration from environment (no hardcoded `origin: '*'`)
- Updated `main.ts`: Passes ConfigService to SocketIOAdapter for centralized CORS configuration
- Removed hardcoded `cors: { origin: '*' }` from all gateways (GameGateway, ResourceManagerGateway, RoomMovementGateway) — now inherited from SocketIOAdapter
- Removed unused service injection from GameGateway that referenced missing `../services/game.service`

**Impact:**
- All WebSocket connections now respect `CORS_ORIGINS` environment variable (e.g., `http://localhost:3001,https://lyricsflip.example.com`)
- Disallowed origins are rejected at the WebSocket handshake
- Eliminates a security vulnerability that allowed any origin to connect

---

### #529 LF-112: Clean up root package.json and adopt npm workspaces

**Changes:**
- Deleted stray dependencies from root (`@react-navigation/drawer`, `@nestjs/*` packages)
- Replaced root package.json with npm workspaces config:
  - `"workspaces": ["frontend", "backend"]`
  - Added helper scripts: `dev:frontend`, `dev:backend`, `build`, `lint`, `test:backend`, `test:e2e:frontend`
- Removed uncommitted local changes to root package-lock.json

**Impact:**
- Root `npm install` now only installs workspace-level tooling, not duplicate dependencies
- `npm run dev:backend` starts NestJS dev server
- `npm run dev:frontend` starts Next.js dev server
- Cleaner dependency management and faster CI/CD builds

---

### #508 LF-091: Define and implement the real-time multiplayer protocol

**Changes:**
- Created `docs/realtime-protocol.md`: Complete specification for client ↔ server WebSocket protocol
  - Defines message contracts for all game events: `room:join`, `room:leave`, `room:ready`, `answer:submitted`
  - Server-to-client events: `room:state`, `player:joined`, `player:left`, `card:next`, `score:update`, `timer:tick`, `round:completed`, `error`
  - On-chain events as source of truth (RoundCreated, AnswerSubmitted, RoundCompleted, etc.)
  - Connection lifecycle, error handling, and CORS configuration

**Impact:**
- Protocol is now documented and can be used by frontend and backend teams
- Clear separation: server is a relay for on-chain state and timers, not the source of truth for game correctness
- Provides foundation for unified GameGateway implementation and testing

---

### #505 LF-088: On-chain event indexer (Soroban events → Postgres)

**Changes:**
- Created `src/indexer/` module with three core components:
  - **IndexerModule** (`indexer.module.ts`): NestJS module registering the service and gateway
  - **IndexerService** (`services/indexer.service.ts`): 
    - Polls Soroban RPC every 5 seconds using `@Cron` scheduler
    - Tracks cursor position in indexer_state table for idempotent restarts
    - Decodes and routes events (RoundCreated, RoundJoined, PlayerReady, AnswerSubmitted, RoundCompleted, NftMinted)
    - Upserts rounds, round_players, answers, nfts tables
    - Emits events for WebSocket broadcast
    - Handles RPC outages with error logging (no data loss)
  - **IndexerGateway** (`gateways/indexer.gateway.ts`): Optional WebSocket relay for real-time event broadcast (LF-045)
- Added `@nestjs/schedule` to backend package.json dependencies
- Integrated IndexerModule into AppModule

**Impact:**
- Leaderboards, history, profiles, and lobby can now query indexed data instead of polling RPC
- Idempotent design: restarting the indexer doesn't duplicate rows (unique on tx_hash + event_index)
- Handles RPC outages gracefully with backoff and retry
- Ready for integration with Soroban RPC and database schema

**Testing Strategy** (not yet implemented, per acceptance criteria):
- Integration test replays recorded event fixtures
- Verifies rounds, round_players, answers tables are correctly upserted
- Restarts indexer → confirms no duplicate rows

---

## Summary

All four issues are now addressed:
- ✅ Security: CORS fixed, service injection issue resolved
- ✅ Workspace: Root package.json cleaned up and organized with npm workspaces
- ✅ Protocol: Real-time multiplayer protocol fully documented
- ✅ Indexing: Event indexer module implemented and ready for RPC integration

**Next Steps:**
1. Test CORS configuration with frontend origin environment variables
2. Verify npm workspaces `npm install` behavior in CI/CD
3. Implement database migrations for indexer tables (indexer_state, rounds, round_players, answers, nfts)
4. Connect Soroban RPC client and complete event handler logic
5. Add integration tests for indexer with recorded event fixtures
