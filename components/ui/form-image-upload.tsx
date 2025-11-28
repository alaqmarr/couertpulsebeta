"use client";

import { useState } from "react";
import { ImageUpload } from "./image-upload";

interface FormImageUploadProps {
    name: string;
    defaultValue?: string;
    maxFiles?: number;
}

export function FormImageUpload({
    name,
    defaultValue = "",
    maxFiles = 1
}: FormImageUploadProps) {
    const [value, setValue] = useState<string[]>(defaultValue ? [defaultValue] : []);

    const onChange = (url: string) => {
        setValue([url]);
    };

    const onRemove = (url: string) => {
        setValue(value.filter((current) => current !== url));
    };

    return (
        <>
            <ImageUpload
                value={value}
                onChange={onChange}
                onRemove={onRemove}
                maxFiles={maxFiles}
            />
            <input type="hidden" name={name} value={value[0] || ""} />
        </>
    );
}
