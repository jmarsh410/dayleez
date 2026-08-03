"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalSession } from "@/lib/dal";
import type { GameStatus } from "./game-logic";

export async function loadGameForDate(date: Date): Promise<{
  guesses: string[];
  status: GameStatus;
} | null> {
  const session = await getOptionalSession();
  if (!session) return null;

  const game = await prisma.pshawGame.findUnique({
    where: {
      userId_date: { userId: session.user.id, date },
    },
  });

  if (!game) return null;

  return {
    guesses: game.guesses as unknown as string[],
    status: game.status as GameStatus,
  };
}

export async function saveGameForDate(
  guesses: string[],
  status: GameStatus,
  date: Date,
): Promise<void> {
  const session = await getOptionalSession();
  if (!session) return;

  await prisma.pshawGame.upsert({
    where: {
      userId_date: { userId: session.user.id, date },
    },
    create: {
      userId: session.user.id,
      date,
      guesses: guesses as unknown as object,
      status,
    },
    update: {
      guesses: guesses as unknown as object,
      status,
    },
  });
}
