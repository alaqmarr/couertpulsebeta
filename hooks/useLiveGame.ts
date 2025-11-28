import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, remove } from "firebase/database";

export interface LiveGameData {
  teamAScore: number;
  teamBScore: number;
  status: "LIVE" | "FINAL";
  updatedAt: number;
}

export function useLiveGame(
  sessionId: string,
  gameId: string,
  initialData?: { teamAScore: number; teamBScore: number }
) {
  const [data, setData] = useState<LiveGameData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !sessionId) return;

    const gameRef = ref(db, `sessions/${sessionId}/games/${gameId}`);

    const unsubscribe = onValue(gameRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setData(val);
      } else {
        setData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId, gameId]);

  const updateScore = async (team: "a" | "b", newScore: number) => {
    const gameRef = ref(db, `sessions/${sessionId}/games/${gameId}`);
    const currentScores = data || {
      teamAScore: initialData?.teamAScore ?? 0,
      teamBScore: initialData?.teamBScore ?? 0,
      status: "LIVE",
      updatedAt: Date.now(),
    };

    const fieldToUpdate = team === "a" ? "teamAScore" : "teamBScore";

    await set(gameRef, {
      ...currentScores,
      [fieldToUpdate]: newScore,
      updatedAt: Date.now(),
      status: "LIVE",
    });
  };

  const finalizeGame = async (winner: string) => {
    const gameRef = ref(db, `sessions/${sessionId}/games/${gameId}`);
    const currentScores = data || {
      teamAScore: initialData?.teamAScore ?? 0,
      teamBScore: initialData?.teamBScore ?? 0,
      status: "LIVE",
      updatedAt: Date.now(),
    };

    await set(gameRef, {
      ...currentScores,
      winner,
      status: "FINAL",
      updatedAt: Date.now(),
    });
  };

  const clearGame = async () => {
    const gameRef = ref(db, `sessions/${sessionId}/games/${gameId}`);
    await remove(gameRef);
  };

  return {
    liveData: data,
    loading,
    updateScore,
    finalizeGame,
    clearGame,
  };
}
