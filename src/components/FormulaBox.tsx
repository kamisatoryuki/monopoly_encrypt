import React from 'react';
import { ChallengeType, SessionMathKeys } from '../types/game';

export type FormulaVariant =
  | 'session-overview'
  | 'composition'
  | 'inverse'
  | 'codec-rules'
  | 'compact';

interface FormulaBoxProps {
  keys: SessionMathKeys;
  variant?: FormulaVariant;
  challengeType?: ChallengeType;
  title?: string;
  className?: string;
}

function Fraction({
  numerator,
  denominator,
}: {
  numerator: React.ReactNode;
  denominator: React.ReactNode;
}) {
  return (
    <span className="inline-flex flex-col items-center align-middle mx-1 leading-none">
      <span className="px-1.5 pb-1 border-b border-slate-400/70 text-[0.9em]">
        {numerator}
      </span>
      <span className="px-1.5 pt-1 text-[0.9em]">{denominator}</span>
    </span>
  );
}

export const FormulaBox: React.FC<FormulaBoxProps> = ({
  keys,
  variant = 'session-overview',
  challengeType = 'mixed',
  title,
  className = '',
}) => {
  const { a, b, c, d } = keys;
  const composedCoef = c * a;
  const composedConst = c * b + d;

  const showEncryptFormula = challengeType !== 'decryption';
  const showDecryptFormula = challengeType !== 'encryption';

  const modeBadgeLabel =
    challengeType === 'encryption'
      ? 'Encryption Only · (g ∘ f)(x)'
      : challengeType === 'decryption'
      ? 'Decryption Only · (g ∘ f)⁻¹(y)'
      : 'Mixed · Komposisi & Invers';

  return (
    <div
      className={`rounded-lg border border-slate-700/80 bg-[#0D1526] p-3.5 text-slate-100 ${className}`}
    >
      {title && (
        <div className="mb-2.5 flex items-center justify-between gap-2 text-xs font-medium text-cyan-300">
          <span>{title}</span>
          <span className="font-mono text-[11px] text-slate-400">
            {modeBadgeLabel}
          </span>
        </div>
      )}

      {variant === 'compact' && (
        <div className="grid grid-cols-1 gap-1.5 font-mono text-xs tabular-nums">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">f(x)</span>
            <span className="text-slate-100 font-medium">
              {a}x + {b}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">g(x)</span>
            <span className="text-slate-100 font-medium">
              {c}x + {d}
            </span>
          </div>
          {showEncryptFormula && (
            <div className="mt-1 border-t border-slate-800 pt-1.5 flex items-center justify-between gap-2">
              <span className="text-cyan-300">(g ∘ f)(x)</span>
              <span className="text-cyan-200 font-semibold">
                {c}({a}x + {b}) + {d}
              </span>
            </div>
          )}
          {showDecryptFormula && (
            <div
              className={`${
                !showEncryptFormula ? 'mt-1 border-t border-slate-800 pt-1.5' : ''
              } flex items-center justify-between gap-2`}
            >
              <span className="text-amber-300">(g ∘ f)⁻¹(y)</span>
              <span className="text-amber-200 font-semibold">
                f⁻¹(g⁻¹(y))
              </span>
            </div>
          )}
        </div>
      )}

      {variant === 'session-overview' && (
        <div className="space-y-2.5 font-mono text-xs sm:text-sm tabular-nums">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-md bg-slate-900/80 border border-slate-800 px-3 py-2">
              <span className="text-slate-400">f(x) = </span>
              <span className="text-slate-100 font-semibold">
                {a}x + {b}
              </span>
            </div>
            <div className="rounded-md bg-slate-900/80 border border-slate-800 px-3 py-2">
              <span className="text-slate-400">g(x) = </span>
              <span className="text-slate-100 font-semibold">
                {c}x + {d}
              </span>
            </div>
          </div>

          <div className="rounded-md bg-slate-900/80 border border-cyan-500/30 px-3 py-2.5 space-y-1.5">
            {showEncryptFormula && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-cyan-300 font-semibold">Enkripsi:</span>
                <span>
                  (g ∘ f)(x) = g(f(x)) = {c}({a}x + {b}) + {d} ={' '}
                  <strong className="text-cyan-200">
                    {composedCoef}x + {composedConst}
                  </strong>
                </span>
              </div>
            )}
            {showDecryptFormula && (
              <div
                className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${
                  showEncryptFormula ? 'pt-1 border-t border-slate-800/80' : ''
                }`}
              >
                <span className="text-amber-300 font-semibold">Dekripsi:</span>
                <span className="inline-flex flex-wrap items-center gap-1">
                  <span>(g ∘ f)⁻¹(y) = f⁻¹(g⁻¹(y)) =</span>
                  <Fraction
                    numerator={
                      <span>
                        (<Fraction numerator={`y - ${d}`} denominator={c} />) -{' '}
                        {b}
                      </span>
                    }
                    denominator={a}
                  />
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {variant === 'composition' && (
        <div className="space-y-2 font-mono text-xs sm:text-sm tabular-nums">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300">
            <span>
              f(x) = <strong className="text-white">{a}x + {b}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              g(x) = <strong className="text-white">{c}x + {d}</strong>
            </span>
          </div>
          <div className="rounded-md bg-slate-900/90 border border-cyan-500/30 px-3 py-2.5 text-cyan-200">
            (g ∘ f)(x) = g(f(x)) = {c}({a}x + {b}) + {d} = {composedCoef}x +{' '}
            {composedConst}
          </div>
          <p className="font-sans text-xs text-slate-400">
            Petakan 0 = spasi dan A=1..Z=26, hitung nilai setiap karakter, lalu
            pisahkan hasil ciphertext dengan koma (,).
          </p>
        </div>
      )}

      {variant === 'inverse' && (
        <div className="space-y-2.5 font-mono text-xs sm:text-sm tabular-nums">
          <div className="rounded-md bg-slate-900/90 border border-amber-500/30 px-3 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-amber-300 font-semibold">
              (g ∘ f)⁻¹(y) = f⁻¹(g⁻¹(y))
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-md bg-slate-900/80 border border-slate-800 px-3 py-2 flex items-center gap-1.5">
              <span className="text-slate-400">1) z = g⁻¹(y) =</span>
              <Fraction numerator={`y - ${d}`} denominator={c} />
            </div>
            <div className="rounded-md bg-slate-900/80 border border-slate-800 px-3 py-2 flex items-center gap-1.5">
              <span className="text-slate-400">2) x = f⁻¹(z) =</span>
              <Fraction numerator={`z - ${b}`} denominator={a} />
            </div>
          </div>
          <p className="font-sans text-xs text-slate-400">
            Setiap hasil x wajib berada pada rentang 0–26. Ubah 0 kembali menjadi
            spasi dan 1–26 menjadi A–Z.
          </p>
        </div>
      )}

      {variant === 'codec-rules' && (
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="font-mono text-cyan-200 tabular-nums">
            0 = Spasi · A = 1 · B = 2 · ... · Z = 26
          </div>
          <p className="text-slate-400">
            Spasi ikut diproses lewat fungsi yang sama menjadi{' '}
            <span className="font-mono text-slate-200">
              (g ∘ f)(0) = {composedConst}
            </span>
            . Pisahkan semua angka ciphertext dengan koma (,) dan jangan gunakan
            slash (/).
          </p>
        </div>
      )}
    </div>
  );
};
