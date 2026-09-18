import React, { useState } from 'react';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
}

export interface FilterOptions {
  ageMin: number;
  ageMax: number;
  onlyVerified: boolean;
  onlyEditorChoice: boolean;
  city: string;
  interest: string;
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  if (!isOpen) return null;

  const interestsList = [
    'Все',
    'Урбанистика',
    'Керамика & Гончарство',
    'Спешелти кофе',
    'Треккинг в горах',
    'Психология',
    'Книги',
    'Деревообработка',
    'Арт-выставки'
  ];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(filters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F5ECE6] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFF0EF] text-[#584140] hover:text-[#231918] flex items-center justify-center cursor-pointer transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#A0401C]">tune</span>
          <h3 className="text-lg font-bold text-[#231918]">Фильтры поиска</h3>
        </div>

        <form onSubmit={handleApply} className="space-y-4">
          {/* Age range */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#584140] mb-2">
              <span>Возраст</span>
              <span className="text-[#AE2F34] font-bold">
                {filters.ageMin} – {filters.ageMax} лет
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={18}
                max={45}
                value={filters.ageMin}
                onChange={(e) =>
                  setFilters({ ...filters, ageMin: Math.min(Number(e.target.value), filters.ageMax - 1) })
                }
                className="w-full accent-[#AE2F34]"
              />
              <input
                type="range"
                min={20}
                max={55}
                value={filters.ageMax}
                onChange={(e) =>
                  setFilters({ ...filters, ageMax: Math.max(Number(e.target.value), filters.ageMin + 1) })
                }
                className="w-full accent-[#AE2F34]"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-1">Город</label>
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="w-full text-sm p-2.5 rounded-xl border border-[#E0BFBD]/60 bg-[#FFF8F7]/50 focus:bg-white outline-none"
            >
              <option value="Все">Любой город</option>
              <option value="Москва">Москва</option>
              <option value="Санкт-Петербург">Санкт-Петербург</option>
            </select>
          </div>

          {/* Interest tags */}
          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-1.5">Интерес</label>
            <div className="flex flex-wrap gap-1.5">
              {interestsList.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  onClick={() => setFilters({ ...filters, interest })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    filters.interest === interest
                      ? 'bg-[#A0401C] text-white shadow-xs'
                      : 'bg-[#FFF0EF] text-[#584140] hover:bg-[#FDEAE8]'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-[#E0BFBD]/30">
            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FFF8F7] cursor-pointer">
              <span className="text-xs font-semibold text-[#231918]">
                Только с видеоселфи (верифицированные)
              </span>
              <input
                type="checkbox"
                checked={filters.onlyVerified}
                onChange={(e) => setFilters({ ...filters, onlyVerified: e.target.checked })}
                className="w-4 h-4 accent-[#AE2F34]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FFF8F7] cursor-pointer">
              <span className="text-xs font-semibold text-[#231918]">
                Выбор редакции (глубокие анкеты)
              </span>
              <input
                type="checkbox"
                checked={filters.onlyEditorChoice}
                onChange={(e) => setFilters({ ...filters, onlyEditorChoice: e.target.checked })}
                className="w-4 h-4 accent-[#AE2F34]"
              />
            </label>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() =>
                setFilters({
                  ageMin: 22,
                  ageMax: 35,
                  onlyVerified: false,
                  onlyEditorChoice: false,
                  city: 'Все',
                  interest: 'Все',
                })
              }
              className="py-3 px-4 rounded-full border border-[#E0BFBD]/60 text-xs font-semibold text-[#584140] hover:bg-[#FFF8F7] cursor-pointer"
            >
              Сброс
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-full bg-[#AE2F34] hover:bg-[#9D422C] text-white font-bold text-sm shadow-md cursor-pointer transition-colors"
            >
              Применить фильтры
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
