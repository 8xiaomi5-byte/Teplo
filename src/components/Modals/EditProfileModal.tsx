import React, { useState } from 'react';
import { Profile } from '../../types';

interface EditProfileModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<Profile>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(profile.name);
  const [profession, setProfession] = useState(profile.profession);
  const [city, setCity] = useState(profile.city);
  const [highlightQuote, setHighlightQuote] = useState(profile.highlightQuote);
  const [bio1, setBio1] = useState(profile.bioParagraphs[0] || '');
  const [bio2, setBio2] = useState(profile.bioParagraphs[1] || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      profession,
      city,
      highlightQuote,
      bioParagraphs: [bio1, bio2].filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#F5ECE6] relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFF0EF] text-[#584140] hover:text-[#231918] flex items-center justify-center cursor-pointer transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#A0401C]">edit_note</span>
          <h3 className="text-lg font-bold text-[#231918]">Редактирование анкеты</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#584140] mb-1">Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm p-2.5 rounded-xl border border-[#E0BFBD]/60 bg-[#FFF8F7]/50 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#584140] mb-1">Город</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-sm p-2.5 rounded-xl border border-[#E0BFBD]/60 bg-[#FFF8F7]/50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-1">
              Профессия / Род деятельности
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full text-sm p-2.5 rounded-xl border border-[#E0BFBD]/60 bg-[#FFF8F7]/50 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-1">
              Главная цитата / Мысль о близости
            </label>
            <input
              type="text"
              value={highlightQuote}
              onChange={(e) => setHighlightQuote(e.target.value)}
              className="w-full text-sm p-2.5 rounded-xl border border-[#E0BFBD]/60 bg-[#FFF8F7]/50 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-1">
              Обо мне (первый абзац — о философии и жизни)
            </label>
            <textarea
              rows={2}
              value={bio1}
              onChange={(e) => setBio1(e.target.value)}
              className="w-full text-sm p-2.5 rounded-xl border border-[#E0BFBD]/60 bg-[#FFF8F7]/50 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-1">
              Обо мне (второй абзац — о хобби и выходных)
            </label>
            <textarea
              rows={2}
              value={bio2}
              onChange={(e) => setBio2(e.target.value)}
              className="w-full text-sm p-2.5 rounded-xl border border-[#E0BFBD]/60 bg-[#FFF8F7]/50 focus:bg-white outline-none"
            />
          </div>

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
              className="flex-1 py-3 px-4 rounded-full bg-[#AE2F34] hover:bg-[#9D422C] text-white font-bold text-sm shadow-md cursor-pointer transition-colors"
            >
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
