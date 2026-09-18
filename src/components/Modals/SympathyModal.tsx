import React, { useState } from 'react';
import { Profile, Icebreaker } from '../../types';

interface SympathyModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, reaction: string) => void;
}

export const SympathyModal: React.FC<SympathyModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSend,
}) => {
  const [selectedReaction, setSelectedReaction] = useState('Искреннее тепло');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const reactions = [
    { label: 'Искреннее тепло', icon: 'favorite', emoji: '💛' },
    { label: 'Вдохновение', icon: 'auto_awesome', emoji: '✨' },
    { label: 'На чашку чая', icon: 'coffee', emoji: '🫖' },
    { label: 'Прогулка с собакой', icon: 'pets', emoji: '🐾' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(note.trim(), selectedReaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F5ECE6] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFF0EF] text-[#584140] hover:text-[#231918] flex items-center justify-center cursor-pointer transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-[#FF6B6B]"
          />
          <div>
            <h3 className="text-lg font-bold text-[#231918]">
              Отправить симпатию {profile.name}
            </h3>
            <p className="text-xs text-[#584140]">
              Совместимость ценностей: {profile.valuesMatch}%
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-2">
              Выберите отклик сердца:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reactions.map((r) => (
                <button
                  type="button"
                  key={r.label}
                  onClick={() => setSelectedReaction(r.label)}
                  className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedReaction === r.label
                      ? 'bg-[#FFF0EF] border-[#AE2F34] text-[#AE2F34] shadow-xs'
                      : 'bg-white border-[#E0BFBD]/50 text-[#584140] hover:bg-[#FFF8F7]'
                  }`}
                >
                  <span className="text-base">{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-1.5">
              Прикрепить тёплую записку или вопрос (необязательно):
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Например: «Привет! Прочитал твой ответ про книгу Фромма — меня тоже очень зацепила мысль об осознанной заботе...»`}
              className="w-full text-sm p-3 rounded-2xl border border-[#E0BFBD]/60 bg-[#FFF8F7]/50 focus:bg-white focus:border-[#A0401C] outline-none text-[#231918]"
            />
          </div>

          {/* Quick Icebreaker Prompts helper */}
          {profile.icebreakers.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-[#A0401C] block mb-1">
                Или откликнуться на вопрос:
              </span>
              <div className="flex flex-col gap-1.5">
                {profile.icebreakers.slice(0, 2).map((ib: Icebreaker) => (
                  <button
                    type="button"
                    key={ib.id}
                    onClick={() => setNote(`По поводу «${ib.question}»: `)}
                    className="text-left text-[11px] text-[#584140] bg-[#FFF0EF]/60 hover:bg-[#FFF0EF] p-2 rounded-xl transition-colors border border-[#E0BFBD]/30 cursor-pointer line-clamp-1"
                  >
                    💬 {ib.question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full border border-[#E0BFBD]/60 text-sm font-semibold text-[#584140] hover:bg-[#FFF8F7] cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#EE7B52] hover:opacity-95 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <span
                className="material-symbols-outlined text-sm fill-icon"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
              <span>Отправить</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
