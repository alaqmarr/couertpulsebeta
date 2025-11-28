"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendAdminOtp, verifyAdminOtp } from "@/app/admin/actions";
import { toast } from "react-hot-toast";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface OtpVerificationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    email: string;
}

export function OtpVerificationModal({ isOpen, onOpenChange, email }: OtpVerificationModalProps) {
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const router = useRouter();

    const handleVerify = async () => {
        if (!otp || otp.length < 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setIsLoading(true);
        try {
            const result = await verifyAdminOtp(email, otp);
            if (result.success) {
                toast.success("Admin access verified!");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(result.error || "Verification failed");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsSending(true);
        try {
            const result = await sendAdminOtp(email);
            if (result.success) {
                toast.success("OTP sent to your email");
            } else {
                toast.error(result.error || "Failed to send OTP");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-primary">
                        <ShieldCheck className="w-6 h-6" /> Admin Verification
                    </DialogTitle>
                    <DialogDescription>
                        Enter the 6-digit code sent to <strong>{email}</strong> to activate admin privileges.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="otp">One-Time Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="otp"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                                className="pl-9 text-center text-lg tracking-[0.5em] font-mono"
                                maxLength={6}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleResend}
                        disabled={isSending || isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Resend Code
                    </Button>
                    <Button
                        onClick={handleVerify}
                        disabled={isLoading}
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Verify Access
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
