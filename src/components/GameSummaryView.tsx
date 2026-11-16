import React from 'react';
import { Trophy, RotateCcw, Home, CheckCircle2 } from 'lucide-react';
import {
  calculatePlayerNetWorth,
  formatChallengeTypeLabel,
} from '../engine/gameEngine';
import { BoardTile, GameSession } from '../types/game';
import { CryptoniaStory } from '../types/story';
import { FormulaBox } from './FormulaBox';
import { PlayerTokenIcon } from './PlayerTokenIcon';

interface GameSummaryViewProps {
  session: GameSession;
  tiles: BoardTile[];
  story: CryptoniaStory;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const GameSummaryView: React.FC<GameSummaryViewProps> = ({
  session,
  tiles,
  story,
  onPlayAgain,
  onReturnHome,
}) => {
  const rankedPlayers = [...session.players].sort(
    (a, b) =>
      calculatePlayerNetWorth(b, tiles) - calculatePlayerNetWorth(a, tiles)
  );
  const topPlayer = rankedPlayers[0];

  const elapsedSeconds =
    session.mode === 'solo' && session.soloTimer
      ? session.soloTimer.totalSeconds - session.soloTimer.remainingSeconds
      : Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="rounded-xl border border-slate-700 bg-[#111827] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-cyan-300">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>
                {session.mode === 'solo'
                  ? 'Hasil Demo Solo (5 Menit)'
                  : story.winner.title}{' '}
                · {formatChallengeTypeLabel(session.challengeType)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {session.mode === 'solo'
                ? 'Sesi Demonstrasi Selesai'
                : `${topPlayer?.name} — ${story.winner.title}`}
            </h1>
            <p className="text-sm text-slate-300">
              {session.mode === 'solo'
                ? session.endedReason
                : session.winnerId
                ? story.winner.text
                : story.winner.neutral}
            </p>
            {session.mode === 'classic' && session.endedReason && (
              <p className="text-xs text-slate-400">{session.endedReason}</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0B1120] px-4 py-3 text-right font-mono tabular-nums">
            <div className="text-[11px] text-slate-400">Durasi Sesi</div>
            <div className="text-xl font-bold text-white">
              {formatDuration(elapsedSeconds)}
            </div>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
          <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-4">
            <div className="font-sans text-xs text-slate-400">
              Kekayaan Tertinggi
            </div>
            <div className="mt-1 text-lg font-bold text-cyan-300">
              {topPlayer ? calculatePlayerNetWorth(topPlayer, tiles) : 0} Kr
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-4">
            <div className="font-sans text-xs text-slate-400">
              Wilayah Dimiliki
            </div>
            <div className="mt-1 text-lg font-bold text-white">
              {session.players.reduce((s, p) => s + p.ownedTileIds.length, 0)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-4">
            <div className="font-sans text-xs text-slate-400">
              Pasangan Soal Lulus
            </div>
            <div className="mt-1 text-lg font-bold text-emerald-300">
              {session.players.reduce((s, p) => s + p.challengesCompleted, 0)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-4">
            <div className="font-sans text-xs text-slate-400">
              Hint Digunakan
            </div>
            <div className="mt-1 text-lg font-bold text-amber-300">
              {session.players.reduce((s, p) => s + p.hintsUsed, 0)}
            </div>
          </div>
        </div>

        {/* Player Breakdown */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">
            Statistik Investor & Matematika
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 bg-[#0B1120] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Investor</th>
                  <th className="px-4 py-3 font-medium">Saldo</th>
                  <th className="px-4 py-3 font-medium">Wilayah</th>
                  <th className="px-4 py-3 font-medium">Kekayaan</th>
                  <th className="px-4 py-3 font-medium">Enkripsi / Dekripsi</th>
                  <th className="px-4 py-3 font-medium">Hint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono tabular-nums">
                {rankedPlayers.map((p, idx) => (
                  <tr key={p.id} className="bg-[#0D1526]/60">
                    <td className="px-4 py-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">
                          #{idx + 1}
                        </span>
                        <PlayerTokenIcon
                          shape={p.shape}
                          color={p.color}
                          size={16}
                        />
                        <span className="font-medium text-white">{p.name}</span>
                        {p.isBankrupt && (
                          <span className="text-xs text-rose-400">
                            · {story.bankruptcy.title}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{p.balance} Kr</td>
                    <td className="px-4 py-3 text-slate-200">
                      {p.ownedTileIds.length}
                    </td>
                    <td className="px-4 py-3 font-semibold text-cyan-300">
                      {calculatePlayerNetWorth(p, tiles)} Kr
                    </td>
                    <td className="px-4 py-3 text-emerald-300">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {p.encryptCorrect} / {p.decryptCorrect}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-amber-300">{p.hintsUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Session Formula Reference */}
        <FormulaBox
          keys={session.mathKeys}
          variant="session-overview"
          challengeType={session.challengeType}
          title="Kunci Fungsi Linear yang Digunakan pada Sesi Ini"
        />

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onReturnHome}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
          >
            <Home className="h-4 w-4" />
            {story.winner.backToMenu}
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4" />
            {story.winner.playAgain}
          </button>
        </div>
      </div>
    </div>
  );
};
