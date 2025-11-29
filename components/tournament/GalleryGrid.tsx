"use client";

import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

interface GalleryGridProps {
    images: string[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
    if (images.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No photos yet. Be the first to upload!
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((src, index) => (
                <Dialog key={index}>
                    <DialogTrigger asChild>
                        <Card className="overflow-hidden cursor-pointer hover:opacity-90 transition-opacity aspect-square relative group">
                            <Image
                                src={src}
                                alt={`Gallery image ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                        <div className="relative aspect-video w-full">
                            <Image
                                src={src}
                                alt={`Gallery image ${index + 1}`}
                                fill
                                className="object-contain"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    );
}
