"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import type { GameStatus, Grid } from "./game-logic";

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function loadTodaysGame(): Promise<{
  grid: Grid;
  status: GameStatus;
} | null> {
  const session = await verifySession();

  const game = await prisma.minerGame.findUnique({
    where: {
      userId_date: { userId: session.user.id, date: startOfToday() },
    },
  });

  if (!game) return null;

  return { grid: game.grid as unknown as Grid, status: game.status as GameStatus };
}

export async function saveGameForDate(
  grid: Grid,
  status: GameStatus,
  date: Date,
): Promise<void> {
  const session = await verifySession();

  await prisma.minerGame.upsert({
    where: {
      userId_date: { userId: session.user.id, date },
    },
    create: {
      userId: session.user.id,
      date,
      grid: grid as unknown as object,
      status,
    },
    update: {
      grid: grid as unknown as object,
      status,
    },
  });
}
