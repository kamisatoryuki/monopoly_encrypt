export type GameMode = 'classic' | 'solo';

export type GamePhase =
  | 'HOME'
  | 'SETUP'
  | 'READY_ROLL'
  | 'MOVING'
  | 'TILE_ACTION'
  | 'CHALLENGE'
  | 'TURN_END'
  | 'GAME_OVER';

export type TileType =
  | 'START'
  | 'PROPERTY'
  | 'CHALLENGE'
  | 'CARD'
  | 'TAX'
  | 'JAIL'
  | 'FREE_PARKING'
  | 'GO_TO_JAIL'
  | 'STATION'
  | 'UTILITY';

export type DistrictColor =
  | 'slate'
  | 'cyan'
  | 'teal'
  | 'amber'
  | 'indigo'
  | 'rose'
  | 'emerald'
  | 'violet';

export interface SessionMathKeys {
  /** Coefficient a in f(x) = a*x + b (range 2..5) */
  a: number;
  /** Constant b in f(x) = a*x + b (range 1..9) */
  b: number;
  /** Coefficient c in g(x) = c*x + d (range 2..5) */
  c: number;
  /** Constant d in g(x) = c*x + d (range 1..9) */
  d: number;
}

export type ChallengeTrigger =
  | 'BUY_PROPERTY'
  | 'SPECIAL_TILE'
  | 'SPECIAL_CARD'
  | 'JAIL_ESCAPE';

export type ChallengeStep = 'ENCRYPT' | 'DECRYPT';

export interface PairedChallenge {
  id: string;
  trigger: ChallengeTrigger;
  targetTileId?: number;
  title: string;
  contextNote: string;
  /** Normalized uppercase plaintext with A-Z and single spaces */
  plaintext: string;
  /** Plaintext mapped to 0..26 (0 = space, 1..26 = A..Z) */
  plainCodes: number[];
  /** Positive ciphertext integers produced by (g ∘ f)(x) = g(f(x)) */
  cipherNumbers: number[];
  /** Comma-separated ciphertext without slashes */
  cipherText: string;
  /** Current active step of the pair: Encrypt first, then Decrypt same ciphertext */
  currentStep: ChallengeStep;
  encryptSolved: boolean;
  decryptSolved: boolean;
  hintsRevealedEncrypt: number;
  hintsRevealedDecrypt: number;
  attempts: number;
  rewardCredits: number;
}

export interface BoardTile {
  id: number;
  name: string;
  type: TileType;
  district?: DistrictColor;
  price?: number;
  baseRent?: number;
  taxAmount?: number;
  loreText: string;
  isSourcePending?: boolean;
}

export interface CryptoniaCard {
  id: string;
  deck: 'ARCHIVE' | 'SIGNAL';
  title: string;
  description: string;
  effectType: 'CREDIT_DELTA' | 'MOVE_TO' | 'GO_TO_JAIL' | 'PAIRED_CHALLENGE';
  amount?: number;
  targetTileId?: number;
  isSourcePending?: boolean;
}

export interface CryptoniaLoreConfig {
  sourceStatus: 'PENDING_SOURCE_FILE' | 'CUSTOM_IMPORTED';
  sourceNote: string;
  prologueTitle: string;
  prologueParagraphs: string[];
  tileNames: Record<number, { name: string; loreText: string }>;
  challengePhrases: string[];
}

export type TokenShape =
  | 'hex'
  | 'diamond'
  | 'triangle'
  | 'circle'
  | 'shield'
  | 'star'
  | 'square'
  | 'cross';

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  shape: TokenShape;
  position: number;
  balance: number;
  ownedTileIds: number[];
  tileLevels: Record<number, number>;
  inJail: boolean;
  jailTurns: number;
  isBankrupt: boolean;
  challengesCompleted: number;
  challengesFailed: number;
  encryptCorrect: number;
  decryptCorrect: number;
  hintsUsed: number;
}

export interface DiceRoll {
  d1: number;
  d2: number;
  total: number;
  isDouble: boolean;
}

export interface SoloTimerState {
  totalSeconds: number;
  remainingSeconds: number;
  isPaused: boolean;
  lastUpdatedAt: number | null;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
}

export interface GameSession {
  id: string;
  mode: GameMode;
  phase: GamePhase;
  mathKeys: SessionMathKeys;
  players: PlayerState[];
  activePlayerIndex: number;
  consecutiveDoubles: number;
  lastDice: DiceRoll | null;
  activeTileId: number;
  pendingCard: CryptoniaCard | null;
  activeChallenge: PairedChallenge | null;
  soloTimer: SoloTimerState | null;
  turnCount: number;
  usedPhraseIndices: number[];
  winnerId: string | null;
  endedReason: string | null;
  logs: LogEntry[];
  startedAt: number;
}

export interface MatchSummaryRecord {
  id: string;
  mode: GameMode;
  finishedAt: number;
  durationSeconds: number;
  winnerName: string;
  netWorth: number;
  propertiesOwned: number;
  challengesCompleted: number;
  challengesFailed?: number;
  encryptCorrect?: number;
  decryptCorrect?: number;
  playerCount?: number;
  mathKeys?: SessionMathKeys;
  hintsUsed: number;
}
