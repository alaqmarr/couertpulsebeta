"use client";

import { useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpVerificationModal } from "./OtpVerificationModal";
import { sendAdminOtp } from "@/app/admin/actions";
import { toast } from "react-hot-toast";

interface AdminActivationBannerProps {
    email: string;
}

export function AdminActivationBanner({ email }: AdminActivationBannerProps) {
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleActivate = async () => {
        setIsLoading(true);
        try {
            const result = await sendAdminOtp(email);
            if (result.success) {
                toast.success("OTP sent to your email");
                setShowModal(true);
            } else {
                toast.error(result.error || "Failed to send OTP");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                        <span className="text-sm font-semibold hidden sm:inline">
                            Admin Access Detected: Activation Required
                        </span>
                        <span className="text-sm font-semibold sm:hidden">
                            Admin Activation Required
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/30"
                        onClick={handleActivate}
                        disabled={isLoading}
                    >
                        {isLoading ? "Sending OTP..." : "Activate Now"}
                    </Button>
                </div>
            </div>

            <OtpVerificationModal
                isOpen={showModal}
                onOpenChange={setShowModal}
                email={email}
            />
        </>
    );
}
