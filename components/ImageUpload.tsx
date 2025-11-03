"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";

const ACCEPTED_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpeg", ".jpg"],
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function formatBytes(size: number): string {
  if (size === 0) return "0 B";
  const units = ["B", "KB", "MB"];
  const base = Math.floor(Math.log(size) / Math.log(1024));
  const value = size / 1024 ** base;
  return `${value.toFixed(base === 0 ? 0 : 1)} ${units[base]}`;
}

export interface ImageUploadResult {
  base64: string;
  file: File;
  mimeType: string;
}

interface ImageUploadProps {
  onImageReady: (result: ImageUploadResult) => void | Promise<void>;
  disabled?: boolean;
  onClear?: () => void;
}

export function ImageUpload({ onImageReady, disabled, onClear }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetSelection = useCallback(() => {
    setPreview(null);
    setFileMeta(null);
    setError(null);
    onClear?.();
  }, [onClear]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
        setError("Only PNG and JPEG screenshots are supported");
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setError("File exceeds 10MB limit");
        return;
      }

      try {
        const result = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            if (typeof reader.result !== "string") {
              reject(new Error("Unable to read file"));
              return;
            }
            resolve(reader.result);
          };

          reader.onerror = () => {
            reject(new Error("Failed to read file. Please try again."));
          };

          reader.readAsDataURL(file);
        });

        const base64 = result.includes(",") ? result.split(",")[1] : result;

        if (!base64) {
          setError("Could not convert image to base64");
          return;
        }

        setPreview(result);
        setFileMeta({ name: file.name, size: file.size });
        setError(null);

        await onImageReady({
          base64,
          file,
          mimeType: file.type,
        });
      } catch (readError) {
        console.error("Image selection failed", readError);
        setError(readError instanceof Error ? readError.message : "Unknown read error");
      }
    },
    [onImageReady],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return;
      }
      void handleFile(acceptedFiles[0]);
    },
    [handleFile],
  );

  const onDropRejected = useCallback(() => {
    setError("Please upload a PNG or JPEG file up to 10MB");
  }, []);

  const dropzone = useDropzone({
    onDrop,
    onDropRejected,
    disabled,
    multiple: false,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
  });

  const helperText = useMemo(() => {
    if (disabled) {
      return "Processing in progress...";
    }
    if (dropzone.isDragActive) {
      return "Drop the screenshot here";
    }
    return "Drag & drop a WhatsApp screenshot, or click to select";
  }, [disabled, dropzone.isDragActive]);

  return (
    <section className="w-full">
      <div
        {...dropzone.getRootProps({
          className:
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-slate-400 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        })}
      >
        <input {...dropzone.getInputProps()} />
        <p className="text-base font-medium text-slate-700">{helperText}</p>
        <p className="text-sm text-slate-500">PNG or JPEG, up to 10MB</p>
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-rose-100 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {preview && fileMeta && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">{fileMeta.name}</p>
              <p className="text-sm text-slate-500">{formatBytes(fileMeta.size)}</p>
            </div>
            <button
              type="button"
              onClick={resetSelection}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Selected screenshot preview" className="h-64 w-full object-cover" />
          </div>
        </div>
      )}
    </section>
  );
}
