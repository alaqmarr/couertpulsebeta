"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";

export interface LiveMatchData {
  teamAScore: number;
  teamBScore: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  completedAt?: string | null;
  lastUpdate?: number;
}

export function useLiveMatch(matchId: string, initialData?: LiveMatchData) {
  const [data, setData] = useState<LiveMatchData | undefined>(initialData);

  useEffect(() => {
    if (!matchId) return;

    const matchRef = ref(db, `matches/${matchId}`);

    const unsubscribe = onValue(matchRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setData(val);
      }
    });

    return () => {
      off(matchRef);
    };
  }, [matchId]);

  return data;
}
