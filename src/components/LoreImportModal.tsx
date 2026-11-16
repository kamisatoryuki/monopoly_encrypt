import React, { useState } from 'react';
import { FileText, RotateCcw, Save, X } from 'lucide-react';
import { DEFAULT_CRYPTONIA_LORE } from '../data/cryptoniaLore';
import { CryptoniaLoreConfig } from '../types/game';

interface LoreImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLore: CryptoniaLoreConfig;
  onSaveLore: (lore: CryptoniaLoreConfig) => void;
  onResetLore: () => void;
}

export const LoreImportModal: React.FC<LoreImportModalProps> = ({
  isOpen,
  onClose,
  currentLore,
  onSaveLore,
  onResetLore,
}) => {
  const [prologueText, setPrologueText] = useState(
    currentLore.prologueParagraphs.join('\n\n')
  );
  const [phrasesText, setPhrasesText] = useState(
    currentLore.challengePhrases.join('\n')
  );
  const [tileJsonText, setTileJsonText] = useState(
    JSON.stringify(currentLore.tileNames, null, 2)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setErrorMsg(null);
    let parsedTiles: CryptoniaLoreConfig['tileNames'] = {};
    try {
      const rawTiles = JSON.parse(tileJsonText || '{}');
      if (typeof rawTiles !== 'object' || Array.isArray(rawTiles)) {
        setErrorMsg('Format JSON nama petak harus berupa objek { "1": { "name": "...", "loreText": "..." } }.');
        return;
      }
      parsedTiles = rawTiles;
    } catch {
      setErrorMsg('JSON nama 40 petak tidak valid. Periksa tanda kutip dan koma.');
      return;
    }

    const paragraphs = prologueText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    const phrases = phrasesText
      .split('\n')
      .map((line) => line.trim().toUpperCase().replace(/[^A-Z ]+/g, ' ').replace(/\s+/g, ' ').trim())
      .filter((p) => p.length >= 3);

    onSaveLore({
      sourceStatus: 'CUSTOM_IMPORTED',
      sourceNote: 'Menggunakan teks referensi Cryptonia 2099 yang diimpor pengguna.',
      prologueTitle: 'Prolog Cryptonia 2099',
      prologueParagraphs:
        paragraphs.length > 0
          ? paragraphs
          : DEFAULT_CRYPTONIA_LORE.prologueParagraphs,
      tileNames: parsedTiles,
      challengePhrases:
        phrases.length > 0 ? phrases : DEFAULT_CRYPTONIA_LORE.challengePhrases,
    });
    onClose();
  };

  const handleReset = () => {
    onResetLore();
    setPrologueText(DEFAULT_CRYPTONIA_LORE.prologueParagraphs.join('\n\n'));
    setPhrasesText(DEFAULT_CRYPTONIA_LORE.challengePhrases.join('\n'));
    setTileJsonText('{}');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lore-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#111827] shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-amber-400" />
            <h2 id="lore-modal-title" className="text-lg font-semibold text-white">
              Impor Referensi Lore Cryptonia 2099
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Tutup modal impor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6 text-sm">
          <p className="text-slate-400">
            Tempelkan naskah prolog, kata sandi tantangan, dan pemetaan 40 petak
            (indeks <span className="font-mono text-slate-200">0–39</span>) dari
            file referensi resmi Cryptonia 2099 tanpa mengubah cerita aslinya.
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Naskah Prolog Cryptonia 2099 (pisahkan paragraf dengan baris kosong)
            </label>
            <textarea
              rows={4}
              value={prologueText}
              onChange={(e) => setPrologueText(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#0B1120] p-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Daftar Frasa Tantangan (satu frasa per baris, huruf A–Z dan spasi)
            </label>
            <textarea
              rows={3}
              value={phrasesText}
              onChange={(e) => setPhrasesText(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#0B1120] p-3 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Pemetaan 40 Petak JSON (opsional per indeks 0–39)
            </label>
            <textarea
              rows={4}
              value={tileJsonText}
              onChange={(e) => setTileJsonText(e.target.value)}
              placeholder='{"1": {"name": "Nama Petak Asli", "loreText": "Deskripsi sumber"}}'
              className="w-full rounded-lg border border-slate-700 bg-[#0B1120] p-3 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Kembalikan Default
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 whitespace-nowrap"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 whitespace-nowrap"
              >
                <Save className="h-3.5 w-3.5" />
                Simpan Referensi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
