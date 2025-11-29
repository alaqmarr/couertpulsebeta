"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface QRCodeGeneratorProps {
    value: string;
    size?: number;
    label?: string;
}

export function QRCodeGenerator({
    value,
    size = 200,
    label,
}: QRCodeGeneratorProps) {
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!value) return;

        QRCode.toDataURL(
            value,
            {
                width: size,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#ffffff",
                },
            },
            (err, url) => {
                if (err) {
                    console.error("Error generating QR code:", err);
                    setError("Failed to generate QR code");
                } else {
                    setDataUrl(url);
                }
            }
        );
    }, [value, size]);

    if (error) {
        return (
            <Card className="flex items-center justify-center bg-destructive/10 text-destructive p-4 h-full min-h-[200px]">
                {error}
            </Card>
        );
    }

    if (!dataUrl) {
        return (
            <Card className="flex items-center justify-center p-4 h-full min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-2 rounded-lg shadow-sm">
                <img
                    src={dataUrl}
                    alt={`QR Code for ${label || value}`}
                    width={size}
                    height={size}
                    className="block"
                />
            </div>
            {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
        </div>
    );
}
