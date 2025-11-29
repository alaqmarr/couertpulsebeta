"use client";

import { useState } from "react";
import { QRCodeScanner } from "@/components/qrcode-scanner";
import { checkInPlayerAction } from "../actions/check-in-actions.server";
import { Card } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface CheckInScannerProps {
    tournamentId: string;
}

export function CheckInScanner({ tournamentId }: CheckInScannerProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<{
        success: boolean;
        message?: string;
        player?: any;
        error?: string;
    } | null>(null);

    const handleScan = async (decodedText: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setLastResult(null);

        try {
            // Expected format: tournamentId:userId
            const [scannedTournamentId, userId] = decodedText.split(":");

            if (scannedTournamentId !== tournamentId) {
                throw new Error("Invalid QR Code: Wrong tournament");
            }

            if (!userId) {
                throw new Error("Invalid QR Code: Missing user ID");
            }

            const result = await checkInPlayerAction(tournamentId, userId);
            setLastResult(result);

            if (result.success) {
                toast.success(result.message || "Check-in successful");
                // Play success sound?
            } else {
                toast.error(result.error || "Check-in failed");
            }
        } catch (error: any) {
            console.error("Scan processing error:", error);
            setLastResult({ success: false, error: error.message });
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <QRCodeScanner onScan={handleScan} />

            {isProcessing && (
                <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}

            {lastResult && (
                <Card className={`p-4 border-l-4 ${lastResult.success ? "border-l-green-500" : "border-l-destructive"}`}>
                    <div className="flex items-start gap-3">
                        {lastResult.success ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        ) : (
                            <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                        )}
                        <div>
                            <h3 className="font-semibold">
                                {lastResult.success ? "Success" : "Error"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {lastResult.message || lastResult.error}
                            </p>
                            {lastResult.player && (
                                <div className="mt-2 text-sm bg-secondary/50 p-2 rounded">
                                    <p><span className="font-medium">Player:</span> {lastResult.player.name}</p>
                                    <p><span className="font-medium">Team:</span> {lastResult.player.team?.name || "No Team"}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
