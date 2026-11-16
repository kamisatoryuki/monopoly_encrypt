import React, { useState } from 'react';
import {
  Play,
  Users,
  Timer,
  BookOpen,
  FileText,
  Plus,
  Minus,
  RotateCcw,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { PLAYER_PALETTE } from '../engine/gameEngine';
import {
  CryptoniaLoreConfig,
  GameMode,
  GameSession,
  MatchSummaryRecord,
  SessionMathKeys,
} from '../types/game';
import { CryptoniaStory } from '../types/story';
import { FormulaBox } from './FormulaBox';
import { PlayerTokenIcon } from './PlayerTokenIcon';
import { PrologueSlides } from './PrologueSlides';

interface HomeSetupViewProps {
  story: CryptoniaStory;
  lore: CryptoniaLoreConfig;
  previewKeys: SessionMathKeys;
  savedSession: GameSession | null;
  matchHistory: MatchSummaryRecord[];
  onStartGame: (mode: GameMode, playerNames: string[]) => void;
  onResumeSavedSession: () => void;
  onDiscardSavedSession: () => void;
  onOpenGuide: () => void;
  onOpenStats: () => void;
  onOpenLoreImport: () => void;
  onRerollPreviewKeys: () => void;
}

export const HomeSetupView: React.FC<HomeSetupViewProps> = ({
  story,
  previewKeys,
  savedSession,
  matchHistory,
  onStartGame,
  onResumeSavedSession,
  onDiscardSavedSession,
  onOpenGuide,
  onOpenStats,
  onOpenLoreImport,
  onRerollPreviewKeys,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [playerNames, setPlayerNames] = useState<string[]>([
    'Investor 1',
    'Investor 2',
    'Investor 3',
    'Investor 4',
    'Investor 5',
    'Investor 6',
    'Investor 7',
    'Investor 8',
  ]);
  const [soloName, setSoloName] = useState<string>('Investor Solo');
  const [setupError, setSetupError] = useState<string | null>(null);

  const handleAdjustPlayers = (delta: number) => {
    setSetupError(null);
    setPlayerCount((prev) => Math.max(2, Math.min(8, prev + delta)));
  };

  const handleNameChange = (idx: number, val: string) => {
    setSetupError(null);
    setPlayerNames((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    if (selectedMode === 'solo') {
      const trimmed = soloName.trim();
      if (!trimmed) {
        setSetupError(story.setup.invalidNames);
        return;
      }
      onStartGame('solo', [trimmed]);
      return;
    }

    const activeNames = playerNames.slice(0, playerCount).map((n) => n.trim());
    if (activeNames.some((n) => n.length === 0)) {
      setSetupError(story.setup.invalidNames);
      return;
    }
    const uniqueNames = new Set(activeNames.map((n) => n.toLowerCase()));
    if (uniqueNames.size !== activeNames.length) {
      setSetupError(story.setup.duplicateNames);
      return;
    }

    onStartGame('classic', activeNames);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Resume Saved Session Callout if present */}
      {savedSession && savedSession.phase !== 'GAME_OVER' && (
        <div className="rounded-xl border border-cyan-500/40 bg-[#111C2E] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-cyan-300">
              {story.menu.continueGame} ·{' '}
              {savedSession.mode === 'solo' ? 'Demo Solo' : 'Classic Mode'}
            </div>
            <div className="text-sm font-semibold text-white">
              {savedSession.mode === 'solo' && savedSession.soloTimer
                ? `Sisa waktu ${Math.floor(
                    savedSession.soloTimer.remainingSeconds / 60
                  )
                    .toString()
                    .padStart(2, '0')}:${(
                    savedSession.soloTimer.remainingSeconds % 60
                  )
                    .toString()
                    .padStart(2, '0')} · Giliran ke-${savedSession.turnCount}`
                : `${savedSession.players.length} Investor · Giliran ke-${savedSession.turnCount}`}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onDiscardSavedSession}
              className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 whitespace-nowrap"
            >
              Hapus Sesi
            </button>
            <button
              type="button"
              onClick={onResumeSavedSession}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5" />
              {story.menu.continueGame}
            </button>
          </div>
        </div>
      )}

      {/* Main Split: Cryptonia 2099 Prologue & Formula (Left) + Mode Setup (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Narrative & Math Engine Overview */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-6 sm:p-7 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>
                {story.menu.eyebrow} · {story.city} {story.year}
              </span>
              <button
                type="button"
                onClick={onOpenLoreImport}
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 font-medium whitespace-nowrap"
              >
                <FileText className="h-3.5 w-3.5" />
                Sunting Petak & Frasa
              </button>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
                Monopoly Encrypt: {story.title}
              </h1>
              <p className="text-sm text-slate-300">{story.tagline}</p>
            </div>

            {/* Authentic 3-Slide Interactive Prologue from story_3ebc4ce9.json */}
            <PrologueSlides story={story} />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-300">
                Pratinjau Kunci Sandi Sesi (Diacak tiap permainan baru)
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onRerollPreviewKeys}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Acak Kunci
                </button>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200 whitespace-nowrap"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {story.menu.encryptionGuide}
                </button>
                <button
                  type="button"
                  onClick={onOpenStats}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-cyan-300 whitespace-nowrap"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Statistik
                </button>
              </div>
            </div>
            <FormulaBox keys={previewKeys} variant="session-overview" />
            <FormulaBox keys={previewKeys} variant="codec-rules" />
          </div>
        </div>

        {/* Right Column: Mode Setup Form */}
        <form
          onSubmit={handleStart}
          className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-6 sm:p-7 space-y-6"
        >
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {story.setup.heading}
              </h2>
              <p className="mt-1 text-xs text-slate-400">{story.setup.intro}</p>
            </div>

            {/* Mode Segmented Toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#0B1120] p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedMode('classic');
                  setSetupError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedMode === 'classic'
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                Classic Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMode('solo');
                  setSetupError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedMode === 'solo'
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Timer className="h-4 w-4" />
                Demo Solo (05:00)
              </button>
            </div>

            {selectedMode === 'classic' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0B1120] px-4 py-3">
                  <div>
                    <div className="text-xs font-medium text-white">
                      {story.setup.playerCount}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      2–8 investor lokal dengan token unik
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustPlayers(-1)}
                      disabled={playerCount <= 2}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                      aria-label="Kurangi investor"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono text-sm font-bold text-white tabular-nums">
                      {playerCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustPlayers(1)}
                      disabled={playerCount >= 8}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                      aria-label="Tambah investor"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {Array.from({ length: playerCount }).map((_, idx) => {
                    const preset = PLAYER_PALETTE[idx];
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0B1120] px-3 py-2"
                      >
                        <PlayerTokenIcon
                          shape={preset.shape}
                          color={preset.color}
                          size={16}
                        />
                        <input
                          type="text"
                          value={playerNames[idx]}
                          maxLength={18}
                          onChange={(e) =>
                            handleNameChange(idx, e.target.value)
                          }
                          placeholder={`${story.setup.nameLabel} ${idx + 1}`}
                          aria-label={`${story.setup.nameLabel} ${idx + 1}`}
                          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 space-y-2 text-xs text-slate-300">
                  <div className="font-semibold text-white">
                    Demo Solo — Pasar Cryptonia (05:00)
                  </div>
                  <ul className="space-y-1 text-slate-400 list-disc pl-4">
                    <li>1 investor tanpa lawan di papan 40 petak.</li>
                    <li>
                      Memuat 7 petak tantangan sandi khusus ditambah tantangan
                      beli wilayah, Sinyal Kesempatan, Arsip Kota, dan Pusat
                      Detensi.
                    </li>
                    <li>
                      Timer 05:00 berhenti saat dijeda (pause) dan berakhir
                      otomatis pada 00:00.
                    </li>
                  </ul>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    {story.setup.nameLabel}
                  </label>
                  <div className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-[#0B1120] px-3.5 py-2.5">
                    <PlayerTokenIcon
                      shape={PLAYER_PALETTE[0].shape}
                      color={PLAYER_PALETTE[0].color}
                      size={18}
                    />
                    <input
                      type="text"
                      value={soloName}
                      maxLength={20}
                      onChange={(e) => {
                        setSetupError(null);
                        setSoloName(e.target.value);
                      }}
                      placeholder="Investor Solo"
                      className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {setupError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{setupError}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap"
            >
              <Play className="h-4 w-4" />
              {selectedMode === 'solo'
                ? 'Mulai Demo Solo (05:00)'
                : `${story.setup.startGame} (${playerCount} Investor)`}
            </button>
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              {story.menu.footer}
            </p>
          </div>
        </form>
      </div>

      {/* Match History Section if any */}
      {matchHistory.length > 0 && (
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">
              Arsip Riwayat Permainan
            </h2>
            <button
              type="button"
              onClick={onOpenStats}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-slate-800 whitespace-nowrap"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Buka Dashboard Stats
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Mode</th>
                  <th className="py-2 pr-4 font-medium">Investor Utama</th>
                  <th className="py-2 pr-4 font-medium">Kekayaan</th>
                  <th className="py-2 pr-4 font-medium">Wilayah</th>
                  <th className="py-2 pr-4 font-medium">Soal Lulus</th>
                  <th className="py-2 font-medium">Hint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                {matchHistory.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-4 font-sans text-slate-300">
                      {item.mode === 'solo' ? 'Demo Solo' : 'Classic Mode'}
                    </td>
                    <td className="py-2.5 pr-4 font-sans font-medium text-white">
                      {item.winnerName}
                    </td>
                    <td className="py-2.5 pr-4 text-cyan-300">
                      {item.netWorth} Kr
                    </td>
                    <td className="py-2.5 pr-4 text-slate-300">
                      {item.propertiesOwned}
                    </td>
                    <td className="py-2.5 pr-4 text-emerald-300">
                      {item.challengesCompleted}
                    </td>
                    <td className="py-2.5 text-amber-300">{item.hintsUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
