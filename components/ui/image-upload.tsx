"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash, Loader2 } from "lucide-react";
import Image from "next/image";
import { getCloudinarySignature } from "@/app/actions/upload-action";
import toast from "react-hot-toast";

interface ImageUploadProps {
    disabled?: boolean;
    onChange: (value: string) => void;
    onRemove: (value: string) => void;
    value: string[];
    maxFiles?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    disabled,
    onChange,
    onRemove,
    value,
    maxFiles = 1
}) => {
    const [isUploading, setIsUploading] = useState(false);

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);

            // 1. Get signature from server
            const { timestamp, signature, apiKey } = await getCloudinarySignature();

            // 2. Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", apiKey || "");
            formData.append("timestamp", timestamp.toString());
            formData.append("signature", signature);

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || "Upload failed");
            }

            onChange(data.secure_url);
            toast.success("Image uploaded");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Something went wrong");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-4">
                {value.map((url) => (
                    <div key={url} className="relative w-[200px] h-[200px] rounded-md overflow-hidden">
                        <div className="z-10 absolute top-2 right-2">
                            <Button type="button" onClick={() => onRemove(url)} variant="destructive" size="icon">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image
                            fill
                            className="object-cover"
                            alt="Image"
                            src={url}
                        />
                    </div>
                ))}
            </div>
            {value.length < maxFiles && (
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        disabled={disabled || isUploading}
                        variant="secondary"
                        onClick={() => document.getElementById("image-upload-input")?.click()}
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <ImagePlus className="h-4 w-4 mr-2" />
                        )}
                        Upload an Image
                    </Button>
                    <input
                        id="image-upload-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onUpload}
                        disabled={disabled || isUploading}
                    />
                </div>
            )}
        </div>
    );
};
