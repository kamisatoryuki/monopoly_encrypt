import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Search,
  Trash2,
  ArrowLeft,
  Play,
  CheckCircle2,
  Lock,
  Unlock,
  Clock,
} from 'lucide-react';
import { calculatePlayerNetWorth } from '../engine/gameEngine';
import { BoardTile, GameMode, GameSession, MatchSummaryRecord } from '../types/game';
import { FormulaBox } from './FormulaBox';
import { PlayerTokenIcon } from './PlayerTokenIcon';

interface StatsDashboardViewProps {
  matchHistory: MatchSummaryRecord[];
  activeOrSavedSession: GameSession | null;
  tiles: BoardTile[];
  onBack: () => void;
  onResumeSession: () => void;
  onStartDemoSolo: () => void;
  onClearHistory: () => void;
}

type ModeFilter = 'all' | GameMode;

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const StatsDashboardView: React.FC<StatsDashboardViewProps> = ({
  matchHistory,
  activeOrSavedSession,
  tiles,
  onBack,
  onResumeSession,
  onStartDemoSolo,
  onClearHistory,
}) => {
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return matchHistory.filter((item) => {
      if (modeFilter !== 'all' && item.mode !== modeFilter) return false;
      if (q && !item.winnerName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [matchHistory, modeFilter, searchQuery]);

  const aggregates = useMemo(() => {
    const totalSessions = filtered.length;
    const classicCount = filtered.filter((r) => r.mode === 'classic').length;
    const soloCount = filtered.filter((r) => r.mode === 'solo').length;
    const totalCompleted = filtered.reduce(
      (sum, r) => sum + r.challengesCompleted,
      0
    );
    const totalFailed = filtered.reduce(
      (sum, r) => sum + (r.challengesFailed ?? 0),
      0
    );
    const totalEncrypt = filtered.reduce(
      (sum, r) => sum + (r.encryptCorrect ?? r.challengesCompleted),
      0
    );
    const totalDecrypt = filtered.reduce(
      (sum, r) => sum + (r.decryptCorrect ?? r.challengesCompleted),
      0
    );
    const totalHints = filtered.reduce((sum, r) => sum + r.hintsUsed, 0);
    const totalDuration = filtered.reduce(
      (sum, r) => sum + r.durationSeconds,
      0
    );
    const totalNetWorth = filtered.reduce((sum, r) => sum + r.netWorth, 0);
    const totalProperties = filtered.reduce(
      (sum, r) => sum + r.propertiesOwned,
      0
    );

    const totalAttempts = totalCompleted + totalFailed;
    const successRate =
      totalAttempts > 0
        ? Math.round((totalCompleted / totalAttempts) * 100)
        : 0;
    const avgNetWorth =
      totalSessions > 0 ? Math.round(totalNetWorth / totalSessions) : 0;
    const avgHints =
      totalSessions > 0 ? (totalHints / totalSessions).toFixed(1) : '0.0';
    const avgDuration =
      totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    return {
      totalSessions,
      classicCount,
      soloCount,
      totalCompleted,
      totalFailed,
      totalEncrypt,
      totalDecrypt,
      totalHints,
      totalProperties,
      totalAttempts,
      successRate,
      avgNetWorth,
      avgHints,
      avgDuration,
    };
  }, [filtered]);

  const recentForChart = useMemo(
    () => [...filtered].slice(0, 8).reverse(),
    [filtered]
  );

  const chartMaxVal = useMemo(() => {
    const maxItem = recentForChart.reduce(
      (max, r) => Math.max(max, r.challengesCompleted, r.hintsUsed),
      1
    );
    return Math.max(4, maxItem);
  }, [recentForChart]);

  const liveSessionAvailable =
    activeOrSavedSession && activeOrSavedSession.phase !== 'GAME_OVER';

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium">
            <BarChart3 className="h-4 w-4" />
            <span>Cryptonia 2099 · Dashboard Statistik Permainan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Dashboard Stats
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Rekap performa kriptografi (g ∘ f)(x), ketepatan invers, penggunaan
            petunjuk, dan aset investor lintas sesi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#111827] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali
          </button>
          {matchHistory.length > 0 && !confirmClear && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#111827] px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-rose-500/50 hover:text-rose-200 whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus Riwayat
            </button>
          )}
          {confirmClear && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-xs">
              <span className="text-rose-200">Hapus semua riwayat?</span>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                  setConfirmClear(false);
                }}
                className="font-semibold text-rose-300 hover:text-white whitespace-nowrap"
              >
                Ya, Hapus
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="text-slate-400 hover:text-slate-200 whitespace-nowrap"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Active Session Snapshot (if a game is currently running/paused) */}
      {liveSessionAvailable && (
        <section className="rounded-xl border border-cyan-500/40 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-cyan-300">
                Sesi Aktif Saat Ini ·{' '}
                {activeOrSavedSession.mode === 'solo'
                  ? 'Demo Solo'
                  : 'Classic Mode'}
              </div>
              <div className="mt-0.5 text-sm font-semibold text-white">
                Giliran ke-{activeOrSavedSession.turnCount}
                {activeOrSavedSession.mode === 'solo' &&
                activeOrSavedSession.soloTimer
                  ? ` · Sisa waktu ${formatDuration(
                      activeOrSavedSession.soloTimer.remainingSeconds
                    )}${
                      activeOrSavedSession.soloTimer.isPaused ? ' (Dijeda)' : ''
                    }`
                  : ` · ${activeOrSavedSession.players.length} Investor`}
              </div>
            </div>
            <button
              type="button"
              onClick={onResumeSession}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5" />
              Lanjutkan Sesi
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-7 overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-[#0B1120] text-slate-400">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Investor</th>
                    <th className="px-3 py-2.5 font-medium text-right">Saldo</th>
                    <th className="px-3 py-2.5 font-medium text-right">Kekayaan</th>
                    <th className="px-3 py-2.5 font-medium text-right">Enkripsi/Dekripsi</th>
                    <th className="px-3 py-2.5 font-medium text-right">Hint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                  {activeOrSavedSession.players.map((p) => (
                    <tr key={p.id} className="bg-[#0D1526]/60">
                      <td className="px-3 py-2 font-sans">
                        <div className="flex items-center gap-2">
                          <PlayerTokenIcon
                            shape={p.shape}
                            color={p.color}
                            size={14}
                          />
                          <span className="font-medium text-white">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-300">
                        {p.balance} Kr
                      </td>
                      <td className="px-3 py-2 text-right text-cyan-300 font-semibold">
                        {calculatePlayerNetWorth(p, tiles)} Kr
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-300">
                        {p.encryptCorrect} / {p.decryptCorrect}
                      </td>
                      <td className="px-3 py-2 text-right text-amber-300">
                        {p.hintsUsed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lg:col-span-5">
              <FormulaBox
                keys={activeOrSavedSession.mathKeys}
                variant="compact"
                title="Kunci Sandi Sesi Aktif"
              />
            </div>
          </div>
        </section>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-[#111827] p-1">
          {(
            [
              { id: 'all', label: 'Semua Sesi' },
              { id: 'classic', label: 'Classic Mode' },
              { id: 'solo', label: 'Demo Solo' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setModeFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                modeFilter === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama investor..."
            aria-label="Cari nama investor"
            className="w-full rounded-lg border border-slate-800 bg-[#111827] py-2 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Empty State */}
      {matchHistory.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-10 text-center space-y-4">
          <BarChart3 className="mx-auto h-8 w-8 text-slate-500" />
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base font-semibold text-white">
              Belum Ada Sesi yang Diselesaikan
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Statistik kriptografi, tingkat keberhasilan enkripsi-dekripsi, dan
              riwayat kekayaan investor akan muncul otomatis setelah Anda
              menyelesaikan satu sesi Classic Mode atau Demo Solo.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={onStartDemoSolo}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5" />
              Mulai Demo Solo (05:00)
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
            >
              Buka Pengaturan Classic Mode
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 4-Column KPI Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-1">
              <div className="text-xs text-slate-400">Total Sesi Selesai</div>
              <div className="font-mono text-2xl font-bold text-white tabular-nums">
                {aggregates.totalSessions}
              </div>
              <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                {aggregates.classicCount} Classic · {aggregates.soloCount} Solo
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-1">
              <div className="text-xs text-slate-400">
                Keberhasilan Tantangan
              </div>
              <div className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">
                {aggregates.successRate}%
              </div>
              <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                {aggregates.totalCompleted} lulus · {aggregates.totalFailed}{' '}
                dilewati
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-1">
              <div className="text-xs text-slate-400">
                Enkripsi & Dekripsi Benar
              </div>
              <div className="font-mono text-2xl font-bold text-cyan-300 tabular-nums">
                {aggregates.totalEncrypt + aggregates.totalDecrypt}
              </div>
              <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                {aggregates.totalEncrypt} (g ∘ f) · {aggregates.totalDecrypt}{' '}
                (g ∘ f)⁻¹
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-1">
              <div className="text-xs text-slate-400">
                Rata-Rata Kekayaan / Sesi
              </div>
              <div className="font-mono text-2xl font-bold text-white tabular-nums">
                {aggregates.avgNetWorth} Kr
              </div>
              <div className="font-mono text-[11px] text-amber-300 tabular-nums">
                {aggregates.avgHints} hint/sesi ·{' '}
                {formatDuration(aggregates.avgDuration)}
              </div>
            </div>
          </div>

          {/* Analytics Row: Recent Session Bar Chart + Crypto Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bar Chart */}
            <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Perbandingan Soal Lulus & Hint per Sesi
                  </h2>
                  <p className="text-xs text-slate-400">
                    Menampilkan maksimal 8 sesi terakhir sesuai filter
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />
                    Soal Lulus
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                    Hint
                  </span>
                </div>
              </div>

              {recentForChart.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Tidak ada sesi yang cocok dengan filter pencarian.
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-2 items-end h-44 pt-4 border-b border-slate-800 pb-2">
                  {recentForChart.map((item, idx) => {
                    const solvedPct = Math.round(
                      (item.challengesCompleted / chartMaxVal) * 100
                    );
                    const hintPct = Math.round(
                      (item.hintsUsed / chartMaxVal) * 100
                    );
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col items-center justify-end h-full gap-1.5"
                      >
                        <div className="flex items-end justify-center gap-1 w-full h-32">
                          <div
                            style={{
                              height: `${Math.max(
                                item.challengesCompleted > 0 ? 10 : 2,
                                solvedPct
                              )}%`,
                            }}
                            title={`${item.winnerName}: ${item.challengesCompleted} soal lulus`}
                            className="w-3 sm:w-4 rounded-t bg-cyan-400 transition-all"
                          />
                          <div
                            style={{
                              height: `${Math.max(
                                item.hintsUsed > 0 ? 10 : 2,
                                hintPct
                              )}%`,
                            }}
                            title={`${item.winnerName}: ${item.hintsUsed} hint`}
                            className="w-3 sm:w-4 rounded-t bg-amber-400 transition-all"
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 tabular-nums truncate max-w-full">
                          S{idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Proportional Math Breakdown */}
            <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Rincian Kemampuan Kriptografi
                </h2>
                <p className="text-xs text-slate-400">
                  Akumulasi penyelesaian pasangan fungsi komposisi & invers
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-slate-200">
                      <Lock className="h-3.5 w-3.5 text-cyan-400" />
                      Enkripsi Komposisi (g ∘ f)(x)
                    </span>
                    <span className="font-mono font-semibold text-cyan-300 tabular-nums">
                      {aggregates.totalEncrypt} benar
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400"
                      style={{
                        width: `${
                          aggregates.totalEncrypt + aggregates.totalFailed > 0
                            ? Math.round(
                                (aggregates.totalEncrypt /
                                  (aggregates.totalEncrypt +
                                    aggregates.totalFailed)) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-slate-200">
                      <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                      Dekripsi Invers (g ∘ f)⁻¹(y)
                    </span>
                    <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                      {aggregates.totalDecrypt} benar
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400"
                      style={{
                        width: `${
                          aggregates.totalDecrypt + aggregates.totalFailed > 0
                            ? Math.round(
                                (aggregates.totalDecrypt /
                                  (aggregates.totalDecrypt +
                                    aggregates.totalFailed)) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 font-mono tabular-nums">
                  <div>
                    <div className="font-sans text-[11px] text-slate-400">
                      Total Wilayah Dikuasai
                    </div>
                    <div className="mt-0.5 text-base font-bold text-white">
                      {aggregates.totalProperties}
                    </div>
                  </div>
                  <div>
                    <div className="font-sans text-[11px] text-slate-400">
                      Rata-Rata Durasi
                    </div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-base font-bold text-white">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {formatDuration(aggregates.avgDuration)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* High-Density Session History Data Grid */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
            <div className="border-b border-slate-800 px-5 py-3.5 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">
                Log Sesi Tersimpan ({filtered.length})
              </h2>
            </div>

            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada data sesi yang sesuai dengan pencarian &ldquo;
                {searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-[#0B1120] text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Waktu</th>
                      <th className="px-4 py-3 font-medium">Mode</th>
                      <th className="px-4 py-3 font-medium">Investor Utama</th>
                      <th className="px-4 py-3 font-medium">Kunci Sesi</th>
                      <th className="px-4 py-3 font-medium text-right">Durasi</th>
                      <th className="px-4 py-3 font-medium text-right">Kekayaan</th>
                      <th className="px-4 py-3 font-medium text-right">Wilayah</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Enkripsi / Dekripsi
                      </th>
                      <th className="px-4 py-3 font-medium text-right">Hint</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filtered.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                          {formatDateTime(item.finishedAt)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-200 whitespace-nowrap">
                          {item.mode === 'solo' ? 'Demo Solo' : 'Classic Mode'}
                          {item.playerCount && item.mode === 'classic'
                            ? ` (${item.playerCount}p)`
                            : ''}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-white whitespace-nowrap">
                          {item.winnerName}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-300 tabular-nums whitespace-nowrap">
                          {item.mathKeys
                            ? `f=${item.mathKeys.a}x+${item.mathKeys.b}, g=${item.mathKeys.c}x+${item.mathKeys.d}`
                            : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-300 tabular-nums">
                          {formatDuration(item.durationSeconds)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-cyan-300 tabular-nums">
                          {item.netWorth} Kr
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-200 tabular-nums">
                          {item.propertiesOwned}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-300 tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {item.encryptCorrect ?? item.challengesCompleted} /{' '}
                            {item.decryptCorrect ?? item.challengesCompleted}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-amber-300 tabular-nums">
                          {item.hintsUsed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
