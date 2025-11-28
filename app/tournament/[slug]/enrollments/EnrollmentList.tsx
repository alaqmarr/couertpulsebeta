"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, Eye, CheckSquare, Square, Trash2 } from "lucide-react";
import { approveEnrollmentAction, bulkApproveEnrollmentsAction, bulkRejectEnrollmentsAction } from "../../tournament.server";
import { toast } from "react-hot-toast";

interface Enrollment {
    id: string;
    name: string;
    email: string;
    mobile: string;
    paymentMode: string;
    transactionId?: string | null;
    paymentScreenshotUrl?: string | null;
    status: string;
    createdAt: Date;
}

interface EnrollmentListProps {
    slug: string;
    pendingEnrollments: Enrollment[];
    approvedEnrollments: Enrollment[];
    rejectedEnrollments: Enrollment[];
}

export function EnrollmentList({ slug, pendingEnrollments, approvedEnrollments, rejectedEnrollments }: EnrollmentListProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === pendingEnrollments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingEnrollments.map(e => e.id));
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        setIsBulkActionLoading(true);
        const formData = new FormData();
        formData.append("slug", slug);
        formData.append("enrollmentIds", selectedIds.join(","));

        try {
            await bulkApproveEnrollmentsAction(formData);
            toast.success(`Approved ${selectedIds.length} enrollments`);
            setSelectedIds([]);
        } catch (error) {
            toast.error("Failed to approve enrollments");
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    const handleBulkReject = async () => {
        if (selectedIds.length === 0) return;
        setIsBulkActionLoading(true);
        const formData = new FormData();
        formData.append("slug", slug);
        formData.append("enrollmentIds", selectedIds.join(","));
        formData.append("reason", rejectReason);

        try {
            await bulkRejectEnrollmentsAction(formData);
            toast.success(`Rejected ${selectedIds.length} enrollments`);
            setSelectedIds([]);
            setShowRejectDialog(false);
            setRejectReason("");
        } catch (error) {
            toast.error("Failed to reject enrollments");
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    const EnrollmentCard = ({ enrollment, showCheckbox = false }: { enrollment: Enrollment, showCheckbox?: boolean }) => (
        <Card className="glass-card mb-4">
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    {showCheckbox && (
                        <Checkbox
                            checked={selectedIds.includes(enrollment.id)}
                            onCheckedChange={() => toggleSelection(enrollment.id)}
                            className="mt-1"
                        />
                    )}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{enrollment.name}</h3>
                            <Badge variant={enrollment.paymentMode === "ONLINE" ? "default" : "secondary"}>
                                {enrollment.paymentMode}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            <p>Email: {enrollment.email}</p>
                            <p>Mobile: {enrollment.mobile}</p>
                            {enrollment.transactionId && <p>TxID: {enrollment.transactionId}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {enrollment.paymentScreenshotUrl && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-2" /> Proof
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Payment Proof</DialogTitle>
                                    <DialogDescription>Submitted by {enrollment.name}</DialogDescription>
                                </DialogHeader>
                                <div className="relative aspect-video w-full bg-black/5 rounded-lg overflow-hidden">
                                    <img
                                        src={enrollment.paymentScreenshotUrl}
                                        alt="Payment Proof"
                                        className="object-contain w-full h-full"
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Individual Actions (Only for Pending if not in bulk mode, or always?) */}
                    {/* Let's keep individual actions available even with checkboxes */}
                    {enrollment.status === "PENDING" && (
                        <>
                            <form action={approveEnrollmentAction}>
                                <input type="hidden" name="slug" value={slug} />
                                <input type="hidden" name="enrollmentId" value={enrollment.id} />
                                <input type="hidden" name="action" value="APPROVE" />
                                <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700" disabled={isBulkActionLoading}>
                                    <CheckCircle className="w-4 h-4" />
                                </Button>
                            </form>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={isBulkActionLoading}>
                                        <XCircle className="w-4 h-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject Enrollment</DialogTitle>
                                        <DialogDescription>Provide a reason for rejection.</DialogDescription>
                                    </DialogHeader>
                                    <form action={approveEnrollmentAction} className="space-y-4">
                                        <input type="hidden" name="slug" value={slug} />
                                        <input type="hidden" name="enrollmentId" value={enrollment.id} />
                                        <input type="hidden" name="action" value="REJECT" />
                                        <div className="space-y-2">
                                            <Label>Reason</Label>
                                            <Input name="adminNotes" placeholder="e.g. Invalid payment proof" required />
                                        </div>
                                        <Button type="submit" variant="destructive" className="w-full">
                                            Confirm Rejection
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in">
                    <span className="font-bold">{selectedIds.length} Selected</span>
                    <div className="h-4 w-px bg-background/20" />
                    <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white border-0"
                        onClick={handleBulkApprove}
                        disabled={isBulkActionLoading}
                    >
                        Approve All
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowRejectDialog(true)}
                        disabled={isBulkActionLoading}
                    >
                        Reject All
                    </Button>
                </div>
            )}

            {/* Bulk Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Reject ({selectedIds.length})</DialogTitle>
                        <DialogDescription>Provide a reason for rejecting these enrollments.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Registration closed"
                            />
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleBulkReject}
                            disabled={!rejectReason || isBulkActionLoading}
                        >
                            Confirm Bulk Rejection
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">Pending ({pendingEnrollments.length})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({approvedEnrollments.length})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({rejectedEnrollments.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {pendingEnrollments.length > 0 && (
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <Checkbox
                                checked={selectedIds.length === pendingEnrollments.length && pendingEnrollments.length > 0}
                                onCheckedChange={toggleAll}
                            />
                            <span className="text-sm text-muted-foreground">Select All</span>
                        </div>
                    )}
                    {pendingEnrollments.map(e => (
                        <EnrollmentCard key={e.id} enrollment={e} showCheckbox={true} />
                    ))}
                    {pendingEnrollments.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No pending enrollments.</div>
                    )}
                </TabsContent>

                <TabsContent value="approved" className="space-y-4">
                    {approvedEnrollments.map(e => (
                        <EnrollmentCard key={e.id} enrollment={e} />
                    ))}
                    {approvedEnrollments.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No approved enrollments.</div>
                    )}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4">
                    {rejectedEnrollments.map(e => (
                        <EnrollmentCard key={e.id} enrollment={e} />
                    ))}
                    {rejectedEnrollments.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No rejected enrollments.</div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
