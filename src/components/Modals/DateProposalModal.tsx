import React, { useState } from 'react';
import { Profile } from '../../types';
import { COZY_DATE_SPOTS } from '../../data/events';

interface DateProposalModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateDetails: { venueName: string; address: string; time: string; note: string }) => void;
}

export const DateProposalModal: React.FC<DateProposalModalProps> = ({
  profile,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedSpotId, setSelectedSpotId] = useState(COZY_DATE_SPOTS[0].id);
  const [preferredDate, setPreferredDate] = useState('В эту субботу, 17:00');
  const [customNote, setCustomNote] = useState(
    'Привет, Полина! Мне кажется, нам было бы уютно выпить кофе и поболтать об архитектуре и любимых местах.'
  );

  if (!isOpen) return null;

  const currentSpot = COZY_DATE_SPOTS.find((s) => s.id === selectedSpotId) || COZY_DATE_SPOTS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      venueName: currentSpot.name,
      address: currentSpot.address,
      time: preferredDate,
      note: customNote,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F5ECE6] relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFF0EF] text-[#584140] hover:text-[#231918] flex items-center justify-center cursor-pointer transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[#AE2F34] text-24px">
            calendar_month
          </span>
          <h3 className="text-lg font-bold text-[#231918]">
            Свидание в тёплом месте с {profile.name}
          </h3>
        </div>

        <p className="text-xs text-[#584140] mb-4">
          Мы подобрали проверенные уютные локации в Москве с неспешной атмосферой, хорошим чаем и кофе.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-2">
              Выберите уютное место:
            </label>
            <div className="space-y-2">
              {COZY_DATE_SPOTS.map((spot) => (
                <div
                  key={spot.id}
                  onClick={() => setSelectedSpotId(spot.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left flex items-start gap-3 ${
                    selectedSpotId === spot.id
                      ? 'bg-[#FFF0EF] border-[#AE2F34] shadow-xs'
                      : 'bg-white border-[#E0BFBD]/50 hover:bg-[#FFF8F7]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedSpotId === spot.id ? 'bg-[#FFDAD8] text-[#AE2F34]' : 'bg-[#F1DEDC] text-[#584140]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{spot.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-[#231918] truncate">{spot.name}</h4>
                      <span className="text-[10px] text-[#A0401C] font-semibold">{spot.category}</span>
                    </div>
                    <p className="text-[11px] text-[#584140]/80 mt-0.5">{spot.address}</p>
                    <p className="text-[11px] text-[#584140] mt-1 line-clamp-2">{spot.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-1.5">
              Желаемое время:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'В эту субботу, 16:00',
                'В это воскресенье, 13:00',
                'В будний вечер, 19:30',
                'В свободное окно на неделе',
              ].map((timeOption) => (
                <button
                  type="button"
                  key={timeOption}
                  onClick={() => setPreferredDate(timeOption)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    preferredDate === timeOption
                      ? 'bg-[#A0401C] text-white'
                      : 'bg-[#FFF0EF] text-[#584140] hover:bg-[#FDEAE8]'
                  }`}
                >
                  {timeOption}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#584140] mb-1.5">
              Тёплое приглашение:
            </label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full text-sm p-3 rounded-2xl border border-[#E0BFBD]/60 bg-[#FFF8F7]/50 focus:bg-white focus:border-[#A0401C] outline-none text-[#231918]"
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
              className="flex-1 py-3 px-4 rounded-full bg-[#FFF4ED] hover:bg-[#FFECE0] text-[#9D422C] font-semibold text-sm border border-[#FFDAC6] flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              <span>Отправить приглашение</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
