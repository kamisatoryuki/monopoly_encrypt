import {
  BoardTile,
  CryptoniaCard,
  CryptoniaLoreConfig,
  DistrictColor,
  GameMode,
} from '../types/game';
import { CryptoniaStory } from '../types/story';
import { DEFAULT_CRYPTONIA_STORY } from './storyDefaults';

export const DEFAULT_CRYPTONIA_LORE: CryptoniaLoreConfig = {
  sourceStatus: 'CUSTOM_IMPORTED',
  sourceNote:
    'Memuat naskah resmi THE LOST CIPHER — Cryptonia 2099 dari story_3ebc4ce9.json.',
  prologueTitle: DEFAULT_CRYPTONIA_STORY.title,
  prologueParagraphs: DEFAULT_CRYPTONIA_STORY.prologue.slides.flatMap(
    (s) => s.paragraphs
  ),
  tileNames: {},
  challengePhrases: [
    'GERBANG KOTA',
    'ARSIP KOTA',
    'PUSAT DETENSI',
    'SINYAL KOTA',
    'LEDGER KOTA',
    'MENARA ARSIP',
    'KUNCI SANDI',
    'PASAR ASET',
    'IZIN BANGUN',
    'DANA KOTA',
    'BANK PUSAT',
    'WILAYAH BARU',
  ],
};

interface BaseTileSpec {
  id: number;
  defaultName: string;
  type: BoardTile['type'];
  district?: DistrictColor;
  price?: number;
  baseRent?: number;
  taxAmount?: number;
  defaultLore?: string;
}

const BASE_40_TILES: BaseTileSpec[] = [
  {
    id: 0,
    defaultName: 'Gerbang Kota (Start)',
    type: 'START',
    defaultLore: 'Gerbang Kota membuka jalur pendanaan operasional investor.',
  },
  { id: 1, defaultName: 'Wilayah 01 · Sektor A1', type: 'PROPERTY', district: 'slate', price: 60, baseRent: 12 },
  {
    id: 2,
    defaultName: 'Arsip Kota',
    type: 'CARD',
    defaultLore: DEFAULT_CRYPTONIA_STORY.decks.communityChest.framing,
  },
  { id: 3, defaultName: 'Wilayah 03 · Sektor A2', type: 'PROPERTY', district: 'slate', price: 80, baseRent: 16 },
  { id: 4, defaultName: 'Kewajiban Pajak Kota', type: 'TAX', taxAmount: 100 },
  { id: 5, defaultName: 'Jalur Transit 1', type: 'STATION', price: 200, baseRent: 40 },
  { id: 6, defaultName: 'Wilayah 06 · Sektor B1', type: 'PROPERTY', district: 'cyan', price: 100, baseRent: 20 },
  {
    id: 7,
    defaultName: 'Sinyal Kesempatan',
    type: 'CARD',
    defaultLore: DEFAULT_CRYPTONIA_STORY.decks.chance.framing,
  },
  { id: 8, defaultName: 'Wilayah 08 · Sektor B2', type: 'PROPERTY', district: 'cyan', price: 100, baseRent: 20 },
  { id: 9, defaultName: 'Wilayah 09 · Sektor B3', type: 'PROPERTY', district: 'cyan', price: 120, baseRent: 24 },
  {
    id: 10,
    defaultName: DEFAULT_CRYPTONIA_STORY.jail.title,
    type: 'JAIL',
    defaultLore: DEFAULT_CRYPTONIA_STORY.jail.visiting,
  },

  { id: 11, defaultName: 'Wilayah 11 · Sektor C1', type: 'PROPERTY', district: 'teal', price: 140, baseRent: 28 },
  { id: 12, defaultName: 'Menara Arsip 1', type: 'UTILITY', price: 150, baseRent: 30 },
  { id: 13, defaultName: 'Wilayah 13 · Sektor C2', type: 'PROPERTY', district: 'teal', price: 140, baseRent: 28 },
  { id: 14, defaultName: 'Wilayah 14 · Sektor C3', type: 'PROPERTY', district: 'teal', price: 160, baseRent: 32 },
  { id: 15, defaultName: 'Jalur Transit 2', type: 'STATION', price: 200, baseRent: 40 },
  { id: 16, defaultName: 'Wilayah 16 · Sektor D1', type: 'PROPERTY', district: 'amber', price: 180, baseRent: 36 },
  {
    id: 17,
    defaultName: 'Arsip Kota',
    type: 'CARD',
    defaultLore: DEFAULT_CRYPTONIA_STORY.decks.communityChest.framing,
  },
  { id: 18, defaultName: 'Wilayah 18 · Sektor D2', type: 'PROPERTY', district: 'amber', price: 180, baseRent: 36 },
  { id: 19, defaultName: 'Wilayah 19 · Sektor D3', type: 'PROPERTY', district: 'amber', price: 200, baseRent: 40 },
  {
    id: 20,
    defaultName: 'Alun-Alun Bebas Cryptonia',
    type: 'FREE_PARKING',
    defaultLore: 'Kawasan singgah bebas di pusat kota perdagangan Cryptonia.',
  },

  { id: 21, defaultName: 'Wilayah 21 · Sektor E1', type: 'PROPERTY', district: 'indigo', price: 220, baseRent: 44 },
  {
    id: 22,
    defaultName: 'Sinyal Kesempatan',
    type: 'CARD',
    defaultLore: DEFAULT_CRYPTONIA_STORY.decks.chance.framing,
  },
  { id: 23, defaultName: 'Wilayah 23 · Sektor E2', type: 'PROPERTY', district: 'indigo', price: 220, baseRent: 44 },
  { id: 24, defaultName: 'Wilayah 24 · Sektor E3', type: 'PROPERTY', district: 'indigo', price: 240, baseRent: 48 },
  { id: 25, defaultName: 'Jalur Transit 3', type: 'STATION', price: 200, baseRent: 40 },
  { id: 26, defaultName: 'Wilayah 26 · Sektor F1', type: 'PROPERTY', district: 'rose', price: 260, baseRent: 52 },
  { id: 27, defaultName: 'Wilayah 27 · Sektor F2', type: 'PROPERTY', district: 'rose', price: 260, baseRent: 52 },
  { id: 28, defaultName: 'Menara Arsip 2', type: 'UTILITY', price: 150, baseRent: 30 },
  { id: 29, defaultName: 'Wilayah 29 · Sektor F3', type: 'PROPERTY', district: 'rose', price: 280, baseRent: 56 },
  {
    id: 30,
    defaultName: 'Masuk Pusat Detensi',
    type: 'GO_TO_JAIL',
    defaultLore: DEFAULT_CRYPTONIA_STORY.jail.entry,
  },

  { id: 31, defaultName: 'Wilayah 31 · Sektor G1', type: 'PROPERTY', district: 'emerald', price: 300, baseRent: 60 },
  { id: 32, defaultName: 'Wilayah 32 · Sektor G2', type: 'PROPERTY', district: 'emerald', price: 300, baseRent: 60 },
  {
    id: 33,
    defaultName: 'Arsip Kota',
    type: 'CARD',
    defaultLore: DEFAULT_CRYPTONIA_STORY.decks.communityChest.framing,
  },
  { id: 34, defaultName: 'Wilayah 34 · Sektor G3', type: 'PROPERTY', district: 'emerald', price: 320, baseRent: 64 },
  { id: 35, defaultName: 'Jalur Transit 4', type: 'STATION', price: 200, baseRent: 40 },
  {
    id: 36,
    defaultName: 'Sinyal Kesempatan',
    type: 'CARD',
    defaultLore: DEFAULT_CRYPTONIA_STORY.decks.chance.framing,
  },
  { id: 37, defaultName: 'Wilayah 37 · Sektor H1', type: 'PROPERTY', district: 'violet', price: 350, baseRent: 70 },
  { id: 38, defaultName: 'Kewajiban Arsip', type: 'TAX', taxAmount: 150 },
  { id: 39, defaultName: 'Wilayah 39 · Sektor H2', type: 'PROPERTY', district: 'violet', price: 400, baseRent: 80 },
];

/**
 * 7 dedicated special challenge tiles for Demo Solo (meets 6-8 special challenge tiles rule).
 */
export const SOLO_SPECIAL_CHALLENGE_TILE_IDS = new Set([3, 8, 14, 19, 25, 32, 37]);

export function buildBoardTiles(
  mode: GameMode,
  lore: CryptoniaLoreConfig = DEFAULT_CRYPTONIA_LORE,
  story: CryptoniaStory = DEFAULT_CRYPTONIA_STORY
): BoardTile[] {
  return BASE_40_TILES.map((spec) => {
    const customTile = lore.tileNames[spec.id];
    const isSoloSpecial =
      mode === 'solo' && SOLO_SPECIAL_CHALLENGE_TILE_IDS.has(spec.id);

    if (isSoloSpecial) {
      return {
        id: spec.id,
        name: customTile?.name
          ? `${customTile.name} (Tantangan)`
          : `Tantangan Sandi #${spec.id}`,
        type: 'CHALLENGE',
        district: spec.district,
        loreText:
          customTile?.loreText ||
          'Selesaikan pasangan enkripsi & dekripsi arsip Cryptonia untuk meraih bonus dana kota.',
      };
    }

    const name =
      spec.id === 10
        ? story.jail.title
        : customTile?.name || spec.defaultName;

    return {
      id: spec.id,
      name,
      type: spec.type,
      district: spec.district,
      price: spec.price,
      baseRent: spec.baseRent,
      taxAmount: spec.taxAmount,
      loreText:
        customTile?.loreText ||
        spec.defaultLore ||
        'Wilayah properti di pasar perdagangan Cryptonia 2099. Kepemilikan dicatat di ledger kota.',
    };
  });
}

export function buildCryptoniaCards(
  story: CryptoniaStory = DEFAULT_CRYPTONIA_STORY
): CryptoniaCard[] {
  return [
    {
      id: 'card-signal-1',
      deck: 'SIGNAL',
      title: story.decks.chance.label,
      description: `${story.decks.chance.framing} ${story.decks.chance.instruction} (+150 Kredit bila berhasil).`,
      effectType: 'PAIRED_CHALLENGE',
      amount: 150,
    },
    {
      id: 'card-archive-1',
      deck: 'ARCHIVE',
      title: story.decks.communityChest.label,
      description: `${story.decks.communityChest.framing} Gerbang Kota membuka jalur pendanaan (+200 Kredit).`,
      effectType: 'MOVE_TO',
      targetTileId: 0,
    },
    {
      id: 'card-archive-2',
      deck: 'ARCHIVE',
      title: story.decks.communityChest.label,
      description: `${story.decks.communityChest.framing} Dana operasional investor ditambahkan oleh kota (+100 Kredit).`,
      effectType: 'CREDIT_DELTA',
      amount: 100,
    },
    {
      id: 'card-signal-2',
      deck: 'SIGNAL',
      title: story.decks.chance.label,
      description: `${story.decks.chance.framing} Transaksi pemeliharaan diteruskan ke bank pusat Cryptonia (-75 Kredit).`,
      effectType: 'CREDIT_DELTA',
      amount: -75,
    },
    {
      id: 'card-archive-3',
      deck: 'ARCHIVE',
      title: story.decks.communityChest.label,
      description: `${story.decks.communityChest.framing} ${story.decks.communityChest.instruction} (+180 Kredit bila berhasil).`,
      effectType: 'PAIRED_CHALLENGE',
      amount: 180,
    },
    {
      id: 'card-signal-3',
      deck: 'SIGNAL',
      title: story.decks.chance.label,
      description: `${story.decks.chance.framing} ${story.jail.entry}`,
      effectType: 'GO_TO_JAIL',
    },
  ];
}

export const CRYPTONIA_CARDS: CryptoniaCard[] = buildCryptoniaCards(
  DEFAULT_CRYPTONIA_STORY
);

export const DISTRICT_COLOR_STYLES: Record<
  DistrictColor,
  { bar: string; badge: string; label: string }
> = {
  slate: { bar: 'bg-slate-400', badge: 'text-slate-300', label: 'Sektor A' },
  cyan: { bar: 'bg-cyan-400', badge: 'text-cyan-300', label: 'Sektor B' },
  teal: { bar: 'bg-teal-400', badge: 'text-teal-300', label: 'Sektor C' },
  amber: { bar: 'bg-amber-400', badge: 'text-amber-300', label: 'Sektor D' },
  indigo: { bar: 'bg-indigo-400', badge: 'text-indigo-300', label: 'Sektor E' },
  rose: { bar: 'bg-rose-400', badge: 'text-rose-300', label: 'Sektor F' },
  emerald: { bar: 'bg-emerald-400', badge: 'text-emerald-300', label: 'Sektor G' },
  violet: { bar: 'bg-violet-400', badge: 'text-violet-300', label: 'Sektor H' },
};
