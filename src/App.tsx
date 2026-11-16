import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Board40 } from './components/Board40';
import { ChallengeModal } from './components/ChallengeModal';
import { EncryptionGuideModal } from './components/EncryptionGuideModal';
import { GameSummaryView } from './components/GameSummaryView';
import { HomeSetupView } from './components/HomeSetupView';
import { LoreImportModal } from './components/LoreImportModal';
import { SideCommandPanel } from './components/SideCommandPanel';
import { StatsDashboardView } from './components/StatsDashboardView';
import { buildBoardTiles, buildCryptoniaCards } from './data/cryptoniaLore';
import {
  DEFAULT_CRYPTONIA_STORY,
  STORY_ASSET_PATH,
} from './data/storyDefaults';
import {
  buildChallengeForTrigger,
  buildMatchSummaryRecord,
  calculateTileRent,
  createLog,
  createNewSession,
  findTileOwner,
  getNextMixedStateOnSolve,
  JAIL_BAIL_AMOUNT,
  JAIL_TILE_ID,
  nextActivePlayerIndex,
  PASS_START_BONUS,
  rollDicePair,
} from './engine/gameEngine';
import { generateSessionMathKeys } from './engine/mathEngine';
import { soundFx } from './services/soundFx';
import {
  clearMatchHistory,
  loadActiveSession,
  loadLoreConfig,
  loadMatchHistory,
  loadSoundPreference,
  resetCustomLore,
  saveActiveSession,
  saveCustomLore,
  saveMatchSummary,
  saveSoundPreference,
} from './services/storage';
import {
  ChallengeType,
  CryptoniaLoreConfig,
  GameMode,
  GameSession,
  MatchSummaryRecord,
  SessionMathKeys,
} from './types/game';
import { CryptoniaStory } from './types/story';

function pickFlavor(list: string[], fallback: string): string {
  if (!list || list.length === 0) return fallback;
  return list[Math.floor(Math.random() * list.length)];
}

export default function App() {
  const [story, setStory] = useState<CryptoniaStory>(DEFAULT_CRYPTONIA_STORY);
  const [lore, setLore] = useState<CryptoniaLoreConfig>(() => loadLoreConfig());
  const [previewKeys, setPreviewKeys] = useState<SessionMathKeys>(() =>
    generateSessionMathKeys()
  );
  const [savedSession, setSavedSession] = useState<GameSession | null>(() =>
    loadActiveSession()
  );
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchSummaryRecord[]>(() =>
    loadMatchHistory()
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const pref = loadSoundPreference();
    soundFx.setEnabled(pref);
    return pref;
  });

  const [selectedChallengeType, setSelectedChallengeType] =
    useState<ChallengeType>('mixed');
  const [selectedTileId, setSelectedTileId] = useState<number>(0);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);
  const [loreModalOpen, setLoreModalOpen] = useState<boolean>(false);
  const [showGameIntro, setShowGameIntro] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);

  const moveTimerRef = useRef<number | null>(null);

  // Load attached Cryptonia 2099 story JSON directly from public asset path
  useEffect(() => {
    let cancelled = false;
    fetch(STORY_ASSET_PATH)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CryptoniaStory | null) => {
        if (!cancelled && data && data.title && data.prologue?.slides) {
          setStory(data);
        }
      })
      .catch(() => {
        // Fallback already initialized to DEFAULT_CRYPTONIA_STORY
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentTiles = useMemo(
    () => buildBoardTiles(activeSession?.mode ?? 'classic', lore, story),
    [activeSession?.mode, lore, story]
  );

  const currentCards = useMemo(() => buildCryptoniaCards(story), [story]);
  const currentFormulaKeys = activeSession?.mathKeys ?? previewKeys;

  // Persist active session cleanly
  useEffect(() => {
    if (activeSession) {
      saveActiveSession(activeSession);
      setSavedSession(activeSession);
    }
  }, [activeSession]);

  // Cleanup movement timer on unmount
  useEffect(() => {
    return () => {
      if (moveTimerRef.current !== null) {
        window.clearTimeout(moveTimerRef.current);
      }
    };
  }, []);

  const finalizeGameOver = useCallback(
    (sessionToFinish: GameSession, reason: string, winnerId: string | null) => {
      const finished: GameSession = {
        ...sessionToFinish,
        phase: 'GAME_OVER',
        winnerId,
        endedReason: reason,
        activeChallenge: null,
        pendingCard: null,
        logs: [createLog(reason, 'accent'), ...sessionToFinish.logs].slice(
          0,
          40
        ),
      };
      soundFx.finish();
      const record = buildMatchSummaryRecord(finished, lore);
      saveMatchSummary(record);
      setMatchHistory(loadMatchHistory());
      saveActiveSession(null);
      setSavedSession(null);
      return finished;
    },
    [lore]
  );

  // Demo Solo 5-minute countdown timer (pause-safe & auto-ends at 00:00)
  useEffect(() => {
    if (
      !activeSession ||
      activeSession.mode !== 'solo' ||
      activeSession.phase === 'GAME_OVER' ||
      !activeSession.soloTimer ||
      activeSession.soloTimer.isPaused
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSession((prev) => {
        if (
          !prev ||
          prev.mode !== 'solo' ||
          prev.phase === 'GAME_OVER' ||
          !prev.soloTimer ||
          prev.soloTimer.isPaused
        ) {
          return prev;
        }
        const nextRemaining = Math.max(0, prev.soloTimer.remainingSeconds - 1);
        const updated: GameSession = {
          ...prev,
          soloTimer: {
            ...prev.soloTimer,
            remainingSeconds: nextRemaining,
            lastUpdatedAt: Date.now(),
          },
        };
        if (nextRemaining <= 0) {
          return finalizeGameOver(
            updated,
            'Waktu Demo Solo 05:00 telah mencapai 00:00.',
            updated.players[0]?.id ?? null
          );
        }
        return updated;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [
    activeSession?.id,
    activeSession?.mode,
    activeSession?.phase,
    activeSession?.soloTimer?.isPaused,
    finalizeGameOver,
  ]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setEnabled(next);
    saveSoundPreference(next);
  };

  const handleStartGame = (
    mode: GameMode,
    challengeType: ChallengeType,
    playerNames: string[]
  ) => {
    setSelectedChallengeType(challengeType);
    const session = createNewSession({
      mode,
      challengeType,
      playerNames,
      lore,
    });
    setActiveSession(session);
    setSelectedTileId(0);
    setIsMoving(false);
    setShowGameIntro(true);
  };

  const handleResumeSavedSession = () => {
    const loaded = loadActiveSession();
    if (!loaded) return;
    const restored: GameSession = {
      ...loaded,
      soloTimer: loaded.soloTimer
        ? {
            ...loaded.soloTimer,
            lastUpdatedAt: Date.now(),
          }
        : null,
    };
    setActiveSession(restored);
    setSelectedTileId(restored.activeTileId ?? 0);
    setShowGameIntro(false);
  };

  const handleDiscardSavedSession = () => {
    saveActiveSession(null);
    setSavedSession(null);
  };

  const handleTogglePauseSolo = () => {
    setActiveSession((prev) => {
      if (!prev || !prev.soloTimer) return prev;
      const nextPaused = !prev.soloTimer.isPaused;
      return {
        ...prev,
        soloTimer: {
          ...prev.soloTimer,
          isPaused: nextPaused,
          lastUpdatedAt: Date.now(),
        },
        logs: [
          createLog(
            nextPaused
              ? `Timer Demo Solo dijeda pada ${Math.floor(
                  prev.soloTimer.remainingSeconds / 60
                )
                  .toString()
                  .padStart(2, '0')}:${(prev.soloTimer.remainingSeconds % 60)
                  .toString()
                  .padStart(2, '0')}.`
              : 'Timer Demo Solo dilanjutkan.',
            'warning'
          ),
          ...prev.logs,
        ].slice(0, 40),
      };
    });
  };

  const advanceTurnOrEnd = useCallback(
    (session: GameSession, allowDoubleRepeat = true): GameSession => {
      const current = session.players[session.activePlayerIndex];

      // Check Classic Mode bankruptcy victory
      if (session.mode === 'classic') {
        const alive = session.players.filter((p) => !p.isBankrupt);
        if (alive.length <= 1) {
          const winner = alive[0] ?? current;
          return finalizeGameOver(
            session,
            story.winner.text,
            winner.id
          );
        }
      }

      const canRepeatDouble =
        allowDoubleRepeat &&
        session.lastDice?.isDouble &&
        !current.inJail &&
        !current.isBankrupt &&
        session.consecutiveDoubles > 0 &&
        session.consecutiveDoubles < 3;

      if (canRepeatDouble) {
        return {
          ...session,
          phase: 'READY_ROLL',
          pendingCard: null,
          activeChallenge: null,
          logs: [
            createLog(
              `${current.name} memperoleh dadu ganda dan mendapat giliran lempar ulang.`,
              'accent'
            ),
            ...session.logs,
          ].slice(0, 40),
        };
      }

      const nextIdx = nextActivePlayerIndex(
        session.players,
        session.activePlayerIndex
      );
      return {
        ...session,
        phase: 'READY_ROLL',
        activePlayerIndex: nextIdx,
        consecutiveDoubles: 0,
        pendingCard: null,
        activeChallenge: null,
        turnCount: session.turnCount + 1,
        activeTileId: session.players[nextIdx]?.position ?? 0,
      };
    },
    [finalizeGameOver, story.winner.text]
  );

  const applyBalanceDelta = (
    session: GameSession,
    playerIndex: number,
    delta: number,
    reason: string,
    tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
  ): GameSession => {
    const players = session.players.map((p, idx) => {
      if (idx !== playerIndex) return p;
      const nextBalance = p.balance + delta;
      if (nextBalance < 0 && session.mode === 'classic') {
        return {
          ...p,
          balance: 0,
          isBankrupt: true,
          ownedTileIds: [],
          tileLevels: {},
        };
      }
      return { ...p, balance: Math.max(0, nextBalance) };
    });

    const target = players[playerIndex];
    const logMessage = target.isBankrupt
      ? `${target.name} — ${story.bankruptcy.title}: ${story.bankruptcy.settled}`
      : `${target.name}: ${reason}`;

    return {
      ...session,
      players,
      logs: [
        createLog(logMessage, target.isBankrupt ? 'danger' : tone),
        ...session.logs,
      ].slice(0, 40),
    };
  };

  const resolveLandingTile = useCallback(
    (session: GameSession, landedTileId: number): GameSession => {
      const tiles = buildBoardTiles(session.mode, lore, story);
      const tile = tiles[landedTileId];
      const pIdx = session.activePlayerIndex;
      const player = session.players[pIdx];

      if (tile.type === 'START') {
        return {
          ...session,
          phase: 'TILE_ACTION',
          activeTileId: tile.id,
          logs: [
            createLog(
              `${player.name} tiba di Gerbang Kota. ${pickFlavor(
                story.flavor.goSalary,
                ''
              )}`,
              'accent'
            ),
            ...session.logs,
          ].slice(0, 40),
        };
      }

      if (tile.type === 'FREE_PARKING' || tile.type === 'JAIL') {
        return {
          ...session,
          phase: 'TILE_ACTION',
          activeTileId: tile.id,
          logs: [
            createLog(
              tile.type === 'JAIL'
                ? `${player.name}: ${story.jail.visiting}`
                : `${player.name} singgah di ${tile.name}.`,
              'neutral'
            ),
            ...session.logs,
          ].slice(0, 40),
        };
      }

      if (tile.type === 'GO_TO_JAIL') {
        const updatedPlayers = session.players.map((p, idx) =>
          idx === pIdx
            ? { ...p, position: JAIL_TILE_ID, inJail: true, jailTurns: 0 }
            : p
        );
        soundFx.error();
        setSelectedTileId(JAIL_TILE_ID);
        return advanceTurnOrEnd(
          {
            ...session,
            players: updatedPlayers,
            activeTileId: JAIL_TILE_ID,
            consecutiveDoubles: 0,
            logs: [
              createLog(
                `${player.name}: ${story.jail.entry} ${pickFlavor(
                  story.flavor.jail,
                  ''
                )}`,
                'danger'
              ),
              ...session.logs,
            ].slice(0, 40),
          },
          false
        );
      }

      if (tile.type === 'TAX') {
        const tax = tile.taxAmount ?? 100;
        const afterTax = applyBalanceDelta(
          session,
          pIdx,
          -tax,
          `membayar ${tile.name} sebesar ${tax} Kredit. ${pickFlavor(
            story.flavor.payment,
            ''
          )}`,
          'warning'
        );
        return {
          ...afterTax,
          phase: 'TILE_ACTION',
          activeTileId: tile.id,
        };
      }

      if (tile.type === 'CHALLENGE') {
        const { challenge, nextUsedIndices } = buildChallengeForTrigger({
          session,
          trigger: 'SPECIAL_TILE',
          tile,
          rewardCredits: 150,
          lore,
        });
        return {
          ...session,
          phase: 'CHALLENGE',
          activeTileId: tile.id,
          usedPhraseIndices: nextUsedIndices,
          activeChallenge: challenge,
          logs: [
            createLog(
              `${player.name} memicu Petak Tantangan Sandi #${tile.id}.`,
              'accent'
            ),
            ...session.logs,
          ].slice(0, 40),
        };
      }

      if (tile.type === 'CARD') {
        const isArchiveTile = tile.name.toUpperCase().includes('ARSIP');
        const filteredPool = currentCards.filter((c) =>
          isArchiveTile ? c.deck === 'ARCHIVE' : c.deck === 'SIGNAL'
        );
        const pool = filteredPool.length > 0 ? filteredPool : currentCards;
        const card = pool[Math.floor(Math.random() * pool.length)];

        return {
          ...session,
          phase: 'TILE_ACTION',
          activeTileId: tile.id,
          pendingCard: card,
          logs: [
            createLog(
              `${player.name} menerima ${card.title}.`,
              'accent'
            ),
            ...session.logs,
          ].slice(0, 40),
        };
      }

      // PROPERTY / STATION / UTILITY
      const owner = findTileOwner(session.players, tile.id);
      if (owner && owner.id !== player.id) {
        const rent = calculateTileRent(tile, owner, tiles);
        const ownerIdx = session.players.findIndex((p) => p.id === owner.id);
        const paid = Math.min(player.balance, rent);

        const afterPay = applyBalanceDelta(
          session,
          pIdx,
          -rent,
          `membayar sewa ${tile.name} sebesar ${paid} Kredit ke ${owner.name}. ${pickFlavor(
            story.flavor.payment,
            ''
          )}`,
          'warning'
        );
        const playersWithRent = afterPay.players.map((p, idx) =>
          idx === ownerIdx ? { ...p, balance: p.balance + paid } : p
        );
        return {
          ...afterPay,
          players: playersWithRent,
          phase: 'TILE_ACTION',
          activeTileId: tile.id,
        };
      }

      return {
        ...session,
        phase: 'TILE_ACTION',
        activeTileId: tile.id,
      };
    },
    [advanceTurnOrEnd, currentCards, lore, story]
  );

  const animatePawnMovement = useCallback(
    (startPos: number, stepsRemaining: number, passedStartYet: boolean) => {
      if (stepsRemaining <= 0) {
        setIsMoving(false);
        setActiveSession((prev) => {
          if (!prev) return prev;
          const p = prev.players[prev.activePlayerIndex];
          return resolveLandingTile(prev, p.position);
        });
        return;
      }

      moveTimerRef.current = window.setTimeout(() => {
        const nextPos = (startPos + 1) % 40;
        const justPassedStart = nextPos === 0 && !passedStartYet;
        soundFx.step();
        setSelectedTileId(nextPos);

        setActiveSession((prev) => {
          if (!prev) return prev;
          const pIdx = prev.activePlayerIndex;
          const players = prev.players.map((p, idx) =>
            idx === pIdx
              ? {
                  ...p,
                  position: nextPos,
                  balance: justPassedStart
                    ? p.balance + PASS_START_BONUS
                    : p.balance,
                }
              : p
          );
          return {
            ...prev,
            players,
            activeTileId: nextPos,
            logs: justPassedStart
              ? [
                  createLog(
                    `${players[pIdx].name} melewati Gerbang Kota (+${PASS_START_BONUS} Kredit). ${pickFlavor(
                      story.flavor.goSalary,
                      ''
                    )}`,
                    'success'
                  ),
                  ...prev.logs,
                ].slice(0, 40)
              : prev.logs,
          };
        });

        animatePawnMovement(
          nextPos,
          stepsRemaining - 1,
          passedStartYet || justPassedStart
        );
      }, 105);
    },
    [resolveLandingTile, story.flavor.goSalary]
  );

  const handleRollDice = () => {
    if (!activeSession || isMoving || activeSession.soloTimer?.isPaused) return;
    if (activeSession.phase !== 'READY_ROLL') return;

    const roll = rollDicePair();
    soundFx.dice();
    const pIdx = activeSession.activePlayerIndex;
    const player = activeSession.players[pIdx];

    if (player.inJail) {
      if (roll.isDouble) {
        const freed: GameSession = {
          ...activeSession,
          phase: 'MOVING',
          lastDice: roll,
          consecutiveDoubles: 0,
          players: activeSession.players.map((p, idx) =>
            idx === pIdx ? { ...p, inJail: false, jailTurns: 0 } : p
          ),
          logs: [
            createLog(
              `${player.name} melempar dadu ganda (${roll.d1}+${roll.d2}) dan dibebaskan dari ${story.jail.title}!`,
              'success'
            ),
            ...activeSession.logs,
          ].slice(0, 40),
        };
        setActiveSession(freed);
        setIsMoving(true);
        animatePawnMovement(player.position, roll.total, false);
        return;
      }

      const nextJailTurns = player.jailTurns + 1;
      if (nextJailTurns >= 3) {
        const afterBail = applyBalanceDelta(
          {
            ...activeSession,
            lastDice: roll,
            players: activeSession.players.map((p, idx) =>
              idx === pIdx ? { ...p, inJail: false, jailTurns: 0 } : p
            ),
          },
          pIdx,
          -JAIL_BAIL_AMOUNT,
          `membayar denda wajib bebas detensi ${JAIL_BAIL_AMOUNT} Kredit.`,
          'warning'
        );
        if (afterBail.players[pIdx].isBankrupt) {
          setActiveSession(advanceTurnOrEnd(afterBail, false));
          return;
        }
        setActiveSession({ ...afterBail, phase: 'MOVING' });
        setIsMoving(true);
        animatePawnMovement(player.position, roll.total, false);
        return;
      }

      const stayed: GameSession = {
        ...activeSession,
        lastDice: roll,
        players: activeSession.players.map((p, idx) =>
          idx === pIdx ? { ...p, jailTurns: nextJailTurns } : p
        ),
        logs: [
          createLog(
            `${player.name} (${roll.d1}+${roll.d2}): ${story.jail.detained} (${nextJailTurns}/3)`,
            'neutral'
          ),
          ...activeSession.logs,
        ].slice(0, 40),
      };
      setActiveSession(advanceTurnOrEnd(stayed, false));
      return;
    }

    const nextDoubles = roll.isDouble ? activeSession.consecutiveDoubles + 1 : 0;
    if (nextDoubles >= 3) {
      soundFx.error();
      const jailed: GameSession = {
        ...activeSession,
        lastDice: roll,
        consecutiveDoubles: 0,
        activeTileId: JAIL_TILE_ID,
        players: activeSession.players.map((p, idx) =>
          idx === pIdx
            ? { ...p, position: JAIL_TILE_ID, inJail: true, jailTurns: 0 }
            : p
        ),
        logs: [
          createLog(
            `${player.name} melempar dadu ganda 3x berturut-turut. ${story.jail.entry}`,
            'danger'
          ),
          ...activeSession.logs,
        ].slice(0, 40),
      };
      setSelectedTileId(JAIL_TILE_ID);
      setActiveSession(advanceTurnOrEnd(jailed, false));
      return;
    }

    setActiveSession({
      ...activeSession,
      phase: 'MOVING',
      lastDice: roll,
      consecutiveDoubles: nextDoubles,
      logs: [
        createLog(
          `${player.name} melempar dadu ${roll.d1} + ${roll.d2} = ${roll.total}.`,
          'neutral'
        ),
        ...activeSession.logs,
      ].slice(0, 40),
    });
    setIsMoving(true);
    animatePawnMovement(player.position, roll.total, false);
  };

  const handleBuyPropertyTrigger = () => {
    if (!activeSession || activeSession.soloTimer?.isPaused) return;
    const player = activeSession.players[activeSession.activePlayerIndex];
    const tile = currentTiles[player.position];
    const { challenge, nextUsedIndices } = buildChallengeForTrigger({
      session: activeSession,
      trigger: 'BUY_PROPERTY',
      tile,
      rewardCredits: 0,
      lore,
    });

    setActiveSession({
      ...activeSession,
      phase: 'CHALLENGE',
      usedPhraseIndices: nextUsedIndices,
      activeChallenge: challenge,
    });
  };

  const handleUpgradeTile = (tileId: number) => {
    if (!activeSession || activeSession.soloTimer?.isPaused) return;
    const pIdx = activeSession.activePlayerIndex;
    const player = activeSession.players[pIdx];
    const tile = currentTiles[tileId];
    const cost = Math.round((tile.price ?? 100) * 0.6);
    if (player.balance < cost) return;

    soundFx.success();
    const updatedPlayers = activeSession.players.map((p, idx) =>
      idx === pIdx
        ? {
            ...p,
            balance: p.balance - cost,
            tileLevels: {
              ...p.tileLevels,
              [tileId]: (p.tileLevels[tileId] ?? 0) + 1,
            },
          }
        : p
    );

    setActiveSession(
      advanceTurnOrEnd({
        ...activeSession,
        players: updatedPlayers,
        logs: [
          createLog(
            `${player.name} membangun ${tile.name} ke Level ${
              (player.tileLevels[tileId] ?? 0) + 1
            } (-${cost} Kredit). ${pickFlavor(story.flavor.build, '')}`,
            'success'
          ),
          ...activeSession.logs,
        ].slice(0, 40),
      })
    );
  };

  const handleResolvePendingCard = () => {
    if (
      !activeSession ||
      !activeSession.pendingCard ||
      activeSession.soloTimer?.isPaused
    )
      return;
    const card = activeSession.pendingCard;
    const pIdx = activeSession.activePlayerIndex;
    const player = activeSession.players[pIdx];

    if (card.effectType === 'PAIRED_CHALLENGE') {
      const { challenge, nextUsedIndices } = buildChallengeForTrigger({
        session: activeSession,
        trigger: 'SPECIAL_CARD',
        rewardCredits: card.amount ?? 150,
        lore,
      });
      setActiveSession({
        ...activeSession,
        phase: 'CHALLENGE',
        pendingCard: null,
        usedPhraseIndices: nextUsedIndices,
        activeChallenge: challenge,
      });
      return;
    }

    if (card.effectType === 'CREDIT_DELTA') {
      const delta = card.amount ?? 0;
      if (delta >= 0) soundFx.success();
      else soundFx.error();
      const updated = applyBalanceDelta(
        { ...activeSession, pendingCard: null },
        pIdx,
        delta,
        delta >= 0
          ? `menerima ${delta} Kredit dari ${card.title}.`
          : `membayar ${Math.abs(delta)} Kredit (${card.title}).`,
        delta >= 0 ? 'success' : 'warning'
      );
      setActiveSession(advanceTurnOrEnd(updated));
      return;
    }

    if (card.effectType === 'MOVE_TO') {
      soundFx.success();
      const target = card.targetTileId ?? 0;
      const updatedPlayers = activeSession.players.map((p, idx) =>
        idx === pIdx
          ? {
              ...p,
              position: target,
              balance: p.balance + PASS_START_BONUS,
            }
          : p
      );
      setSelectedTileId(target);
      setActiveSession(
        advanceTurnOrEnd({
          ...activeSession,
          pendingCard: null,
          activeTileId: target,
          players: updatedPlayers,
          logs: [
            createLog(
              `${player.name} menuju Gerbang Kota (+${PASS_START_BONUS} Kredit). ${pickFlavor(
                story.flavor.goSalary,
                ''
              )}`,
              'success'
            ),
            ...activeSession.logs,
          ].slice(0, 40),
        })
      );
      return;
    }

    if (card.effectType === 'GO_TO_JAIL') {
      soundFx.error();
      setSelectedTileId(JAIL_TILE_ID);
      setActiveSession(
        advanceTurnOrEnd(
          {
            ...activeSession,
            pendingCard: null,
            activeTileId: JAIL_TILE_ID,
            consecutiveDoubles: 0,
            players: activeSession.players.map((p, idx) =>
              idx === pIdx
                ? { ...p, position: JAIL_TILE_ID, inJail: true, jailTurns: 0 }
                : p
            ),
            logs: [
              createLog(`${player.name}: ${story.jail.entry}`, 'danger'),
              ...activeSession.logs,
            ].slice(0, 40),
          },
          false
        )
      );
    }
  };

  const handleJailChallenge = () => {
    if (!activeSession || activeSession.soloTimer?.isPaused) return;
    const { challenge, nextUsedIndices } = buildChallengeForTrigger({
      session: activeSession,
      trigger: 'JAIL_ESCAPE',
      rewardCredits: 0,
      lore,
    });
    setActiveSession({
      ...activeSession,
      phase: 'CHALLENGE',
      usedPhraseIndices: nextUsedIndices,
      activeChallenge: challenge,
    });
  };

  const handleJailPayBail = () => {
    if (!activeSession || activeSession.soloTimer?.isPaused) return;
    const pIdx = activeSession.activePlayerIndex;
    const player = activeSession.players[pIdx];
    if (player.balance < JAIL_BAIL_AMOUNT) return;
    soundFx.success();
    setActiveSession({
      ...activeSession,
      players: activeSession.players.map((p, idx) =>
        idx === pIdx
          ? {
              ...p,
              balance: p.balance - JAIL_BAIL_AMOUNT,
              inJail: false,
              jailTurns: 0,
            }
          : p
      ),
      logs: [
        createLog(
          `${player.name} membayar denda ${JAIL_BAIL_AMOUNT} Kredit dan dibebaskan dari ${story.jail.title}. Silakan lempar dadu.`,
          'success'
        ),
        ...activeSession.logs,
      ].slice(0, 40),
    });
  };

  const handleUseHint = () => {
    setActiveSession((prev) => {
      if (!prev || !prev.activeChallenge) return prev;
      const pIdx = prev.activePlayerIndex;
      const chg = prev.activeChallenge;
      if (chg.hintsRevealed >= 3) return prev;
      return {
        ...prev,
        activeChallenge: {
          ...chg,
          hintsRevealed: Math.min(3, chg.hintsRevealed + 1),
        },
        players: prev.players.map((p, idx) =>
          idx === pIdx ? { ...p, hintsUsed: p.hintsUsed + 1 } : p
        ),
      };
    });
  };

  const handleAttemptRecorded = () => {
    setActiveSession((prev) => {
      if (!prev || !prev.activeChallenge) return prev;
      return {
        ...prev,
        activeChallenge: {
          ...prev.activeChallenge,
          attempts: prev.activeChallenge.attempts + 1,
        },
      };
    });
  };

  const handleCompleteChallenge = () => {
    if (!activeSession || !activeSession.activeChallenge) return;
    const chg = activeSession.activeChallenge;
    const pIdx = activeSession.activePlayerIndex;
    const player = activeSession.players[pIdx];
    const isEncryptStep = chg.currentStep === 'ENCRYPT';
    const nextMixed = getNextMixedStateOnSolve(activeSession);
    soundFx.success();

    if (chg.trigger === 'BUY_PROPERTY' && chg.targetTileId !== undefined) {
      const tile = currentTiles[chg.targetTileId];
      const price = tile.price ?? 0;
      const updatedPlayers = activeSession.players.map((p, idx) =>
        idx === pIdx
          ? {
              ...p,
              balance: p.balance - price,
              ownedTileIds: [...p.ownedTileIds, tile.id],
              tileLevels: { ...p.tileLevels, [tile.id]: 0 },
              encryptCorrect: p.encryptCorrect + (isEncryptStep ? 1 : 0),
              decryptCorrect: p.decryptCorrect + (isEncryptStep ? 0 : 1),
              challengesCompleted: p.challengesCompleted + 1,
            }
          : p
      );
      setActiveSession(
        advanceTurnOrEnd({
          ...activeSession,
          players: updatedPlayers,
          activeChallenge: null,
          mixedNextStep: nextMixed.mixedNextStep,
          pendingMixedCipher: nextMixed.pendingMixedCipher,
          logs: [
            createLog(
              `${player.name} membeli ${tile.name} (-${price} Kredit). ${pickFlavor(
                story.flavor.purchase,
                ''
              )}`,
              'success'
            ),
            ...activeSession.logs,
          ].slice(0, 40),
        })
      );
      return;
    }

    if (chg.trigger === 'JAIL_ESCAPE') {
      const updatedPlayers = activeSession.players.map((p, idx) =>
        idx === pIdx
          ? {
              ...p,
              inJail: false,
              jailTurns: 0,
              encryptCorrect: p.encryptCorrect + (isEncryptStep ? 1 : 0),
              decryptCorrect: p.decryptCorrect + (isEncryptStep ? 0 : 1),
              challengesCompleted: p.challengesCompleted + 1,
            }
          : p
      );
      setActiveSession({
        ...activeSession,
        phase: 'READY_ROLL',
        players: updatedPlayers,
        activeChallenge: null,
        mixedNextStep: nextMixed.mixedNextStep,
        pendingMixedCipher: nextMixed.pendingMixedCipher,
        logs: [
          createLog(
            `${player.name} lolos sandi dan bebas dari ${story.jail.title}! Silakan lempar dadu.`,
            'success'
          ),
          ...activeSession.logs,
        ].slice(0, 40),
      });
      return;
    }

    // SPECIAL_TILE or SPECIAL_CARD reward
    const reward = chg.rewardCredits;
    const stepActionLabel = isEncryptStep
      ? 'enkripsi (g ∘ f)(x)'
      : 'dekripsi invers (g ∘ f)⁻¹(y)';
    const updatedPlayers = activeSession.players.map((p, idx) =>
      idx === pIdx
        ? {
            ...p,
            balance: p.balance + reward,
            encryptCorrect: p.encryptCorrect + (isEncryptStep ? 1 : 0),
            decryptCorrect: p.decryptCorrect + (isEncryptStep ? 0 : 1),
            challengesCompleted: p.challengesCompleted + 1,
          }
        : p
    );
    setActiveSession(
      advanceTurnOrEnd({
        ...activeSession,
        players: updatedPlayers,
        activeChallenge: null,
        mixedNextStep: nextMixed.mixedNextStep,
        pendingMixedCipher: nextMixed.pendingMixedCipher,
        logs: [
          createLog(
            `${player.name} menuntaskan tantangan ${stepActionLabel} (+${reward} Kredit).`,
            'success'
          ),
          ...activeSession.logs,
        ].slice(0, 40),
      })
    );
  };

  const handleForfeitChallenge = () => {
    if (!activeSession || !activeSession.activeChallenge) return;
    const chg = activeSession.activeChallenge;
    const pIdx = activeSession.activePlayerIndex;
    const player = activeSession.players[pIdx];
    soundFx.error();

    const resetMixedOnForfeit =
      activeSession.challengeType === 'mixed' && chg.currentStep === 'DECRYPT';
    const nextMixedStep = resetMixedOnForfeit
      ? 'ENCRYPT'
      : activeSession.mixedNextStep;
    const nextPendingMixed = resetMixedOnForfeit
      ? null
      : activeSession.pendingMixedCipher;

    const updatedPlayers = activeSession.players.map((p, idx) =>
      idx === pIdx ? { ...p, challengesFailed: p.challengesFailed + 1 } : p
    );

    if (chg.trigger === 'JAIL_ESCAPE') {
      setActiveSession({
        ...activeSession,
        phase: 'READY_ROLL',
        players: updatedPlayers,
        activeChallenge: null,
        mixedNextStep: nextMixedStep,
        pendingMixedCipher: nextPendingMixed,
        logs: [
          createLog(
            `${player.name} melewati tantangan bebas detensi.`,
            'warning'
          ),
          ...activeSession.logs,
        ].slice(0, 40),
      });
      return;
    }

    setActiveSession(
      advanceTurnOrEnd({
        ...activeSession,
        players: updatedPlayers,
        activeChallenge: null,
        mixedNextStep: nextMixedStep,
        pendingMixedCipher: nextPendingMixed,
        logs: [
          createLog(
            `${player.name} melewati tantangan tanpa hadiah/pembelian.`,
            'warning'
          ),
          ...activeSession.logs,
        ].slice(0, 40),
      })
    );
  };

  const handleSkipTileAction = () => {
    if (!activeSession || activeSession.soloTimer?.isPaused) return;
    setActiveSession(advanceTurnOrEnd(activeSession));
  };

  const handleFinishEarly = () => {
    if (!activeSession) return;
    const ended = finalizeGameOver(
      activeSession,
      activeSession.mode === 'solo'
        ? 'Sesi Demo Solo diakhiri oleh investor.'
        : story.winner.neutral,
      null
    );
    setActiveSession(ended);
  };

  const activePlayer = activeSession?.players[activeSession.activePlayerIndex];

  return (
    <div className="min-h-screen blueprint-grid flex flex-col">
      {/* Three-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#0B1120]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={() => {
              setShowStats(false);
              setActiveSession(null);
            }}
            className="text-lg font-bold tracking-tight text-white hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
          >
            Monopoly Encrypt
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              type="button"
              onClick={() => {
                setShowStats(false);
                setActiveSession(null);
              }}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {story.menu.story}
            </button>
            <button
              type="button"
              onClick={() => setShowStats(true)}
              className={`transition-colors whitespace-nowrap shrink-0 ${
                showStats ? 'text-cyan-300' : 'hover:text-white'
              }`}
            >
              Statistik
            </button>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {story.menu.encryptionGuide}
            </button>
            <button
              type="button"
              onClick={() => setLoreModalOpen(true)}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Petak & Frasa
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            {showStats ? (
              <button
                type="button"
                onClick={() => setShowStats(false)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                {activeSession ? 'Kembali ke Papan' : story.winner.backToMenu}
              </button>
            ) : activeSession ? (
              <button
                type="button"
                onClick={() => setActiveSession(null)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                {story.winner.backToMenu}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowStats(false);
                  handleStartGame('solo', selectedChallengeType, ['Investor Solo']);
                }}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0"
              >
                Mulai Demo Solo
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {showStats && (
          <StatsDashboardView
            matchHistory={matchHistory}
            activeOrSavedSession={activeSession ?? savedSession}
            tiles={currentTiles}
            onBack={() => setShowStats(false)}
            onResumeSession={() => {
              setShowStats(false);
              if (!activeSession) {
                handleResumeSavedSession();
              }
            }}
            onStartDemoSolo={() => {
              setShowStats(false);
              handleStartGame('solo', selectedChallengeType, ['Investor Solo']);
            }}
            onClearHistory={() => {
              clearMatchHistory();
              setMatchHistory([]);
            }}
          />
        )}

        {!showStats && !activeSession && (
          <HomeSetupView
            story={story}
            lore={lore}
            previewKeys={previewKeys}
            savedSession={savedSession}
            matchHistory={matchHistory}
            selectedChallengeType={selectedChallengeType}
            onChangeChallengeType={setSelectedChallengeType}
            onStartGame={handleStartGame}
            onResumeSavedSession={handleResumeSavedSession}
            onDiscardSavedSession={handleDiscardSavedSession}
            onOpenGuide={() => setGuideOpen(true)}
            onOpenStats={() => setShowStats(true)}
            onOpenLoreImport={() => setLoreModalOpen(true)}
            onRerollPreviewKeys={() =>
              setPreviewKeys(generateSessionMathKeys())
            }
          />
        )}

        {!showStats && activeSession && activeSession.phase === 'GAME_OVER' && (
          <GameSummaryView
            session={activeSession}
            tiles={currentTiles}
            story={story}
            onPlayAgain={() =>
              handleStartGame(
                activeSession.mode,
                activeSession.challengeType,
                activeSession.players.map((p) => p.name)
              )
            }
            onReturnHome={() => setActiveSession(null)}
          />
        )}

        {!showStats &&
          activeSession &&
          activeSession.phase !== 'GAME_OVER' &&
          activePlayer && (
            <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
              {/* Game Intro Banner from story_3ebc4ce9.json */}
              {showGameIntro && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/40 bg-[#111C2E] px-4 py-3 text-xs">
                  <div className="space-y-0.5 max-w-3xl">
                    <div className="font-semibold text-cyan-300">
                      {story.gameIntro.title}
                    </div>
                    <p className="text-slate-300">{story.gameIntro.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGameIntro(false)}
                    className="rounded-md bg-cyan-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-cyan-400 whitespace-nowrap"
                  >
                    {story.gameIntro.dismiss}
                  </button>
                </div>
              )}

              {activeSession.soloTimer?.isPaused && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-2.5 text-xs text-amber-200">
                  <span>
                    Permainan dijeda. Timer Demo Solo berhenti sementara dan sisa
                    waktu aman tersimpan.
                  </span>
                  <button
                    type="button"
                    onClick={handleTogglePauseSolo}
                    className="rounded-md bg-amber-400 px-3 py-1 font-semibold text-slate-950 hover:bg-amber-300 whitespace-nowrap"
                  >
                    Lanjutkan Permainan
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-7 xl:col-span-8">
                  <Board40
                    tiles={currentTiles}
                    players={activeSession.players}
                    activePlayer={activePlayer}
                    activeTileId={activeSession.activeTileId}
                    selectedTileId={selectedTileId}
                    onSelectTile={setSelectedTileId}
                    phase={activeSession.phase}
                    lastDice={activeSession.lastDice}
                    pendingCard={activeSession.pendingCard}
                    mathKeys={activeSession.mathKeys}
                    challengeType={activeSession.challengeType}
                    isMoving={isMoving}
                    isPaused={Boolean(activeSession.soloTimer?.isPaused)}
                    onRollDice={handleRollDice}
                    onBuyPropertyTrigger={handleBuyPropertyTrigger}
                    onUpgradeTile={handleUpgradeTile}
                    onSkipTileAction={handleSkipTileAction}
                    onResolvePendingCard={handleResolvePendingCard}
                    onJailChallenge={handleJailChallenge}
                    onJailPayBail={handleJailPayBail}
                  />
                </div>

                <div className="lg:col-span-5 xl:col-span-4">
                  <SideCommandPanel
                    session={activeSession}
                    tiles={currentTiles}
                    soundEnabled={soundEnabled}
                    onToggleSound={handleToggleSound}
                    onTogglePauseSolo={handleTogglePauseSolo}
                    onOpenGuide={() => setGuideOpen(true)}
                    onOpenStats={() => setShowStats(true)}
                    onFinishEarly={handleFinishEarly}
                  />
                </div>
              </div>
            </div>
          )}
      </main>

      {/* Math Challenge Modal */}
      {activeSession &&
        activeSession.phase === 'CHALLENGE' &&
        activeSession.activeChallenge && (
          <ChallengeModal
            challenge={activeSession.activeChallenge}
            mathKeys={activeSession.mathKeys}
            isPaused={Boolean(activeSession.soloTimer?.isPaused)}
            onUseHint={handleUseHint}
            onAttemptRecorded={handleAttemptRecorded}
            onCompleteChallenge={handleCompleteChallenge}
            onForfeit={handleForfeitChallenge}
          />
        )}

      {/* Encryption Guide Modal */}
      <EncryptionGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        mathKeys={currentFormulaKeys}
        challengeType={activeSession?.challengeType ?? selectedChallengeType}
      />

      {/* Lore Import Modal */}
      <LoreImportModal
        isOpen={loreModalOpen}
        onClose={() => setLoreModalOpen(false)}
        currentLore={lore}
        onSaveLore={(newLore) => {
          saveCustomLore(newLore);
          setLore(newLore);
        }}
        onResetLore={() => {
          resetCustomLore();
          setLore(loadLoreConfig());
        }}
      />
    </div>
  );
}
