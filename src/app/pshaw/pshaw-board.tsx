"use client";

import { useEffect, useState } from "react";
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

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const TILE_STATE_CLASSES: Record<LetterState, string> = {
  correct: "bg-green-600 border-green-600 text-white",
  present: "bg-yellow-500 border-yellow-500 text-white",
  absent: "bg-foreground/40 border-foreground/40 text-white",
};

const KEY_STATE_CLASSES: Record<LetterState, string> = {
  correct: "bg-green-600 text-white",
  present: "bg-yellow-500 text-white",
  absent: "bg-foreground/40 text-white",
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
      <h1 className="text-xl font-semibold">Pshaw</h1>
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
            <div key={r} className="flex gap-1">
              {Array.from({ length: WORD_LENGTH }, (_, c) => {
                const letter = submittedGuess
                  ? submittedGuess[c]
                  : isCurrentRow
                    ? currentGuess[c]
                    : undefined;
                const state = states?.[c];
                const stateClass = state
                  ? TILE_STATE_CLASSES[state]
                  : "border-foreground/20";

                return (
                  <div
                    key={c}
                    data-testid={`tile-${r}-${c}`}
                    aria-label={
                      letter ? `${letter}${state ? ` - ${state}` : ""}` : "Empty tile"
                    }
                    className={`flex h-12 w-12 items-center justify-center border-2 text-lg font-bold uppercase ${stateClass}`}
                  >
                    {letter ?? ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map((key) => {
              if (key === "ENTER") {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={submitGuess}
                    disabled={status !== "playing"}
                    className="rounded bg-foreground/10 px-3 py-2 text-xs font-semibold disabled:opacity-50"
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
                    className="rounded bg-foreground/10 px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    ⌫
                  </button>
                );
              }
              const state = letterStates.get(key);
              return (
                <button
                  key={key}
                  type="button"
                  data-testid={`key-${key}`}
                  data-state={state ?? "unused"}
                  onClick={() => typeLetter(key)}
                  disabled={status !== "playing"}
                  className={`h-10 w-8 rounded text-sm font-semibold disabled:opacity-50 ${
                    state ? KEY_STATE_CLASSES[state] : "bg-foreground/10"
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
