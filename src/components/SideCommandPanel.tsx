import React from 'react';
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  BookOpen,
  Flag,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  calculatePlayerNetWorth,
  formatChallengeTypeLabel,
} from '../engine/gameEngine';
import { BoardTile, GameSession } from '../types/game';
import { FormulaBox } from './FormulaBox';
import { PlayerTokenIcon } from './PlayerTokenIcon';

interface SideCommandPanelProps {
  session: GameSession;
  tiles: BoardTile[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTogglePauseSolo: () => void;
  onOpenGuide: () => void;
  onOpenStats: () => void;
  onFinishEarly: () => void;
}

export const SideCommandPanel: React.FC<SideCommandPanelProps> = ({
  session,
  tiles,
  soundEnabled,
  onToggleSound,
  onTogglePauseSolo,
  onOpenGuide,
  onOpenStats,
  onFinishEarly,
}) => {
  const soloTimer = session.soloTimer;
  const formatClock = (totalSec: number) => {
    const safe = Math.max(0, totalSec);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <aside className="space-y-4">
      {/* Demo Solo Prominent Countdown Card */}
      {session.mode === 'solo' && soloTimer && (
        <div
          className={`rounded-xl border p-4 space-y-3 ${
            soloTimer.isPaused
              ? 'border-amber-500/50 bg-amber-950/20'
              : soloTimer.remainingSeconds <= 60
              ? 'border-rose-500/50 bg-rose-950/20'
              : 'border-cyan-500/40 bg-[#111827]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Timer Demo Solo</span>
            </div>
            <span
              className={`text-xs font-medium ${
                soloTimer.isPaused ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {soloTimer.isPaused ? 'Dijeda (Paused)' : 'Berjalan'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
              {formatClock(soloTimer.remainingSeconds)}
            </div>
            <button
              type="button"
              onClick={onTogglePauseSolo}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                soloTimer.isPaused
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'border border-amber-500/40 bg-amber-950/40 text-amber-200 hover:bg-amber-950/60'
              }`}
            >
              {soloTimer.isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Lanjutkan
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Jeda Timer
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Utility Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenGuide}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
        >
          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
          Panduan
        </button>
        <button
          type="button"
          onClick={onOpenStats}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
        >
          <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
          Statistik
        </button>
        <button
          type="button"
          onClick={onToggleSound}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
          aria-label={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
        >
          {soundEnabled ? (
            <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
          ) : (
            <VolumeX className="h-3.5 w-3.5 text-slate-500" />
          )}
          {soundEnabled ? 'Suara Aktif' : 'Bisukan'}
        </button>
        <button
          type="button"
          onClick={onFinishEarly}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-xs font-medium text-slate-300 hover:border-rose-500/50 hover:text-rose-200 whitespace-nowrap"
        >
          <Flag className="h-3.5 w-3.5" />
          Akhiri Sesi
        </button>
      </div>

      {/* Players List */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-white">Daftar Pemain</span>
          <span className="font-mono tabular-nums">
            {formatChallengeTypeLabel(session.challengeType)} · Giliran ke-
            {session.turnCount}
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
          {session.players.map((p, idx) => {
            const isActive = idx === session.activePlayerIndex;
            const netWorth = calculatePlayerNetWorth(p, tiles);
            return (
              <div
                key={p.id}
                className={`rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                  p.isBankrupt
                    ? 'border-slate-800/60 bg-slate-900/40 opacity-50'
                    : isActive
                    ? 'border-cyan-500/60 bg-[#0F1B2E]'
                    : 'border-slate-800 bg-[#0B1120]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <PlayerTokenIcon
                      shape={p.shape}
                      color={p.color}
                      size={15}
                    />
                    <span className="font-semibold text-white truncate">
                      {p.name}
                    </span>
                    {p.inJail && (
                      <span className="text-[11px] text-amber-300 shrink-0">
                        · Penjara
                      </span>
                    )}
                    {p.isBankrupt && (
                      <span className="text-[11px] text-rose-400 shrink-0">
                        · Bangkrut
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-cyan-300 tabular-nums shrink-0">
                    {p.balance} Kr
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                  <span>
                    Petak #{String(p.position).padStart(2, '0')} ·{' '}
                    {p.ownedTileIds.length} Properti
                  </span>
                  <span>
                    Kekayaan: {netWorth} Kr · Soal: {p.challengesCompleted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FormulaBox visible on mobile & desktop */}
      <FormulaBox
        keys={session.mathKeys}
        variant="session-overview"
        challengeType={session.challengeType}
        title="Fungsi Kunci Sesi"
      />

      {/* Activity Log */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2.5">
        <div className="text-xs font-semibold text-white">Catatan Aktivitas</div>
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-xs">
          {session.logs.slice(0, 12).map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-2 border-b border-slate-800/60 pb-1.5 last:border-none last:pb-0"
            >
              <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5 tabular-nums">
                {entry.timestamp}
              </span>
              <span
                className={
                  entry.tone === 'success'
                    ? 'text-emerald-300'
                    : entry.tone === 'warning'
                    ? 'text-amber-300'
                    : entry.tone === 'danger'
                    ? 'text-rose-300'
                    : entry.tone === 'accent'
                    ? 'text-cyan-300'
                    : 'text-slate-300'
                }
              >
                {entry.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
