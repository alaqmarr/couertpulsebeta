"use client";

import { useEffect, useState } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, set, update } from "firebase/database";

export interface Participant {
  id: string;
  memberId: string;
  displayName: string;
  isSelected: boolean;
}

export function useSessionParticipants(
  sessionId: string,
  initialData: Participant[] = []
) {
  const [participants, setParticipants] = useState<Participant[]>(initialData);

  useEffect(() => {
    if (!sessionId) return;

    const sessionRef = ref(rtdb, `sessions/${sessionId}/participants`);

    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array
        const participantsArray = Object.values(data) as Participant[];
        setParticipants(participantsArray);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  const toggleAvailability = async (
    memberId: string,
    currentStatus: boolean,
    memberData: any
  ) => {
    // Optimistic update
    const participantRef = ref(
      rtdb,
      `sessions/${sessionId}/participants/${memberId}`
    );

    // If it doesn't exist in Firebase yet (legacy sessions), we might need to create the structure
    // But since we sync on page load, it should be there.

    await update(participantRef, {
      isSelected: !currentStatus,
      memberId,
      displayName: memberData.displayName || "Player",
      // We might want to store more info if needed
    });
  };

  return {
    participants,
    toggleAvailability,
  };
}
