import React from 'react';
import {
  Sparkles,
  Lock,
  Landmark,
  ShieldAlert,
  Play,
  ArrowUpRight,
  Cpu,
} from 'lucide-react';
import { DISTRICT_COLOR_STYLES } from '../data/cryptoniaLore';
import { findTileOwner } from '../engine/gameEngine';
import {
  BoardTile,
  CryptoniaCard,
  DiceRoll,
  GamePhase,
  PlayerState,
  SessionMathKeys,
} from '../types/game';
import { FormulaBox } from './FormulaBox';
import { PlayerTokenIcon } from './PlayerTokenIcon';

interface Board40Props {
  tiles: BoardTile[];
  players: PlayerState[];
  activePlayer: PlayerState;
  activeTileId: number;
  selectedTileId: number;
  onSelectTile: (tileId: number) => void;
  phase: GamePhase;
  lastDice: DiceRoll | null;
  pendingCard: CryptoniaCard | null;
  mathKeys: SessionMathKeys;
  isMoving: boolean;
  isPaused: boolean;
  onRollDice: () => void;
  onBuyPropertyTrigger: () => void;
  onUpgradeTile: (tileId: number) => void;
  onSkipTileAction: () => void;
  onResolvePendingCard: () => void;
  onJailChallenge: () => void;
  onJailPayBail: () => void;
}

function getGridPosition(tileId: number): { row: number; col: number } {
  if (tileId >= 0 && tileId <= 10) {
    return { row: 11, col: 11 - tileId };
  }
  if (tileId >= 11 && tileId <= 19) {
    return { row: 11 - (tileId - 10), col: 1 };
  }
  if (tileId >= 20 && tileId <= 30) {
    return { row: 1, col: 1 + (tileId - 20) };
  }
  return { row: 1 + (tileId - 30), col: 11 };
}

function shortTileLabel(tile: BoardTile): string {
  if (tile.type === 'START') return 'START';
  if (tile.type === 'JAIL') return 'PENJARA';
  if (tile.type === 'FREE_PARKING') return 'PARKIR';
  if (tile.type === 'GO_TO_JAIL') return 'MASUK SEL';
  if (tile.type === 'CHALLENGE') return `TANT #${tile.id}`;
  if (tile.type === 'CARD') return `KARTU`;
  if (tile.type === 'TAX') return `PAJAK`;
  if (tile.type === 'STATION') return `STASIUN`;
  if (tile.type === 'UTILITY') return `UTILITAS`;
  return `#${String(tile.id).padStart(2, '0')}`;
}

export const Board40: React.FC<Board40Props> = ({
  tiles,
  players,
  activePlayer,
  activeTileId,
  selectedTileId,
  onSelectTile,
  phase,
  lastDice,
  pendingCard,
  mathKeys,
  isMoving,
  isPaused,
  onRollDice,
  onBuyPropertyTrigger,
  onUpgradeTile,
  onSkipTileAction,
  onResolvePendingCard,
  onJailChallenge,
  onJailPayBail,
}) => {
  const inspectedTile = tiles[selectedTileId] ?? tiles[activeTileId];
  const inspectedOwner = findTileOwner(players, inspectedTile.id);
  const currentTile = tiles[activePlayer.position];
  const currentOwner = findTileOwner(players, currentTile.id);

  const canBuyCurrent =
    phase === 'TILE_ACTION' &&
    !pendingCard &&
    (currentTile.type === 'PROPERTY' ||
      currentTile.type === 'STATION' ||
      currentTile.type === 'UTILITY') &&
    !currentOwner &&
    activePlayer.balance >= (currentTile.price ?? 0);

  const canUpgradeCurrent =
    phase === 'TILE_ACTION' &&
    !pendingCard &&
    currentTile.type === 'PROPERTY' &&
    currentOwner?.id === activePlayer.id &&
    (activePlayer.tileLevels[currentTile.id] ?? 0) < 3 &&
    activePlayer.balance >= Math.round((currentTile.price ?? 100) * 0.6);

  return (
    <div className="w-full">
      <div className="relative mx-auto aspect-square w-full max-w-[700px] rounded-xl border border-slate-700/90 bg-[#0D1424] p-1 sm:p-2 shadow-xl">
        <div className="grid h-full w-full grid-cols-11 grid-rows-11 gap-0.5 sm:gap-1">
          {tiles.map((tile) => {
            const { row, col } = getGridPosition(tile.id);
            const owner = findTileOwner(players, tile.id);
            const occupants = players.filter(
              (p) => !p.isBankrupt && p.position === tile.id
            );
            const isActivePos = activeTileId === tile.id;
            const isSelected = selectedTileId === tile.id;
            const districtStyle = tile.district
              ? DISTRICT_COLOR_STYLES[tile.district]
              : null;
            const level = owner ? owner.tileLevels[tile.id] ?? 0 : 0;

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => onSelectTile(tile.id)}
                style={{ gridRow: row, gridColumn: col }}
                title={`${tile.name}${tile.price ? ` · ${tile.price} Kredit` : ''}`}
                className={`relative flex flex-col justify-between overflow-hidden rounded-[4px] border p-0.5 sm:p-1 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                  tile.type === 'CHALLENGE'
                    ? 'border-cyan-500/50 bg-cyan-950/35 hover:bg-cyan-950/55'
                    : isSelected
                    ? 'border-cyan-400 bg-slate-800/90'
                    : isActivePos
                    ? 'border-amber-400/70 bg-slate-800/75'
                    : 'border-slate-800 bg-[#131C2E] hover:border-slate-600'
                }`}
              >
                {/* District or Challenge Top Strip */}
                {districtStyle && tile.type !== 'CHALLENGE' ? (
                  <div className={`h-1 sm:h-1.5 w-full rounded-[2px] ${districtStyle.bar}`} />
                ) : tile.type === 'CHALLENGE' ? (
                  <div className="h-1 sm:h-1.5 w-full rounded-[2px] bg-cyan-400" />
                ) : (
                  <div className="h-1 sm:h-1.5 w-full rounded-[2px] bg-slate-700/60" />
                )}

                {/* Label */}
                <div className="flex-1 flex flex-col items-center justify-center text-center leading-none px-0.5">
                  <span className="font-mono text-[7px] sm:text-[9px] font-semibold text-slate-200 truncate w-full">
                    {shortTileLabel(tile)}
                  </span>
                  {tile.price && (
                    <span className="hidden sm:block font-mono text-[8px] text-slate-400 tabular-nums mt-0.5">
                      {tile.price}
                    </span>
                  )}
                  {tile.taxAmount && (
                    <span className="hidden sm:block font-mono text-[8px] text-rose-300 tabular-nums mt-0.5">
                      -{tile.taxAmount}
                    </span>
                  )}
                </div>

                {/* Owner & Level Bar */}
                {owner && (
                  <div
                    className="h-1 w-full rounded-full"
                    style={{ backgroundColor: owner.color }}
                    title={`Dimiliki ${owner.name}${level > 0 ? ` (Lv.${level})` : ''}`}
                  />
                )}

                {/* Occupant Tokens */}
                {occupants.length > 0 && (
                  <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 bg-slate-950/35 p-0.5 pointer-events-none">
                    {occupants.map((occ) => (
                      <PlayerTokenIcon
                        key={occ.id}
                        shape={occ.shape}
                        color={occ.color}
                        size={14}
                        className="drop-shadow"
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}

          {/* Center 9x9 Tactical Hub (Visible smoothly on >= sm, compact on mobile) */}
          <div className="col-start-2 col-end-11 row-start-2 row-end-11 rounded-lg border border-slate-800/90 bg-[#0A101D]/95 p-2 sm:p-4 flex flex-col justify-between overflow-hidden">
            {/* Top Status Row */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-medium text-cyan-300 truncate">
                  Cryptonia 2099 · Giliran Aktif
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <PlayerTokenIcon
                    shape={activePlayer.shape}
                    color={activePlayer.color}
                    size={15}
                  />
                  <span className="text-xs sm:text-sm font-semibold text-white truncate">
                    {activePlayer.name}
                  </span>
                </div>
              </div>

              {/* Dice Visual */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-900 font-mono text-xs sm:text-sm font-bold text-white tabular-nums">
                  {lastDice ? lastDice.d1 : '—'}
                </div>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-900 font-mono text-xs sm:text-sm font-bold text-white tabular-nums">
                  {lastDice ? lastDice.d2 : '—'}
                </div>
              </div>
            </div>

            {/* Middle Area: Tile Inspector or Pending Card */}
            <div className="my-auto py-1 sm:py-2 space-y-2 overflow-y-auto">
              {pendingCard ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-2.5 sm:p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{pendingCard.title}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed">
                    {pendingCard.description}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-[#111827]/90 p-2.5 sm:p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      {inspectedTile.name}
                    </span>
                    <span className="font-mono text-[10px] sm:text-xs text-slate-400 shrink-0">
                      Petak {String(inspectedTile.id).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="hidden sm:block text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {inspectedTile.loreText}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 font-mono text-[10px] sm:text-xs tabular-nums">
                    {inspectedTile.price && (
                      <span className="text-cyan-300">
                        Harga: {inspectedTile.price} Kr
                      </span>
                    )}
                    {inspectedTile.baseRent && (
                      <span className="text-slate-300">
                        Sewa Dasar: {inspectedTile.baseRent} Kr
                      </span>
                    )}
                    {inspectedOwner && (
                      <span className="text-emerald-300">
                        Pemilik: {inspectedOwner.name} (Lv.
                        {inspectedOwner.tileLevels[inspectedTile.id] ?? 0})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Compact FormulaBox inside Board Center on >= sm */}
              <div className="hidden sm:block">
                <FormulaBox keys={mathKeys} variant="compact" />
              </div>
            </div>

            {/* Bottom Action Controls inside Board Center */}
            <div className="border-t border-slate-800 pt-2 flex flex-wrap items-center justify-between gap-1.5">
              {phase === 'READY_ROLL' && !activePlayer.inJail && (
                <button
                  type="button"
                  disabled={isMoving || isPaused}
                  onClick={onRollDice}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5" />
                  {isMoving ? 'Bergerak...' : 'Lempar Dadu'}
                </button>
              )}

              {phase === 'READY_ROLL' && activePlayer.inJail && (
                <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={isPaused}
                    onClick={onJailChallenge}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-cyan-500 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Lock className="h-3 w-3" />
                    Tantangan Bebas
                  </button>
                  <button
                    type="button"
                    disabled={isPaused || activePlayer.balance < 50}
                    onClick={onJailPayBail}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-500/40 bg-amber-950/30 px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-amber-200 hover:bg-amber-950/50 disabled:opacity-40 whitespace-nowrap"
                  >
                    <ShieldAlert className="h-3 w-3" />
                    Bayar 50 Kr
                  </button>
                  <button
                    type="button"
                    disabled={isPaused || isMoving}
                    onClick={onRollDice}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Cpu className="h-3 w-3" />
                    Coba Dadu Ganda
                  </button>
                </div>
              )}

              {phase === 'TILE_ACTION' && pendingCard && (
                <button
                  type="button"
                  disabled={isPaused}
                  onClick={onResolvePendingCard}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50 whitespace-nowrap"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Proses Kartu
                </button>
              )}

              {phase === 'TILE_ACTION' && !pendingCard && (
                <div className="w-full flex flex-wrap items-center gap-1.5">
                  {canBuyCurrent && (
                    <button
                      type="button"
                      disabled={isPaused}
                      onClick={onBuyPropertyTrigger}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 whitespace-nowrap"
                    >
                      <Landmark className="h-3.5 w-3.5" />
                      Beli ({currentTile.price} Kr)
                    </button>
                  )}
                  {canUpgradeCurrent && (
                    <button
                      type="button"
                      disabled={isPaused}
                      onClick={() => onUpgradeTile(currentTile.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 whitespace-nowrap"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Upgrade ({Math.round((currentTile.price ?? 100) * 0.6)} Kr)
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isPaused}
                    onClick={onSkipTileAction}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap"
                  >
                    Akhiri Giliran
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
