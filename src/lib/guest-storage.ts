export function guestStorageKey(game: string, dateString: string): string {
  return `${game}-${dateString}`;
}

export function loadGuestState<T>(game: string, dateString: string): T | null {
  try {
    const raw = localStorage.getItem(guestStorageKey(game, dateString));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveGuestState<T>(game: string, dateString: string, value: T): void {
  try {
    localStorage.setItem(guestStorageKey(game, dateString), JSON.stringify(value));
  } catch {
    // localStorage unavailable (private browsing, quota) — best-effort, same as saveGameForDate's persist() failure handling
  }
}
