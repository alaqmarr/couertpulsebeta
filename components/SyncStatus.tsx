"use client";

import { useEffect, useState } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Database } from "lucide-react";
import { checkDbConnection } from "@/app/team/[slug]/team-actions.server";

export function SyncStatus() {
    const [firebaseConnected, setFirebaseConnected] = useState(false);
    const [dbConnected, setDbConnected] = useState(false);

    useEffect(() => {
        // Firebase Connection
        const connectedRef = ref(rtdb, ".info/connected");
        const unsubscribe = onValue(connectedRef, (snap) => {
            setFirebaseConnected(snap.val() === true);
        });

        // Database Connection (Poll every 30s)
        const checkDb = async () => {
            const isConnected = await checkDbConnection();
            setDbConnected(isConnected);
        };

        checkDb(); // Initial check
        const interval = setInterval(checkDb, 30000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="flex items-center gap-2">
            {/* Firebase Status */}
            <div
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border",
                    firebaseConnected
                        ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                        : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                )}
            >
                <div className="relative flex h-2 w-2">
                    {firebaseConnected && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    )}
                    <span
                        className={cn(
                            "relative inline-flex rounded-full h-2 w-2",
                            firebaseConnected ? "bg-green-500" : "bg-red-500"
                        )}
                    ></span>
                </div>
                <span className="flex items-center gap-1.5">
                    {firebaseConnected ? (
                        <>
                            <Wifi size={12} />
                            <span className="hidden sm:inline">Live Sync</span>
                        </>
                    ) : (
                        <>
                            <WifiOff size={12} />
                            <span className="hidden sm:inline">Offline</span>
                        </>
                    )}
                </span>
            </div>

            {/* Database Status */}
            <div
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border",
                    dbConnected
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                        : "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
                )}
            >
                <div className="relative flex h-2 w-2">
                    {dbConnected && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    )}
                    <span
                        className={cn(
                            "relative inline-flex rounded-full h-2 w-2",
                            dbConnected ? "bg-blue-500" : "bg-orange-500"
                        )}
                    ></span>
                </div>
                <span className="flex items-center gap-1.5">
                    <Database size={12} />
                    <span className="hidden sm:inline">{dbConnected ? "DB Connected" : "DB Issue"}</span>
                </span>
            </div>
        </div>
    );
}
