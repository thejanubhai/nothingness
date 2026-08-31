'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadDirectToCloudinary } from '@/lib/cloudinary/client';
import { toast } from 'sonner';

interface CloudinaryUploadZoneProps {
  folder?: string;
  multiple?: boolean;
  onUploadSuccess: (url: string, data?: any) => void;
  onMultipleUploadSuccess?: (urls: string[]) => void;
  className?: string;
  buttonOnly?: boolean;
  buttonLabel?: string;
}

export default function CloudinaryUploadZone({
  folder = 'nothingness/spaces',
  multiple = false,
  onUploadSuccess,
  onMultipleUploadSuccess,
  className = '',
  buttonOnly = false,
  buttonLabel = 'Upload to Cloudinary',
}: CloudinaryUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    const uploadedUrls: string[] = [];
    let successCount = 0;

    try {
      const fileArray = Array.from(files);
      const totalFiles = fileArray.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = fileArray[i];

        const res = await uploadDirectToCloudinary(file, {
          folder,
          onProgress: (percent) => {
            const overallPercent = Math.round(((i * 100) + percent) / totalFiles);
            setProgress(overallPercent);
          },
        });

        if (res.success && res.secure_url) {
          uploadedUrls.push(res.secure_url);
          onUploadSuccess(res.secure_url, res);
          successCount++;
        } else {
          toast.error(`Failed to upload ${file.name}: ${res.error || 'Unknown error'}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''} to Cloudinary!`);
        if (onMultipleUploadSuccess && uploadedUrls.length > 0) {
          onMultipleUploadSuccess(uploadedUrls);
        }
      }
    } catch (err: any) {
      console.error('[Upload Zone] Upload error:', err);
      toast.error(err.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (buttonOnly) {
    return (
      <div className="inline-flex items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-accent-gold/15 hover:bg-accent-gold/25 border border-accent-gold/30 text-accent-gold hover:text-white transition-all text-xs font-mono disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading {progress}%...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer text-center ${
          isDragging
            ? 'border-accent-gold bg-accent-gold/10'
            : isUploading
            ? 'border-accent-gold/40 bg-black/40'
            : 'border-white/10 hover:border-accent-gold/40 bg-white/[0.02] hover:bg-accent-gold/[0.02]'
        }`}
      >
        {isUploading ? (
          <div className="space-y-3 w-full max-w-xs flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
            <p className="text-xs text-white font-mono">Uploading to Cloudinary CDN ({progress}%)...</p>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-gold transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white font-medium">
                Click to browse or drag &amp; drop photos
              </p>
              <p className="text-[10px] text-white/40 font-mono mt-0.5">
                Auto-optimized with WebP/AVIF transformations on Cloudinary CDN
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
