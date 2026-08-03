export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

// Real dictionary sound-words plus well-known, documented comic-book sound
// effects (SNIKT, THWIP, etc.). Every entry is exactly WORD_LENGTH letters
// and used both as the daily-answer pool and the valid-guess dictionary.
export const ONOMATOPOEIA_WORDS = [
  "ACHOO", "BELCH", "BLARE", "BLAST", "BLEAT", "BLOOP", "BOING", "CHEEP",
  "CHIME", "CHINK", "CHIRP", "CHIRR", "CHOMP", "CHUFF", "CLACK", "CLANG",
  "CLANK", "CLASH", "CLICK", "CLINK", "CLOMP", "CLONK", "CLUCK", "CLUNK",
  "COUGH", "CRACK", "CRASH", "CREAK", "CROAK", "DRONE", "FLICK", "GNASH",
  "GRIND", "GROAN", "GROWL", "GRUNT", "KAPOW", "KNELL", "KNOCK", "MUNCH",
  "NEIGH", "PLINK", "PLONK", "PLUNK", "QUACK", "SCUFF", "SHUSH", "SLASH",
  "SLOSH", "SLURP", "SMACK", "SMASH", "SNARL", "SNIFF", "SNORE", "SNORT",
  "SPLAT", "STOMP", "SWASH", "SWISH", "THROB", "THUMP", "THUNK", "THWAP",
  "TROMP", "TWANG", "TWEET", "VROOM", "WHACK", "WHIFF", "WHINE", "WHIRR",
  "WHISH", "WHIZZ", "WHOMP", "WHUMP",
  "THWIP", "SNIKT", "THOOM", "VWOOP", "FWOOM", "ZORCH", "BAMPH", "KRAKK",
  "KLANK", "KRASH", "KLONK", "KLUNK", "DOINK", "BOINK", "ZOWIE", "ZOWEE",
  "BRAAP", "GLOOP", "PLOOP", "BZZZT", "VOOMP", "BLURG", "BLARG", "GRAWR",
  "YAHOO", "YIPEE",
] as const;

const WORD_SET = new Set<string>(ONOMATOPOEIA_WORDS);

export type LetterState = "correct" | "present" | "absent";
export type GameStatus = "playing" | "won" | "lost";

export function isValidWord(word: string): boolean {
  return WORD_SET.has(word.toUpperCase());
}

// Standard two-pass Wordle scoring: exact matches are claimed first, then
// remaining letters are matched against what's left of the answer so
// duplicate letters in the guess don't over-count as "present".
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const g = guess.toUpperCase().split("");
  const a = answer.toUpperCase().split("");
  const result: LetterState[] = new Array(g.length).fill("absent");
  const remaining = new Map<string, number>();

  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) {
      result[i] = "correct";
    } else {
      remaining.set(a[i], (remaining.get(a[i]) ?? 0) + 1);
    }
  }

  for (let i = 0; i < g.length; i++) {
    if (result[i] === "correct") continue;
    const count = remaining.get(g[i]) ?? 0;
    if (count > 0) {
      result[i] = "present";
      remaining.set(g[i], count - 1);
    }
  }

  return result;
}

export function checkWin(guess: string, answer: string): boolean {
  return guess.toUpperCase() === answer.toUpperCase();
}
