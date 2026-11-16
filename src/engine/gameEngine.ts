import {
  buildBoardTiles,
  CRYPTONIA_CARDS,
  DEFAULT_CRYPTONIA_LORE,
} from '../data/cryptoniaLore';
import {
  BoardTile,
  ChallengeTrigger,
  CryptoniaLoreConfig,
  DiceRoll,
  GameMode,
  GameSession,
  LogEntry,
  MatchSummaryRecord,
  PlayerState,
  TokenShape,
} from '../types/game';
import {
  createPairedChallenge,
  generateSessionMathKeys,
} from './mathEngine';

export const PLAYER_PALETTE: { color: string; shape: TokenShape; label: string }[] = [
  { color: '#06B6D4', shape: 'hex', label: 'Cyan' },
  { color: '#F59E0B', shape: 'diamond', label: 'Amber' },
  { color: '#10B981', shape: 'triangle', label: 'Emerald' },
  { color: '#F43F5E', shape: 'circle', label: 'Coral' },
  { color: '#818CF8', shape: 'shield', label: 'Indigo' },
  { color: '#A78BFA', shape: 'star', label: 'Violet' },
  { color: '#2DD4BF', shape: 'square', label: 'Teal' },
  { color: '#FB923C', shape: 'cross', label: 'Oranye' },
];

export const SOLO_DURATION_SECONDS = 300;
export const PASS_START_BONUS = 200;
export const JAIL_TILE_ID = 10;
export const JAIL_BAIL_AMOUNT = 50;
export const INITIAL_BALANCE = 1500;

function nowTimeStr(): string {
  const d = new Date();
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function createLog(
  message: string,
  tone: LogEntry['tone'] = 'neutral'
): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: nowTimeStr(),
    message,
    tone,
  };
}

export function createNewSession(params: {
  mode: GameMode;
  playerNames: string[];
  lore?: CryptoniaLoreConfig;
}): GameSession {
  const mathKeys = generateSessionMathKeys();
  const cleanNames =
    params.mode === 'solo'
      ? [params.playerNames[0]?.trim() || 'Pemain Solo']
      : params.playerNames.map((n, i) => n.trim() || `Pemain ${i + 1}`);

  const players: PlayerState[] = cleanNames.map((name, idx) => {
    const preset = PLAYER_PALETTE[idx % PLAYER_PALETTE.length];
    return {
      id: `p-${idx + 1}`,
      name,
      color: preset.color,
      shape: preset.shape,
      position: 0,
      balance: INITIAL_BALANCE,
      ownedTileIds: [],
      tileLevels: {},
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      challengesCompleted: 0,
      challengesFailed: 0,
      encryptCorrect: 0,
      decryptCorrect: 0,
      hintsUsed: 0,
    };
  });

  return {
    id: `session-${Date.now()}`,
    mode: params.mode,
    phase: 'READY_ROLL',
    mathKeys,
    players,
    activePlayerIndex: 0,
    consecutiveDoubles: 0,
    lastDice: null,
    activeTileId: 0,
    pendingCard: null,
    activeChallenge: null,
    soloTimer:
      params.mode === 'solo'
        ? {
            totalSeconds: SOLO_DURATION_SECONDS,
            remainingSeconds: SOLO_DURATION_SECONDS,
            isPaused: false,
            lastUpdatedAt: Date.now(),
          }
        : null,
    turnCount: 1,
    usedPhraseIndices: [],
    winnerId: null,
    endedReason: null,
    logs: [
      createLog(
        params.mode === 'solo'
          ? 'Sesi Demo Solo dimulai (durasi 05:00). Kunci fungsi linear sesi telah diacak.'
          : `Sesi Classic Mode dimulai (${players.length} pemain). Kunci fungsi linear sesi telah diacak.`,
        'accent'
      ),
    ],
    startedAt: Date.now(),
  };
}

export function rollDicePair(rng: () => number = Math.random): DiceRoll {
  const d1 = Math.floor(rng() * 6) + 1;
  const d2 = Math.floor(rng() * 6) + 1;
  return {
    d1,
    d2,
    total: d1 + d2,
    isDouble: d1 === d2,
  };
}

export function pickNextPhrase(
  session: GameSession,
  lore: CryptoniaLoreConfig = DEFAULT_CRYPTONIA_LORE
): { phrase: string; nextUsedIndices: number[] } {
  const pool =
    lore.challengePhrases.length > 0
      ? lore.challengePhrases
      : DEFAULT_CRYPTONIA_LORE.challengePhrases;

  let used = [...session.usedPhraseIndices];
  if (used.length >= pool.length) {
    used = [];
  }

  const available = pool
    .map((_, idx) => idx)
    .filter((idx) => !used.includes(idx));
  const chosenIdx = available[Math.floor(Math.random() * available.length)] ?? 0;

  return {
    phrase: pool[chosenIdx],
    nextUsedIndices: [...used, chosenIdx],
  };
}

export function calculateTileRent(
  tile: BoardTile,
  owner: PlayerState,
  allTiles: BoardTile[]
): number {
  if (!tile.baseRent) return 0;
  if (tile.type === 'STATION') {
    const ownedStations = owner.ownedTileIds.filter(
      (tid) => allTiles[tid]?.type === 'STATION'
    ).length;
    return tile.baseRent * Math.max(1, ownedStations);
  }
  if (tile.type === 'UTILITY') {
    const ownedUtils = owner.ownedTileIds.filter(
      (tid) => allTiles[tid]?.type === 'UTILITY'
    ).length;
    return tile.baseRent * (ownedUtils >= 2 ? 2 : 1);
  }
  const level = owner.tileLevels[tile.id] ?? 0;
  const groupTiles = allTiles.filter(
    (t) => t.type === 'PROPERTY' && t.district === tile.district
  );
  const ownsFullDistrict =
    groupTiles.length > 0 &&
    groupTiles.every((t) => owner.ownedTileIds.includes(t.id));

  const base = ownsFullDistrict ? tile.baseRent * 2 : tile.baseRent;
  return base + level * Math.round(tile.baseRent * 0.75);
}

export function calculatePlayerNetWorth(
  player: PlayerState,
  allTiles: BoardTile[]
): number {
  const propertyValue = player.ownedTileIds.reduce((sum, tid) => {
    const t = allTiles[tid];
    const level = player.tileLevels[tid] ?? 0;
    const price = t?.price ?? 0;
    return sum + price + level * Math.round(price * 0.5);
  }, 0);
  return player.balance + propertyValue;
}

export function buildChallengeForTrigger(params: {
  session: GameSession;
  trigger: ChallengeTrigger;
  tile?: BoardTile;
  rewardCredits?: number;
  lore?: CryptoniaLoreConfig;
}): { challenge: ReturnType<typeof createPairedChallenge>; nextUsedIndices: number[] } {
  const { phrase, nextUsedIndices } = pickNextPhrase(
    params.session,
    params.lore
  );

  const titleMap: Record<ChallengeTrigger, string> = {
    BUY_PROPERTY: `Verifikasi Pembelian · ${params.tile?.name || 'Properti'}`,
    SPECIAL_TILE: `Petak Tantangan · ${params.tile?.name || 'Tantangan Khusus'}`,
    SPECIAL_CARD: 'Kartu Dekripsi Spesial',
    JAIL_ESCAPE: 'Tantangan Bebas Penjara',
  };

  const contextMap: Record<ChallengeTrigger, string> = {
    BUY_PROPERTY: `Selesaikan pasangan enkripsi (g ∘ f)(x) lalu dekripsi inversnya untuk membuka hak beli properti (${params.tile?.price ?? 0} Kredit).`,
    SPECIAL_TILE:
      'Selesaikan enkripsi lalu dekripsi ciphertext yang sama untuk meraih bonus kredit Demo Solo.',
    SPECIAL_CARD:
      'Validasi sinyal kartu dengan enkripsi komposisi dan dekripsi invers untuk mengklaim hadiah kartu.',
    JAIL_ESCAPE:
      'Buktikan kelayakan pembebasan dengan mengenkripsi lalu mendekripsi ulang kata sandi ini.',
  };

  const challenge = createPairedChallenge({
    id: `chg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    trigger: params.trigger,
    targetTileId: params.tile?.id,
    title: titleMap[params.trigger],
    contextNote: contextMap[params.trigger],
    rawPlaintext: phrase,
    keys: params.session.mathKeys,
    rewardCredits: params.rewardCredits ?? 120,
  });

  return { challenge, nextUsedIndices };
}

export function findTileOwner(
  players: PlayerState[],
  tileId: number
): PlayerState | undefined {
  return players.find((p) => !p.isBankrupt && p.ownedTileIds.includes(tileId));
}

export function nextActivePlayerIndex(
  players: PlayerState[],
  currentIndex: number
): number {
  const total = players.length;
  for (let offset = 1; offset <= total; offset++) {
    const idx = (currentIndex + offset) % total;
    if (!players[idx].isBankrupt) return idx;
  }
  return currentIndex;
}

export function drawRandomCard(): (typeof CRYPTONIA_CARDS)[number] {
  return CRYPTONIA_CARDS[Math.floor(Math.random() * CRYPTONIA_CARDS.length)];
}

export function buildMatchSummaryRecord(
  session: GameSession,
  lore: CryptoniaLoreConfig
): MatchSummaryRecord {
  const tiles = buildBoardTiles(session.mode, lore);
  const sorted = [...session.players].sort(
    (a, b) =>
      calculatePlayerNetWorth(b, tiles) - calculatePlayerNetWorth(a, tiles)
  );
  const top = sorted[0];
  const durationSeconds =
    session.mode === 'solo' && session.soloTimer
      ? session.soloTimer.totalSeconds - session.soloTimer.remainingSeconds
      : Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));

  return {
    id: session.id,
    mode: session.mode,
    finishedAt: Date.now(),
    durationSeconds,
    winnerName: top?.name || 'Pemain',
    netWorth: top ? calculatePlayerNetWorth(top, tiles) : 0,
    propertiesOwned: top ? top.ownedTileIds.length : 0,
    challengesCompleted: session.players.reduce(
      (s, p) => s + p.challengesCompleted,
      0
    ),
    challengesFailed: session.players.reduce(
      (s, p) => s + p.challengesFailed,
      0
    ),
    encryptCorrect: session.players.reduce(
      (s, p) => s + p.encryptCorrect,
      0
    ),
    decryptCorrect: session.players.reduce(
      (s, p) => s + p.decryptCorrect,
      0
    ),
    playerCount: session.players.length,
    mathKeys: session.mathKeys,
    hintsUsed: session.players.reduce((s, p) => s + p.hintsUsed, 0),
  };
}
