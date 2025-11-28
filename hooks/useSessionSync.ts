import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export function useSessionSync(sessionId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const sessionRef = ref(db, `sessions/${sessionId}`);

    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const val = snapshot.val();
      setData(val);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  return { data, loading };
}
