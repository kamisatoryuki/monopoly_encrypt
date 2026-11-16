import { DEFAULT_CRYPTONIA_LORE } from '../data/cryptoniaLore';
import {
  CryptoniaLoreConfig,
  GameSession,
  MatchSummaryRecord,
} from '../types/game';

const SESSION_KEY = 'monopoly_encrypt_active_session_v1';
const HISTORY_KEY = 'monopoly_encrypt_match_history_v1';
const LORE_KEY = 'monopoly_encrypt_custom_lore_v1';
const SOUND_KEY = 'monopoly_encrypt_sound_enabled_v1';

export function saveActiveSession(session: GameSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadActiveSession(): GameSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameSession;
    if (!parsed || !parsed.id || !parsed.mathKeys || !Array.isArray(parsed.players)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveMatchSummary(record: MatchSummaryRecord): void {
  try {
    const existing = loadMatchHistory();
    const updated = [record, ...existing].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function loadMatchHistory(): MatchSummaryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearMatchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function saveCustomLore(lore: CryptoniaLoreConfig): void {
  try {
    localStorage.setItem(LORE_KEY, JSON.stringify(lore));
  } catch {
    // Ignore storage errors
  }
}

export function loadLoreConfig(): CryptoniaLoreConfig {
  try {
    const raw = localStorage.getItem(LORE_KEY);
    if (!raw) return DEFAULT_CRYPTONIA_LORE;
    const parsed = JSON.parse(raw) as CryptoniaLoreConfig;
    if (!parsed || !Array.isArray(parsed.prologueParagraphs)) {
      return DEFAULT_CRYPTONIA_LORE;
    }
    return parsed;
  } catch {
    return DEFAULT_CRYPTONIA_LORE;
  }
}

export function resetCustomLore(): void {
  try {
    localStorage.removeItem(LORE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function loadSoundPreference(): boolean {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function saveSoundPreference(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, String(enabled));
  } catch {
    // Ignore storage errors
  }
}
