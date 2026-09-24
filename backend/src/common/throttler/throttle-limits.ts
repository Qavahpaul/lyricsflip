import { Throttle } from '@nestjs/throttler';

/** Global default: general reads. */
export const DEFAULT_THROTTLE = { ttl: 60_000, limit: 60 };

/** Auth challenges: sign-in, sign-up, refresh, password reset. */
export const AUTH_THROTTLE = { ttl: 60_000, limit: 5 };

/** Off-chain answer / guess submission. */
export const ANSWER_THROTTLE = { ttl: 60_000, limit: 10 };

export const AuthThrottle = () => Throttle({ default: AUTH_THROTTLE });
export const AnswerThrottle = () => Throttle({ default: ANSWER_THROTTLE });
