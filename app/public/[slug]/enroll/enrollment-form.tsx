"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormImageUpload } from "@/components/ui/form-image-upload";
import { enrollInTournamentAction } from "../../../tournament/tournament.server";
import { useFormStatus } from "react-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Submit Enrollment
        </Button>
    );
}

export default function EnrollmentPage({
    params,
    tournament, // Passed from server component wrapper
}: {
    params: { slug: string };
    tournament: any;
}) {
    const [paymentMode, setPaymentMode] = useState<"ONLINE" | "CASH">("ONLINE");

    async function clientAction(formData: FormData) {
        try {
            const result = await enrollInTournamentAction(formData);
            if (result.success) {
                toast.success("Enrollment submitted successfully!");
                // Ideally redirect to a success page or show a success state
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
            {tournament.bannerUrl && (
                <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden mb-8">
                    <img src={tournament.bannerUrl} alt={tournament.name} className="w-full h-full object-cover" />
                </div>
            )}

            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{tournament.name} Enrollment</h1>
                <p className="text-muted-foreground">Join the tournament and compete for glory!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* INFO SIDEBAR */}
                <div className="md:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Tournament Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <span className="font-semibold block">Entry Fee</span>
                                <span className="text-xl font-bold text-primary">₹{tournament.entryFee}</span>
                            </div>
                            {tournament.contactPhone && (
                                <div>
                                    <span className="font-semibold block">Contact</span>
                                    <span>{tournament.contactPhone}</span>
                                </div>
                            )}
                            {tournament.rules && (
                                <div>
                                    <span className="font-semibold block">Rules</span>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{tournament.rules}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ENROLLMENT FORM */}
                <div className="md:col-span-2">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Registration Form</CardTitle>
                            <CardDescription>Fill in your details to register.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={clientAction} className="space-y-6">
                                <input type="hidden" name="slug" value={params.slug} />

                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" required placeholder="John Doe" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" name="email" type="email" required placeholder="john@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile">Mobile Number</Label>
                                        <Input id="mobile" name="mobile" type="tel" required placeholder="+91 9876543210" />
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <Label className="text-base">Payment Mode</Label>
                                    <RadioGroup
                                        name="paymentMode"
                                        defaultValue="ONLINE"
                                        onValueChange={(v) => setPaymentMode(v as "ONLINE" | "CASH")}
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="ONLINE" id="online" />
                                            <Label htmlFor="online">Online Payment</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="CASH" id="cash" />
                                            <Label htmlFor="cash">Cash</Label>
                                        </div>
                                    </RadioGroup>

                                    {paymentMode === "ONLINE" ? (
                                        <div className="bg-yellow-500/10 p-4 rounded-lg space-y-4 border border-yellow-500/20">
                                            <div className="flex flex-col md:flex-row gap-4 items-start">
                                                {(tournament.paymentUpi || tournament.paymentQrCode) && (
                                                    <div className="w-40 h-40 relative bg-white p-2 rounded-md shrink-0 border border-border">
                                                        <img
                                                            src={
                                                                tournament.paymentUpi
                                                                    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                                                        `upi://pay?pa=${tournament.paymentUpi}&pn=${tournament.name}&am=${tournament.entryFee}&tn=Payment for ${tournament.name} Entry&cu=INR`
                                                                    )}`
                                                                    : tournament.paymentQrCode
                                                            }
                                                            alt="Payment QR Code"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                )}
                                                <div className="space-y-1 text-sm flex-1">
                                                    <p className="font-semibold">Scan QR to Pay</p>
                                                    {tournament.paymentUpi && (
                                                        <>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-muted-foreground">UPI ID:</span>
                                                                <code className="bg-background px-2 py-1 rounded border font-mono select-all">
                                                                    {tournament.paymentUpi}
                                                                </code>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="default"
                                                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                                                                onClick={() => {
                                                                    window.location.href = `upi://pay?pa=${tournament.paymentUpi}&pn=${encodeURIComponent(tournament.name)}&am=${tournament.entryFee}&tn=${encodeURIComponent(`Payment for ${tournament.name}`)}&cu=INR`;
                                                                }}
                                                            >
                                                                Pay with UPI App
                                                            </Button>
                                                        </>
                                                    )}
                                                    <p className="text-muted-foreground text-xs mt-2">
                                                        Please make a payment of <b className="text-primary">₹{tournament.entryFee}</b> and upload the screenshot below.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Payment Screenshot</Label>
                                                <FormImageUpload name="paymentScreenshotUrl" />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="transactionId">Transaction ID / UTR (Optional)</Label>
                                                <Input id="transactionId" name="transactionId" placeholder="Enter transaction ID if available" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20 flex flex-col gap-3">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                                <div className="text-sm">
                                                    <p className="font-semibold text-yellow-600">Pay at Venue</p>
                                                    <p className="text-muted-foreground">
                                                        Your enrollment will be pending approval until the entry fee is collected.
                                                    </p>
                                                </div>
                                            </div>
                                            {(tournament.cashContactName || tournament.cashContactNumber) && (
                                                <div className="ml-8 text-sm bg-yellow-500/5 p-3 rounded border border-yellow-500/10">
                                                    <p className="font-semibold text-yellow-700 mb-1">Please contact for payment:</p>
                                                    {tournament.cashContactName && <p>Name: <b>{tournament.cashContactName}</b></p>}
                                                    {tournament.cashContactNumber && <p>Number: <b>{tournament.cashContactNumber}</b></p>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <SubmitButton />
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
