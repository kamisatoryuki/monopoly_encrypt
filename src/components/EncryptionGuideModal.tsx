import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { encryptText, decryptNumbers } from '../engine/mathEngine';
import { SessionMathKeys } from '../types/game';
import { FormulaBox } from './FormulaBox';

interface EncryptionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  mathKeys: SessionMathKeys;
}

const ALPHABET_MAP: { label: string; code: number }[] = [
  { label: 'SPASI', code: 0 },
  ...Array.from({ length: 26 }, (_, idx) => ({
    label: String.fromCharCode(65 + idx),
    code: idx + 1,
  })),
];

export const EncryptionGuideModal: React.FC<EncryptionGuideModalProps> = ({
  isOpen,
  onClose,
  mathKeys,
}) => {
  if (!isOpen) return null;

  const samplePhrase = 'A B';
  const encSample = encryptText(samplePhrase, mathKeys);
  const decSample = decryptNumbers(encSample.cipherNumbers, mathKeys);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-title"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#111827] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-800 bg-[#111827]/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-cyan-400" />
            <h2 id="guide-title" className="text-lg font-semibold text-white">
              Panduan Enkripsi & Dekripsi (Encryption Guide)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Tutup panduan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6 text-sm text-slate-300">
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-white">
              1. Rumus Standar Sesi Aktif
            </h3>
            <FormulaBox keys={mathKeys} variant="session-overview" />
            <p className="text-slate-400">
              Seluruh enkripsi menggunakan urutan komposisi{' '}
              <span className="font-mono text-cyan-300">(g ∘ f)(x) = g(f(x))</span>{' '}
              (hitung <span className="font-mono">f(x)</span> terlebih dahulu, lalu
              masukkan hasilnya ke <span className="font-mono">g</span>). Untuk
              dekripsi, urutan dibalik memakai{' '}
              <span className="font-mono text-amber-300">
                (g ∘ f)⁻¹(y) = f⁻¹(g⁻¹(y))
              </span>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-white">
              2. Tabel Kuantifikasi Karakter (0–26)
            </h3>
            <FormulaBox keys={mathKeys} variant="codec-rules" />
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 font-mono text-xs tabular-nums">
              {ALPHABET_MAP.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-md border px-2 py-1.5 ${
                    item.code === 0
                      ? 'col-span-2 sm:col-span-2 border-cyan-500/40 bg-cyan-950/30 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/70 text-slate-200'
                  }`}
                >
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-slate-400">{item.code}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-white">
              3. Contoh Multi-Kata dengan Spasi (&ldquo;{samplePhrase}&rdquo;)
            </h3>
            <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-4 space-y-3">
              <div className="text-xs text-slate-400">
                Aturan pemisah: gunakan <strong className="text-slate-200">koma (,)</strong> antar
                setiap angka ciphertext. Jangan gunakan slash (<span className="font-mono">/</span>).
              </div>

              <div className="space-y-2 font-mono text-xs tabular-nums">
                {encSample.steps.map((st) => (
                  <div
                    key={st.index}
                    className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-900/80 px-3 py-2 border border-slate-800/80"
                  >
                    <span className="text-slate-200">
                      {st.char === ' ' ? '[SPASI]' : `Huruf ${st.char}`} (x ={' '}
                      {st.plainCode})
                    </span>
                    <span className="text-slate-400">
                      f({st.plainCode}) = {st.fValue} → g({st.fValue}) ={' '}
                      <strong className="text-cyan-300">{st.cipherValue}</strong>
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Ciphertext valid: </span>
                  <span className="font-mono font-semibold text-cyan-300">
                    {encSample.cipherText}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Hasil dekripsi (0 → spasi): </span>
                  <span className="font-mono font-semibold text-emerald-300">
                    &ldquo;{decSample.plaintext}&rdquo;
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
