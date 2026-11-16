import {
  ChallengeStep,
  ChallengeTrigger,
  ChallengeType,
  MixedCipherSource,
  PairedChallenge,
  SessionMathKeys,
} from '../types/game';

const VALID_A_C = [2, 3, 4, 5] as const;
const VALID_B_D = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const CODEC_MIN = 0;
export const CODEC_MAX = 26;

export interface CodecStepDetail {
  index: number;
  char: string;
  plainCode: number;
  fValue: number;
  cipherValue: number;
}

export interface DecryptStepDetail {
  cipherValue: number;
  gInverseValue: number;
  fInverseValue: number;
  char: string;
}

export interface EncryptionResult {
  normalizedPlaintext: string;
  plainCodes: number[];
  cipherNumbers: number[];
  cipherText: string;
  steps: CodecStepDetail[];
}

export interface DecryptionResult {
  valid: boolean;
  error?: string;
  plainCodes: number[];
  plaintext: string;
  steps: DecryptStepDetail[];
}

export interface ValidationFeedback {
  isValid: boolean;
  message: string;
  parsedNumbers?: number[];
  normalizedText?: string;
}

/**
 * Generates session linear keys f(x) = a*x + b and g(x) = c*x + d
 * with a, c in [2..5] and b, d in [1..9] so all ciphertexts stay strictly positive.
 */
export function generateSessionMathKeys(
  rng: () => number = Math.random
): SessionMathKeys {
  const pick = <T,>(arr: readonly T[]): T =>
    arr[Math.floor(rng() * arr.length)];
  const a = pick(VALID_A_C);
  const b = pick(VALID_B_D);
  const c = pick(VALID_A_C);
  const d = pick(VALID_B_D);
  return { a, b, c, d };
}

export function validateSessionMathKeys(keys: SessionMathKeys): boolean {
  return (
    Number.isInteger(keys.a) &&
    keys.a >= 2 &&
    keys.a <= 5 &&
    Number.isInteger(keys.c) &&
    keys.c >= 2 &&
    keys.c <= 5 &&
    Number.isInteger(keys.b) &&
    keys.b >= 1 &&
    keys.b <= 9 &&
    Number.isInteger(keys.d) &&
    keys.d >= 1 &&
    keys.d <= 9
  );
}

/**
 * Normalizes plaintext to uppercase A-Z and single spaces only.
 */
export function normalizePlaintext(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Maps ' ' -> 0 and 'A'..'Z' -> 1..26.
 */
export function charToCode(ch: string): number {
  if (ch === ' ') return 0;
  if (ch.length === 1 && ch >= 'A' && ch <= 'Z') {
    return ch.charCodeAt(0) - 64;
  }
  throw new Error(`Karakter tidak didukung: "${ch}". Gunakan huruf A-Z atau spasi.`);
}

/**
 * Maps 0 -> ' ' and 1..26 -> 'A'..'Z'. Validates strict 0..26 integer range.
 */
export function codeToChar(code: number): string {
  if (!Number.isInteger(code) || code < CODEC_MIN || code > CODEC_MAX) {
    throw new Error(
      `Nilai hasil dekripsi (${code}) berada di luar rentang valid 0–26.`
    );
  }
  if (code === 0) return ' ';
  return String.fromCharCode(64 + code);
}

/** f(x) = a*x + b */
export function evalF(x: number, keys: SessionMathKeys): number {
  return keys.a * x + keys.b;
}

/** g(x) = c*x + d */
export function evalG(x: number, keys: SessionMathKeys): number {
  return keys.c * x + keys.d;
}

/** Standardized composition (g ∘ f)(x) = g(f(x)) */
export function evalCompositionGF(x: number, keys: SessionMathKeys): number {
  return evalG(evalF(x, keys), keys);
}

/** Inverse of (g ∘ f): (g ∘ f)⁻¹(y) = f⁻¹(g⁻¹(y)) */
export function evalInverseGF(
  y: number,
  keys: SessionMathKeys
): { valid: boolean; gInv: number; fInv: number; error?: string } {
  if (!Number.isInteger(y) || y <= 0) {
    return {
      valid: false,
      gInv: NaN,
      fInv: NaN,
      error: `Ciphertext ${y} harus berupa bilangan bulat positif.`,
    };
  }
  const gDiff = y - keys.d;
  if (gDiff % keys.c !== 0) {
    return {
      valid: false,
      gInv: gDiff / keys.c,
      fInv: NaN,
      error: `g⁻¹(${y}) = (${y} - ${keys.d}) / ${keys.c} tidak menghasilkan bilangan bulat.`,
    };
  }
  const gInv = gDiff / keys.c;
  const fDiff = gInv - keys.b;
  if (fDiff % keys.a !== 0) {
    return {
      valid: false,
      gInv,
      fInv: fDiff / keys.a,
      error: `f⁻¹(${gInv}) = (${gInv} - ${keys.b}) / ${keys.a} tidak menghasilkan bilangan bulat.`,
    };
  }
  const fInv = fDiff / keys.a;
  if (fInv < CODEC_MIN || fInv > CODEC_MAX) {
    return {
      valid: false,
      gInv,
      fInv,
      error: `Hasil dekripsi ${fInv} berada di luar rentang 0–26.`,
    };
  }
  return { valid: true, gInv, fInv };
}

/**
 * Encrypts plaintext (including spaces as 0) using (g ∘ f)(x) = g(f(x)),
 * returning comma-separated positive integers (never slash '/').
 */
export function encryptText(
  rawPlaintext: string,
  keys: SessionMathKeys
): EncryptionResult {
  const normalizedPlaintext = normalizePlaintext(rawPlaintext);
  if (!normalizedPlaintext) {
    throw new Error('Teks sumber untuk enkripsi tidak boleh kosong.');
  }

  const plainCodes: number[] = [];
  const cipherNumbers: number[] = [];
  const steps: CodecStepDetail[] = [];

  for (let i = 0; i < normalizedPlaintext.length; i++) {
    const ch = normalizedPlaintext[i];
    const x = charToCode(ch);
    const fVal = evalF(x, keys);
    const y = evalG(fVal, keys);

    plainCodes.push(x);
    cipherNumbers.push(y);
    steps.push({
      index: i,
      char: ch,
      plainCode: x,
      fValue: fVal,
      cipherValue: y,
    });
  }

  return {
    normalizedPlaintext,
    plainCodes,
    cipherNumbers,
    cipherText: cipherNumbers.join(', '),
    steps,
  };
}

/**
 * Decrypts positive integer array using (g ∘ f)⁻¹(y) = f⁻¹(g⁻¹(y)).
 * Validates that every result is an integer in 0–26 and restores 0 -> ' '.
 */
export function decryptNumbers(
  cipherNumbers: number[],
  keys: SessionMathKeys
): DecryptionResult {
  if (cipherNumbers.length === 0) {
    return {
      valid: false,
      error: 'Deretan angka ciphertext tidak boleh kosong.',
      plainCodes: [],
      plaintext: '',
      steps: [],
    };
  }

  const plainCodes: number[] = [];
  const steps: DecryptStepDetail[] = [];
  let plaintext = '';

  for (const y of cipherNumbers) {
    const inv = evalInverseGF(y, keys);
    if (!inv.valid) {
      return {
        valid: false,
        error: inv.error,
        plainCodes: [],
        plaintext: '',
        steps: [],
      };
    }
    const ch = codeToChar(inv.fInv);
    plainCodes.push(inv.fInv);
    plaintext += ch;
    steps.push({
      cipherValue: y,
      gInverseValue: inv.gInv,
      fInverseValue: inv.fInv,
      char: ch,
    });
  }

  return {
    valid: true,
    plainCodes,
    plaintext,
    steps,
  };
}

/**
 * Parses comma-separated ciphertext input from user.
 * Explicitly rejects '/' word separators per specification.
 */
export function parseCiphertextInput(raw: string): {
  valid: boolean;
  numbers: number[];
  error?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      numbers: [],
      error: 'Masukkan angka ciphertext yang dipisahkan tanda koma (,).',
    };
  }

  if (trimmed.includes('/')) {
    return {
      valid: false,
      numbers: [],
      error:
        'Jangan gunakan slash (/) sebagai pemisah kata. Enkripsi spasi sebagai 0 dan pisahkan setiap angka dengan koma (,).',
    };
  }

  const tokens = trimmed
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return {
      valid: false,
      numbers: [],
      error: 'Format tidak valid. Contoh format: 19, 43, 11, 55.',
    };
  }

  const numbers: number[] = [];
  for (const token of tokens) {
    if (!/^-?\d+$/.test(token)) {
      return {
        valid: false,
        numbers: [],
        error: `Token "${token}" bukan bilangan bulat yang valid. Gunakan koma (,) di antara setiap angka.`,
      };
    }
    const val = Number(token);
    if (val <= 0) {
      return {
        valid: false,
        numbers: [],
        error: `Angka ciphertext (${val}) harus positif karena a,c ∈ 2–5 dan b,d ∈ 1–9.`,
      };
    }
    numbers.push(val);
  }

  return { valid: true, numbers };
}

export function createChallenge(params: {
  id: string;
  challengeType: ChallengeType;
  step: ChallengeStep;
  trigger: ChallengeTrigger;
  targetTileId?: number;
  title: string;
  contextNote: string;
  rawPlaintext: string;
  keys: SessionMathKeys;
  rewardCredits: number;
  previousMixedSource?: MixedCipherSource | null;
}): PairedChallenge {
  if (
    params.step === 'DECRYPT' &&
    params.previousMixedSource
  ) {
    return {
      id: params.id,
      challengeType: params.challengeType,
      trigger: params.trigger,
      targetTileId: params.targetTileId,
      title: params.title,
      contextNote: params.contextNote,
      plaintext: params.previousMixedSource.plaintext,
      plainCodes: params.previousMixedSource.plainCodes,
      cipherNumbers: params.previousMixedSource.cipherNumbers,
      cipherText: params.previousMixedSource.cipherText,
      currentStep: 'DECRYPT',
      fromPreviousMixedEncrypt: true,
      solved: false,
      hintsRevealed: 0,
      attempts: 0,
      rewardCredits: params.rewardCredits,
    };
  }

  const enc = encryptText(params.rawPlaintext, params.keys);
  return {
    id: params.id,
    challengeType: params.challengeType,
    trigger: params.trigger,
    targetTileId: params.targetTileId,
    title: params.title,
    contextNote: params.contextNote,
    plaintext: enc.normalizedPlaintext,
    plainCodes: enc.plainCodes,
    cipherNumbers: enc.cipherNumbers,
    cipherText: enc.cipherText,
    currentStep: params.step,
    fromPreviousMixedEncrypt: false,
    solved: false,
    hintsRevealed: 0,
    attempts: 0,
    rewardCredits: params.rewardCredits,
  };
}

export function createPairedChallenge(params: {
  id: string;
  trigger: ChallengeTrigger;
  targetTileId?: number;
  title: string;
  contextNote: string;
  rawPlaintext: string;
  keys: SessionMathKeys;
  rewardCredits: number;
}): PairedChallenge {
  return createChallenge({
    ...params,
    challengeType: 'mixed',
    step: 'ENCRYPT',
  });
}

export function validateEncryptSubmission(
  userInput: string,
  challenge: PairedChallenge
): ValidationFeedback {
  const parsed = parseCiphertextInput(userInput);
  if (!parsed.valid) {
    return { isValid: false, message: parsed.error || 'Input tidak valid.' };
  }

  if (parsed.numbers.length !== challenge.cipherNumbers.length) {
    const spaceCount = challenge.plainCodes.filter((c) => c === 0).length;
    const extraNote =
      spaceCount > 0
        ? ` Ingat: ada ${spaceCount} spasi (x = 0) yang wajib ikut dienkripsi.`
        : '';
    return {
      isValid: false,
      parsedNumbers: parsed.numbers,
      message: `Jumlah angka belum sesuai: tertulis ${parsed.numbers.length} angka, seharusnya ${challenge.cipherNumbers.length} angka.${extraNote}`,
    };
  }

  for (let i = 0; i < challenge.cipherNumbers.length; i++) {
    if (parsed.numbers[i] !== challenge.cipherNumbers[i]) {
      const charLabel =
        challenge.plaintext[i] === ' '
          ? 'Spasi (x = 0)'
          : `Karakter ke-${i + 1} (${challenge.plaintext[i]})`;
      return {
        isValid: false,
        parsedNumbers: parsed.numbers,
        message: `${charLabel} belum tepat. Periksa kembali perhitungan g(f(x)) pada posisi ke-${i + 1}.`,
      };
    }
  }

  return {
    isValid: true,
    parsedNumbers: parsed.numbers,
    message:
      'Enkripsi (g ∘ f)(x) tepat! Sekarang lanjutkan dengan mendekripsi ciphertext yang sama menggunakan invers.',
  };
}

export function validateDecryptSubmission(
  userInput: string,
  challenge: PairedChallenge
): ValidationFeedback {
  const normalized = normalizePlaintext(userInput);
  if (!normalized) {
    return {
      isValid: false,
      message: 'Masukkan teks hasil dekripsi (huruf A–Z dan spasi).',
    };
  }

  if (normalized === challenge.plaintext) {
    return {
      isValid: true,
      normalizedText: normalized,
      message:
        'Dekripsi (g ∘ f)⁻¹(y) berhasil! Nilai 0 telah dipulihkan sebagai spasi dan seluruh karakter berada pada rentang 0–26.',
    };
  }

  const targetWithoutSpaces = challenge.plaintext.replace(/ /g, '');
  const userWithoutSpaces = normalized.replace(/ /g, '');
  if (userWithoutSpaces === targetWithoutSpaces && normalized !== challenge.plaintext) {
    return {
      isValid: false,
      normalizedText: normalized,
      message:
        'Huruf sudah tepat, tetapi penempatan spasi (hasil invers = 0) belum sesuai. Periksa nilai 0 pada hasil dekripsi.',
    };
  }

  return {
    isValid: false,
    normalizedText: normalized,
    message:
      'Hasil dekripsi belum sesuai. Pastikan urutan invers adalah f⁻¹(g⁻¹(y)) dan nilai 0 diubah menjadi spasi.',
  };
}

/**
 * Generates up to 3 progressive hints without leaking the final answer.
 */
export function getChallengeHints(
  step: ChallengeStep,
  challenge: PairedChallenge,
  keys: SessionMathKeys
): [string, string, string] {
  const { a, b, c, d } = keys;
  const hasSpaces = challenge.plainCodes.includes(0);

  if (step === 'ENCRYPT') {
    const firstChar = challenge.plaintext[0];
    const firstCode = challenge.plainCodes[0];
    const firstF = evalF(firstCode, keys);

    const hint1 = `Gunakan urutan komposisi (g ∘ f)(x) = g(f(x)): hitung f(x) = ${a}x + ${b} terlebih dahulu, lalu substitusikan hasilnya ke g(u) = ${c}u + ${d}. Pisahkan seluruh angka dengan koma (,)${hasSpaces ? ' dan sertakan spasi sebagai x = 0' : ''}.`;

    const hint2 = `Mulai dari karakter pertama "${firstChar}" yang bernilai x₁ = ${firstCode}. Substitusikan ke fungsi dalam: f(${firstCode}) = ${a}(${firstCode}) + ${b}.${hasSpaces ? ' Catatan: terdapat karakter spasi (0) pada teks ini yang juga diproses lewat rumus yang sama.' : ''}`;

    const hint3 = `Pada karakter pertama "${firstChar}", nilai antara adalah f(${firstCode}) = ${firstF}. Lanjutkan ke fungsi luar g(${firstF}) = ${c}(${firstF}) + ${d}, lalu ulangi prosedur yang sama untuk ${challenge.plaintext.length - 1} karakter berikutnya.`;

    return [hint1, hint2, hint3];
  }

  // DECRYPT hints (never reveal plaintext letters or full decoded words)
  const y1 = challenge.cipherNumbers[0];
  const gInv1 = (y1 - d) / c;
  const spaceIndices = challenge.plainCodes
    .map((code, idx) => (code === 0 ? idx + 1 : -1))
    .filter((pos) => pos > 0);

  const hint1 = `Gunakan urutan invers (g ∘ f)⁻¹(y) = f⁻¹(g⁻¹(y)): kurangi setiap angka y dengan ${d} lalu bagi ${c} untuk memperoleh g⁻¹(y), kemudian kurangi ${b} lalu bagi ${a}. Nilai akhir wajib berada pada 0–26 (0 = spasi).`;

  const hint2 = `Untuk angka sandi pertama y₁ = ${y1}, hitung dulu langkah g⁻¹(${y1}) = (${y1} - ${d}) / ${c} = ${y1 - d} / ${c}. Setelah mendapat hasilnya, masukkan ke f⁻¹(z) = (z - ${b}) / ${a}.`;

  const spaceNote =
    spaceIndices.length > 0
      ? ` Posisi yang menghasilkan x = 0 (spasi) berada pada urutan angka ke-${spaceIndices.join(', ')}.`
      : ' Teks ini tidak mengandung spasi (seluruh nilai x berada di rentang 1–26).';

  const hint3 = `Hasil langkah pertama pada angka ke-1 adalah g⁻¹(${y1}) = ${gInv1}. Sekarang hitung f⁻¹(${gInv1}) = (${gInv1} - ${b}) / ${a} untuk menemukan kode huruf ke-1 (1=A..26=Z).${spaceNote}`;

  return [hint1, hint2, hint3];
}

export function formatInverseExplanation(
  cipherNumbers: number[],
  keys: SessionMathKeys
): DecryptStepDetail[] {
  const res = decryptNumbers(cipherNumbers, keys);
  return res.valid ? res.steps : [];
}
