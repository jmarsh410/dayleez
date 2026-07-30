"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalSession } from "@/lib/dal";
import type { GameStatus, Grid, Shape } from "./game-logic";

export async function loadGameForDate(date: Date): Promise<{
  grid: Grid;
  status: GameStatus;
  shapeGuesses: Partial<Record<Shape, string>> | null;
} | null> {
  const session = await getOptionalSession();
  if (!session) return null;

  const game = await prisma.digoutGame.findUnique({
    where: {
      userId_date: { userId: session.user.id, date },
    },
  });

  if (!game) return null;

  return {
    grid: game.grid as unknown as Grid,
    status: game.status as GameStatus,
    shapeGuesses: game.shapeGuesses as Partial<Record<Shape, string>> | null,
  };
}

export async function saveGameForDate(
  grid: Grid,
  status: GameStatus,
  date: Date,
  shapeGuesses: Partial<Record<Shape, string>>,
): Promise<void> {
  const session = await getOptionalSession();
  if (!session) return;

  await prisma.digoutGame.upsert({
    where: {
      userId_date: { userId: session.user.id, date },
    },
    create: {
      userId: session.user.id,
      date,
      grid: grid as unknown as object,
      status,
      shapeGuesses: shapeGuesses as unknown as object,
    },
    update: {
      grid: grid as unknown as object,
      status,
      shapeGuesses: shapeGuesses as unknown as object,
    },
  });
}
