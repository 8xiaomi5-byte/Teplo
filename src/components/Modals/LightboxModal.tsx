import React, { useEffect } from 'react';

interface LightboxModalProps {
  photos: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  caption?: string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onSelectIndex,
  caption,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onSelectIndex((currentIndex + 1) % photos.length);
      if (e.key === 'ArrowLeft') onSelectIndex((currentIndex - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onSelectIndex]);

  if (!isOpen || photos.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
      {/* Top bar with counter & close */}
      <div className="w-full max-w-4xl flex items-center justify-between text-white/80 pb-4 px-2">
        <span className="text-sm font-semibold">
          Фото {currentIndex + 1} из {photos.length}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Закрыть (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Main photo container */}
      <div className="relative max-w-4xl w-full flex items-center justify-center flex-1 max-h-[75vh]">
        <button
          onClick={() => onSelectIndex((currentIndex - 1 + photos.length) % photos.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-all z-10"
          title="Предыдущее фото"
        >
          <span className="material-symbols-outlined text-2xl">chevron_left</span>
        </button>

        <img
          src={photos[currentIndex]}
          alt={`Фото ${currentIndex + 1}`}
          className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
        />

        <button
          onClick={() => onSelectIndex((currentIndex + 1) % photos.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-all z-10"
          title="Следующее фото"
        >
          <span className="material-symbols-outlined text-2xl">chevron_right</span>
        </button>
      </div>

      {/* Optional caption */}
      {caption && (
        <p className="text-white/80 text-xs sm:text-sm mt-2 text-center max-w-xl">
          {caption}
        </p>
      )}

      {/* Thumbnails strip */}
      <div className="flex items-center gap-3 mt-4 overflow-x-auto max-w-md py-2 px-4">
        {photos.map((photo, idx) => (
          <button
            key={idx}
            onClick={() => onSelectIndex(idx)}
            className={`relative rounded-xl overflow-hidden aspect-square w-14 h-14 shrink-0 transition-all cursor-pointer border-2 ${
              idx === currentIndex
                ? 'border-[#FF6B6B] scale-105'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={photo} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};
