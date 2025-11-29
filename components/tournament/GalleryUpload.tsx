"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { addGalleryImageAction } from "@/app/tournament/[slug]/actions/gallery-actions.server";
import { toast } from "react-hot-toast";

interface GalleryUploadProps {
    tournamentId: string;
    slug: string;
}

export function GalleryUpload({ tournamentId, slug }: GalleryUploadProps) {
    const router = useRouter();

    return (
        <CldUploadWidget
            uploadPreset="courtpulse_gallery" // Make sure this preset exists in Cloudinary
            onSuccess={async (result: any) => {
                if (result.info?.secure_url) {
                    const res = await addGalleryImageAction(tournamentId, result.info.secure_url);
                    if (res.success) {
                        toast.success("Image uploaded!");
                        router.refresh();
                    } else {
                        toast.error("Failed to save image");
                    }
                }
            }}
            options={{
                maxFiles: 5,
                resourceType: "image",
            }}
        >
            {({ open }) => {
                return (
                    <Button onClick={() => open()} variant="outline">
                        <ImagePlus className="w-4 h-4 mr-2" />
                        Upload Photos
                    </Button>
                );
            }}
        </CldUploadWidget>
    );
}
