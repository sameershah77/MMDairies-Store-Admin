import { useEffect } from 'react';
import { X } from 'lucide-react';

export type MediaPreviewItem = {
  url: string;
  media_type: string;
};

export function MediaPreview({
  item,
  onClose,
}: {
  item: MediaPreviewItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [item, onClose]);

  if (!item) return null;

  const isVideo = item.media_type.toLowerCase() === 'video';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Media preview"
    >
      <button
        type="button"
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        onClick={onClose}
        aria-label="Close preview"
      >
        <X className="size-5" />
      </button>
      <div
        className="flex max-h-[90vh] max-w-[92vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={item.url}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[92vw] rounded-xl bg-black"
          />
        ) : (
          <img
            src={item.url}
            alt="Attachment"
            className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain"
          />
        )}
      </div>
    </div>
  );
}
