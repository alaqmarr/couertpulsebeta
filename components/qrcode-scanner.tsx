"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface QRCodeScannerProps {
    onScan: (decodedText: string) => void;
    onError?: (error: any) => void;
    fps?: number;
    qrbox?: number;
}

export function QRCodeScanner({
    onScan,
    onError,
    fps = 10,
    qrbox = 250,
}: QRCodeScannerProps) {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps, qrbox },
      /* verbose= */ false
        );
        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                setScanResult(decodedText);
                onScan(decodedText);
                // Optional: Stop scanning after success? 
                // scanner.clear(); 
            },
            (errorMessage) => {
                if (onError) onError(errorMessage);
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error) => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            }
        };
    }, [onScan, onError, fps, qrbox]);

    const resetScan = () => {
        setScanResult(null);
        // Re-render logic might be needed if we cleared it
        window.location.reload(); // Simple reset for now, or implement cleaner re-init
    };

    return (
        <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
            <Card className="p-4 overflow-hidden">
                {!scanResult ? (
                    <div id="reader" className="w-full" />
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">Scan Successful</h3>
                            <p className="text-sm text-muted-foreground break-all px-4">
                                {scanResult}
                            </p>
                        </div>
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Scan Another
                        </Button>
                    </div>
                )}
            </Card>

            <div className="text-center text-sm text-muted-foreground">
                <p>Align the QR code within the frame to scan.</p>
            </div>
        </div>
    );
}
