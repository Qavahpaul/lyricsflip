import { Reflector } from '@nestjs/core';
import { AuthController } from '../../auth/auth.controller';
import { GameSessionController } from '../../game-session/game-session.controller';
import {
  ANSWER_THROTTLE,
  AUTH_THROTTLE,
  DEFAULT_THROTTLE,
} from './throttle-limits';

// @nestjs/throttler stores per-route overrides under these metadata keys.
const LIMIT_KEY = 'THROTTLER:LIMITdefault';
const TTL_KEY = 'THROTTLER:TTLdefault';

describe('per-route throttle limits', () => {
  const reflector = new Reflector();

  it('auth routes use the stricter auth limit, independent of the global limit', () => {
    // Applied at controller level so it covers every /auth/* route.
    expect(reflector.get(LIMIT_KEY, AuthController)).toBe(AUTH_THROTTLE.limit);
    expect(reflector.get(TTL_KEY, AuthController)).toBe(AUTH_THROTTLE.ttl);
    expect(AUTH_THROTTLE.limit).toBeLessThan(DEFAULT_THROTTLE.limit);
  });

  it('answer submission uses the answer limit', () => {
    const handler = GameSessionController.prototype.submitGuess;
    expect(reflector.get(LIMIT_KEY, handler)).toBe(ANSWER_THROTTLE.limit);
    expect(reflector.get(TTL_KEY, handler)).toBe(ANSWER_THROTTLE.ttl);
    expect(ANSWER_THROTTLE.limit).toBeLessThan(DEFAULT_THROTTLE.limit);
  });
});
