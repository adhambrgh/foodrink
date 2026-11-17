'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';

interface ImagePreviewProps {
  src: string;
  alt: string;
  thumbnailClassName?: string;
}

export default function ImagePreview({ src, alt, thumbnailClassName = 'w-32 h-32 object-contain rounded border border-border' }: ImagePreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Lihat ${alt} lebih besar`}
        className="block cursor-zoom-in transition-opacity hover:opacity-80"
      >
        <img src={src} alt={alt} className={thumbnailClassName} />
      </button>
      <Dialog open={open} onOpenChange={setOpen} title={alt} maxWidth="xl">
        <div className="flex items-center justify-center bg-neutral-50 p-4">
          <img
            src={src}
            alt={alt}
            className="max-h-[75vh] max-w-full object-contain"
          />
        </div>
      </Dialog>
    </>
  );
}