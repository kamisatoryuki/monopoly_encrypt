import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  decryptNumbers,
  encryptText,
  getChallengeHints,
  validateDecryptSubmission,
  validateEncryptSubmission,
} from '../engine/mathEngine';
import { PairedChallenge, SessionMathKeys } from '../types/game';
import { FormulaBox } from './FormulaBox';

interface ChallengeModalProps {
  challenge: PairedChallenge;
  mathKeys: SessionMathKeys;
  isPaused?: boolean;
  onUseHint: (step: 'ENCRYPT' | 'DECRYPT') => void;
  onEncryptSuccess: () => void;
  onAttemptRecorded: () => void;
  onCompletePair: () => void;
  onForfeit: () => void;
}

const COMPACT_ALPHABET = Array.from({ length: 26 }, (_, i) => ({
  ch: String.fromCharCode(65 + i),
  num: i + 1,
}));

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  challenge,
  mathKeys,
  isPaused = false,
  onUseHint,
  onEncryptSuccess,
  onAttemptRecorded,
  onCompletePair,
  onForfeit,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [stepSolvedPendingAdvance, setStepSolvedPendingAdvance] =
    useState(false);
  const [showTable, setShowTable] = useState(false);

  const step = challenge.currentStep;
  const hints = getChallengeHints(step, challenge, mathKeys);
  const revealedCount =
    step === 'ENCRYPT'
      ? challenge.hintsRevealedEncrypt
      : challenge.hintsRevealedDecrypt;

  useEffect(() => {
    setInputValue('');
    setFeedback(null);
    setStepSolvedPendingAdvance(false);
  }, [challenge.id, step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPaused || stepSolvedPendingAdvance) return;

    onAttemptRecorded();

    if (step === 'ENCRYPT') {
      const res = validateEncryptSubmission(inputValue, challenge);
      if (res.isValid) {
        setFeedback({ type: 'success', text: res.message });
        setStepSolvedPendingAdvance(true);
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
      return;
    }

    const res = validateDecryptSubmission(inputValue, challenge);
    if (res.isValid) {
      setFeedback({ type: 'success', text: res.message });
      setStepSolvedPendingAdvance(true);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleRevealHint = () => {
    if (revealedCount >= 3 || isPaused) return;
    onUseHint(step);
  };

  const encPreview = encryptText(challenge.plaintext, mathKeys);
  const decPreview = decryptNumbers(challenge.cipherNumbers, mathKeys);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#111827] shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-800 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium">
              {step === 'ENCRYPT' ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5 text-amber-300" />
              )}
              <span>
                Tantangan Berpasangan ·{' '}
                {step === 'ENCRYPT'
                  ? 'Tahap 1/2: Enkripsi (g ∘ f)(x)'
                  : 'Tahap 2/2: Dekripsi (g ∘ f)⁻¹(y)'}
              </span>
            </div>
            <h2
              id="challenge-modal-title"
              className="mt-0.5 text-base sm:text-lg font-semibold text-white"
            >
              {challenge.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
            <span
              className={`rounded px-2 py-1 border ${
                challenge.encryptSolved
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                  : 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200'
              }`}
            >
              1. Enkripsi
            </span>
            <span className="text-slate-600">→</span>
            <span
              className={`rounded px-2 py-1 border ${
                challenge.decryptSolved
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                  : step === 'DECRYPT'
                  ? 'border-amber-500/50 bg-amber-950/40 text-amber-200'
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
            >
              2. Dekripsi
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5 text-sm">
          <p className="text-xs sm:text-sm text-slate-300">
            {challenge.contextNote}
          </p>

          {/* Consistent FormulaBox */}
          <FormulaBox
            keys={mathKeys}
            variant={step === 'ENCRYPT' ? 'composition' : 'inverse'}
          />

          {/* Challenge Prompt Box */}
          <div className="rounded-lg border border-slate-700/90 bg-[#0B1120] p-4 space-y-2.5">
            {step === 'ENCRYPT' ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    Teks Asli untuk Dienkripsi ({challenge.plaintext.length}{' '}
                    karakter termasuk spasi):
                  </span>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    0 = Spasi · A=1..Z=26
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {challenge.plaintext.split('').map((ch, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded border px-1.5 font-mono text-sm font-semibold ${
                        ch === ' '
                          ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300 text-[11px]'
                          : 'border-slate-700 bg-slate-900 text-white'
                      }`}
                    >
                      {ch === ' ' ? 'SPASI' : ch}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-amber-300">
                    Ciphertext yang Sama untuk Didekripsi:
                  </span>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    {challenge.cipherNumbers.length} angka · 0 = Spasi
                  </span>
                </div>
                <div className="rounded-md border border-amber-500/30 bg-slate-900/90 px-3 py-2.5 font-mono text-sm font-semibold text-amber-200 tabular-nums tracking-wide">
                  {challenge.cipherText}
                </div>
              </>
            )}
          </div>

          {/* Collapsible 0-26 Reference Table */}
          <div className="rounded-lg border border-slate-800 bg-[#0D1526]">
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white"
            >
              <span>Tabel Cepat Kuantifikasi (0 = Spasi, A = 1 .. Z = 26)</span>
              {showTable ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {showTable && (
              <div className="border-t border-slate-800 p-3 grid grid-cols-7 sm:grid-cols-9 gap-1 font-mono text-[11px] tabular-nums">
                <div className="col-span-2 flex items-center justify-between rounded border border-cyan-500/40 bg-cyan-950/30 px-2 py-1 text-cyan-200">
                  <span>SPASI</span>
                  <span>0</span>
                </div>
                {COMPACT_ALPHABET.map((item) => (
                  <div
                    key={item.ch}
                    className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/80 px-1.5 py-1 text-slate-200"
                  >
                    <span>{item.ch}</span>
                    <span className="text-slate-400">{item.num}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Answer Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="challenge-answer-input"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                {step === 'ENCRYPT'
                  ? 'Masukkan deretan angka ciphertext dipisahkan koma (,):'
                  : 'Masukkan teks asli hasil dekripsi (huruf A–Z dan spasi):'}
              </label>
              <input
                id="challenge-answer-input"
                type="text"
                value={inputValue}
                disabled={isPaused || stepSolvedPendingAdvance}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  step === 'ENCRYPT'
                    ? 'Contoh: 31, 13, 49, 19'
                    : 'Contoh: DATA AMAN'
                }
                className="w-full rounded-lg border border-slate-700 bg-[#0B1120] px-3.5 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
                autoFocus
              />
            </div>

            {feedback && (
              <div
                className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs ${
                  feedback.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-950/40 text-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Short Mathematical Explanation after solving step */}
            {stepSolvedPendingAdvance && (
              <div className="rounded-lg border border-emerald-500/30 bg-[#0D1526] p-3.5 space-y-2">
                <div className="text-xs font-semibold text-emerald-300">
                  Pembahasan Singkat
                </div>
                {step === 'ENCRYPT' ? (
                  <div className="space-y-1 font-mono text-[11px] text-slate-300 tabular-nums">
                    {encPreview.steps.slice(0, 4).map((st) => (
                      <div key={st.index}>
                        {st.char === ' ' ? '[SPASI]' : st.char} (x={st.plainCode}) →
                        f({st.plainCode})={st.fValue} → g({st.fValue})={st.cipherValue}
                      </div>
                    ))}
                    {encPreview.steps.length > 4 && (
                      <div className="text-slate-400">
                        …dan {encPreview.steps.length - 4} karakter berikutnya →{' '}
                        {encPreview.cipherText}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 font-mono text-[11px] text-slate-300 tabular-nums">
                    {decPreview.steps.slice(0, 4).map((st, idx) => (
                      <div key={idx}>
                        y={st.cipherValue} → g⁻¹({st.cipherValue})={st.gInverseValue} →
                        f⁻¹({st.gInverseValue})={st.fInverseValue} (
                        {st.char === ' ' ? 'SPASI' : st.char})
                      </div>
                    ))}
                    {decPreview.steps.length > 4 && (
                      <div className="text-slate-400">
                        …total {decPreview.steps.length} karakter (seluruh nilai
                        0–26 tervalidasi) → &ldquo;{decPreview.plaintext}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Hints Display */}
            {revealedCount > 0 && (
              <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5">
                <div className="text-xs font-semibold text-amber-300">
                  Petunjuk Bertahap ({revealedCount}/3)
                </div>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {hints.slice(0, revealedCount).map((h, i) => (
                    <li key={i} className="leading-relaxed">
                      <span className="font-mono text-amber-300">
                        Tingkat {i + 1}:
                      </span>{' '}
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {!stepSolvedPendingAdvance && (
                  <button
                    type="button"
                    onClick={handleRevealHint}
                    disabled={revealedCount >= 3 || isPaused}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-950/50 disabled:opacity-40 whitespace-nowrap"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    {revealedCount >= 3
                      ? 'Petunjuk Maksimal (3/3)'
                      : `Minta Petunjuk (${revealedCount}/3)`}
                  </button>
                )}

                {!stepSolvedPendingAdvance && (
                  <button
                    type="button"
                    onClick={onForfeit}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 whitespace-nowrap"
                  >
                    Lewati Tantangan
                  </button>
                )}
              </div>

              {!stepSolvedPendingAdvance ? (
                <button
                  type="submit"
                  disabled={isPaused}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 whitespace-nowrap"
                >
                  {step === 'ENCRYPT' ? 'Periksa Enkripsi' : 'Periksa Dekripsi'}
                </button>
              ) : step === 'ENCRYPT' ? (
                <button
                  type="button"
                  onClick={onEncryptSuccess}
                  className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300 whitespace-nowrap"
                >
                  Lanjut ke Dekripsi Invers
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCompletePair}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 whitespace-nowrap"
                >
                  Selesaikan & Klaim Hasil
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
