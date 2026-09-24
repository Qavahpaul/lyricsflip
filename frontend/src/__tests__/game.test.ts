import { useStore } from '../store';

const game = () => useStore.getState().game;

describe('Game State Management', () => {
  beforeEach(() => {
    game().resetGame();
  });

  test('initial state', () => {
    const state = game();
    expect(state.score).toBe(0);
    expect(state.currentRound).toBe(0);
    expect(state.gameStatus).toBe('idle');
    expect(state.roundId).toBeNull();
  });

  test('start game sets playing status and duration', () => {
    game().startGame({ genre: 'pop', difficulty: 'easy', duration: '5 mins', odds: 2, wagerAmount: 100 });
    const state = game();
    expect(state.gameStatus).toBe('playing');
    expect(state.timeLeft).toBe(300);
    expect(state.potentialWin).toBe(200);
  });

  test('end game sets ended status', () => {
    game().endGame();
    expect(game().gameStatus).toBe('ended');
  });

  test('increase score updates score and round', () => {
    game().increaseScore();
    const state = game();
    expect(state.score).toBe(1);
    expect(state.currentRound).toBe(1);
    expect(state.lastGuessResult).toBe('correct');
  });

  test('round id set before starting a game is shared', () => {
    game().setRoundId(BigInt(42));
    game().startGame({ genre: 'rock', difficulty: 'hard', duration: '10 mins', odds: 3, wagerAmount: 200 });
    expect(game().roundId).toBe(BigInt(42));
  });

  test('reset game returns to initial state', () => {
    game().startGame({ genre: 'rock', difficulty: 'hard', duration: '10 mins', odds: 3, wagerAmount: 200 });
    game().resetGame();
    const state = game();
    expect(state.score).toBe(0);
    expect(state.currentRound).toBe(0);
    expect(state.gameStatus).toBe('idle');
    expect(state.roundId).toBeNull();
  });
});
