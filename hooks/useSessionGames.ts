"use client";

import { useEffect, useState } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export interface Game {
  id: string;
  slug: string;
  sessionId: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
  teamAScore: number;
  teamBScore: number;
  winner: string | null;
}

export function useSessionGames(sessionId: string, initialGames: Game[] = []) {
  const [games, setGames] = useState<Game[]>(initialGames);

  useEffect(() => {
    if (!sessionId) return;

    const gamesRef = ref(rtdb, `sessions/${sessionId}/games`);

    const unsubscribe = onValue(gamesRef, (snapshot) => {
      const data = snapshot.val();
      const firebaseGames = data ? (Object.values(data) as Game[]) : [];

      // Map Firebase games by ID for easy lookup
      // Ensure sessionId is present in real-time data
      const firebaseGamesMap = new Map(
        firebaseGames.map((g) => [g.id, { ...g, sessionId }])
      );

      // Start with initialGames (Postgres data)
      const mergedGamesMap = new Map(initialGames.map((g) => [g.id, g]));

      // Merge Firebase data:
      // 1. Update existing games with live data
      // 2. Add new games that are only in Firebase
      firebaseGamesMap.forEach((game, id) => {
        mergedGamesMap.set(id, game);
      });

      // Convert back to array
      // Sort by creation time or some other metric if needed.
      // For now, we rely on the order they were added or just return them.
      // ManageGames reverses the array anyway.
      setGames(Array.from(mergedGamesMap.values()));
    });

    return () => unsubscribe();
  }, [sessionId]);

  return { games };
}
