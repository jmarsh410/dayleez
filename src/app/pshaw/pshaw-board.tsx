"use client";

import { Fragment, useEffect, useState } from "react";
import { loadGuestState, saveGuestState } from "@/lib/guest-storage";
import {
  MAX_GUESSES,
  WORD_LENGTH,
  checkWin,
  evaluateGuess,
  isValidWord,
  type GameStatus,
  type LetterState,
} from "./game-logic";
import { saveGameForDate } from "./actions";
import { PshawLogo } from "./pshaw-logo";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const TILE_STATE_CLASSES: Record<LetterState, string> = {
  correct: "bg-green-700 border-green-700 text-white",
  present: "bg-yellow-500 border-yellow-500 text-neutral-900",
  absent: "bg-neutral-600 border-neutral-600 text-white",
};

const KEY_STATE_CLASSES: Record<LetterState, string> = {
  correct: "bg-green-700 text-white",
  present: "bg-yellow-500 text-neutral-900",
  absent: "bg-neutral-600 text-white",
};

// Non-color cue for correct/present so state isn't conveyed by color alone
// (a11y.md "Semantic Redundancy"). Absent has no glyph by design: it's the
// muted default state, already distinguished by its own aria-label/text.
const STATE_GLYPHS: Partial<Record<LetterState, string>> = {
  correct: "✓",
  present: "●",
};

function bestState(a: LetterState | undefined, b: LetterState): LetterState {
  if (a === "correct" || b === "correct") return "correct";
  if (a === "present" || b === "present") return "present";
  return "absent";
}

export function PshawBoard({
  answer,
  initialGuesses,
  initialStatus,
  date,
  dateString,
  isLoggedIn,
}: {
  answer: string;
  initialGuesses?: string[];
  initialStatus?: GameStatus;
  date: Date;
  dateString: string;
  isLoggedIn: boolean;
}) {
  const normalizedAnswer = answer.toUpperCase();
  const [guesses, setGuesses] = useState<string[]>(initialGuesses ?? []);
  const [status, setStatus] = useState<GameStatus>(initialStatus ?? "playing");
  const [currentGuess, setCurrentGuess] = useState("");
  const [error, setError] = useState("");

  // localStorage isn't available during SSR, so guest progress can only be
  // restored after mount, not via a lazy useState initializer.
  useEffect(() => {
    if (isLoggedIn) return;
    const saved = loadGuestState<{ guesses: string[]; status: GameStatus }>(
      "pshaw",
      dateString,
    );
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGuesses(saved.guesses);
      setStatus(saved.status);
    }
  }, [isLoggedIn, dateString]);

  function persist(nextGuesses: string[], nextStatus: GameStatus) {
    if (isLoggedIn) {
      saveGameForDate(nextGuesses, nextStatus, date).catch((err) => {
        console.error("Failed to save Pshaw game state", err);
      });
    } else {
      saveGuestState("pshaw", dateString, { guesses: nextGuesses, status: nextStatus });
    }
  }

  function typeLetter(letter: string) {
    if (status !== "playing") return;
    setError("");
    setCurrentGuess((prev) => (prev.length < WORD_LENGTH ? prev + letter : prev));
  }

  function deleteLetter() {
    if (status !== "playing") return;
    setError("");
    setCurrentGuess((prev) => prev.slice(0, -1));
  }

  function submitGuess() {
    if (status !== "playing") return;
    if (currentGuess.length !== WORD_LENGTH) {
      setError("Not enough letters.");
      return;
    }
    if (!isValidWord(currentGuess)) {
      setError("Not a valid onomatopoeia.");
      return;
    }

    const nextGuesses = [...guesses, currentGuess];
    const won = checkWin(currentGuess, normalizedAnswer);
    const nextStatus: GameStatus = won
      ? "won"
      : nextGuesses.length >= MAX_GUESSES
        ? "lost"
        : "playing";

    setError("");
    setGuesses(nextGuesses);
    setCurrentGuess("");
    setStatus(nextStatus);
    persist(nextGuesses, nextStatus);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        submitGuess();
      } else if (e.key === "Backspace") {
        deleteLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        typeLetter(e.key.toUpperCase());
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const letterStates = new Map<string, LetterState>();
  for (const guess of guesses) {
    const states = evaluateGuess(guess, normalizedAnswer);
    for (let i = 0; i < guess.length; i++) {
      letterStates.set(guess[i], bestState(letterStates.get(guess[i]), states[i]));
    }
  }

  const statusText =
    status === "won"
      ? "You win."
      : status === "lost"
        ? `Out of guesses. The word was ${normalizedAnswer}.`
        : `Guess ${guesses.length + 1} of ${MAX_GUESSES}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <PshawLogo />
      <h1 className="sr-only">Pshaw</h1>
      <p className="text-sm text-foreground/70">Guess the 5-letter onomatopoeia.</p>

      <div aria-live="polite" className="text-sm font-medium">
        {error || statusText}
      </div>

      <div className="flex flex-col gap-1">
        {Array.from({ length: MAX_GUESSES }, (_, r) => {
          const submittedGuess = guesses[r];
          const isCurrentRow = r === guesses.length && status === "playing";
          const states = submittedGuess
            ? evaluateGuess(submittedGuess, normalizedAnswer)
            : undefined;

          return (
            <div
              key={r}
              role="group"
              aria-label={`Guess ${r + 1} of ${MAX_GUESSES}`}
              className="flex gap-1"
            >
              {Array.from({ length: WORD_LENGTH }, (_, c) => {
                const letter = submittedGuess
                  ? submittedGuess[c]
                  : isCurrentRow
                    ? currentGuess[c]
                    : undefined;
                const state = states?.[c];
                const stateClass = state
                  ? TILE_STATE_CLASSES[state]
                  : "border-foreground/60";
                const glyph = state ? STATE_GLYPHS[state] : undefined;

                return (
                  <div
                    key={c}
                    data-testid={`tile-${r}-${c}`}
                    aria-label={
                      letter ? `${letter}${state ? ` - ${state}` : ""}` : "Empty tile"
                    }
                    className={`relative flex h-12 w-12 items-center justify-center border-2 text-lg font-bold uppercase ${stateClass}`}
                  >
                    {letter ?? ""}
                    {glyph && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 left-0.5 text-[10px] leading-none"
                      >
                        {glyph}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-0.5 sm:gap-1.5">
            {row.map((key) => {
              if (key === "ENTER") {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={submitGuess}
                    disabled={status !== "playing"}
                    className="rounded bg-foreground/10 px-2 py-1.5 text-[10px] font-semibold disabled:opacity-50 sm:px-4 sm:py-3 sm:text-sm"
                  >
                    Enter
                  </button>
                );
              }
              if (key === "BACKSPACE") {
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label="Backspace"
                    onClick={deleteLetter}
                    disabled={status !== "playing"}
                    className="rounded bg-foreground/10 px-2 py-1.5 text-[10px] font-semibold disabled:opacity-50 sm:px-4 sm:py-3 sm:text-sm"
                  >
                    ⌫
                  </button>
                );
              }
              const state = letterStates.get(key);
              const glyph = state ? STATE_GLYPHS[state] : undefined;
              // A state suffix goes in an aria-describedby'd sibling, not
              // aria-label: aria-label would replace the button's accessible
              // name (just the letter), breaking name-based lookups (by
              // players and tests alike) once a key has been guessed.
              const descId = `key-state-${key}`;
              return (
                <Fragment key={key}>
                  <button
                    type="button"
                    data-testid={`key-${key}`}
                    data-state={state ?? "unused"}
                    aria-describedby={state ? descId : undefined}
                    onClick={() => typeLetter(key)}
                    disabled={status !== "playing"}
                    className={`relative h-9 w-7 rounded text-sm font-semibold disabled:opacity-50 sm:h-12 sm:w-11 ${
                      state ? KEY_STATE_CLASSES[state] : "bg-foreground/10"
                    }`}
                  >
                    {key}
                    {glyph && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0 left-0.5 text-[8px] leading-none"
                      >
                        {glyph}
                      </span>
                    )}
                  </button>
                  {state && (
                    <span id={descId} className="sr-only">
                      {state}
                    </span>
                  )}
                </Fragment>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
