'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  url: string;
  key: string;
  preview?: string;
}

interface ImageUploadProps {
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  className?: string;
}

const MAX_SIZE_MB = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUpload({
  onChange,
  maxFiles = 8,
  className,
}: ImageUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Upload failed');
    }

    return res.json();
  };

  const processFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const fileArray = Array.from(incoming);
      const newErrors: string[] = [];
      const validFiles: File[] = [];

      for (const file of fileArray) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          newErrors.push(`${file.name}: unsupported file type`);
          continue;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          newErrors.push(`${file.name}: exceeds ${MAX_SIZE_MB}MB limit`);
          continue;
        }
        if (files.length + validFiles.length >= maxFiles) {
          newErrors.push(`Maximum ${maxFiles} images allowed`);
          break;
        }
        validFiles.push(file);
      }

      setErrors(newErrors);

      if (validFiles.length === 0) return;

      setUploading(true);
      const uploaded: UploadedFile[] = [];

      for (const file of validFiles) {
        try {
          const result = await uploadFile(file);
          if (result) {
            uploaded.push({
              ...result,
              preview: URL.createObjectURL(file),
            });
          }
        } catch (err) {
          setErrors((prev) => [
            ...prev,
            `${file.name}: ${err instanceof Error ? err.message : 'Upload failed'}`,
          ]);
        }
      }

      setUploading(false);

      if (uploaded.length > 0) {
        const updated = [...files, ...uploaded];
        setFiles(updated);
        onChange(updated);
      }
    },
    [files, maxFiles, onChange]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onChange(updated);
  };

  const canAddMore = files.length < maxFiles;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      {canAddMore && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
            dragActive
              ? 'border-navy-500 bg-navy-50'
              : 'border-cream-300 hover:border-navy-400 hover:bg-cream-50',
            uploading && 'cursor-not-allowed opacity-60'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleInput}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-navy-500 animate-spin" />
              <p className="text-sm text-navy-600 font-medium">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-navy-400" />
              <p className="text-sm font-medium text-navy-700">
                Drag & drop photos or{' '}
                <span className="text-navy-500 underline">browse</span>
              </p>
              <p className="text-xs text-navy-400">
                JPG, PNG, WEBP up to {MAX_SIZE_MB}MB &bull; Max {maxFiles} photos
              </p>
              {files.length > 0 && (
                <p className="text-xs text-navy-500 font-medium">
                  {files.length}/{maxFiles} uploaded
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {files.map((file, i) => (
            <div key={file.key} className="relative group aspect-square">
              <Image
                src={file.preview || file.url}
                alt={`Upload ${i + 1}`}
                fill
                className="object-cover rounded-lg border border-cream-300"
                sizes="120px"
              />
              {i === 0 && (
                <div className="absolute bottom-1 left-1 bg-navy-700 text-white text-xs px-1.5 py-0.5 rounded">
                  Main
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
