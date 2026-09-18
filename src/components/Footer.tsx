import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="docked full-width bottom mt-auto bg-[#FFF0EF] border-t border-[#E0BFBD]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 w-full text-[14px]">
        <div className="flex items-center gap-2">
          <span className="text-[18px] text-[#AE2F34] font-bold">Тепло</span>
          <span className="text-[#584140]">
            © 2024 Тепло. Безопасные знакомства с верификацией профилей. Все права защищены.
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-[12px] text-[#584140]">
          <a className="hover:text-[#AE2F34] transition-colors duration-150 cursor-pointer" href="#safety">
            Безопасность
          </a>
          <a className="hover:text-[#AE2F34] transition-colors duration-150 cursor-pointer" href="#rules">
            Правила сообщества
          </a>
          <a className="hover:text-[#AE2F34] transition-colors duration-150 cursor-pointer" href="#verification">
            Верификация
          </a>
          <a className="hover:text-[#AE2F34] transition-colors duration-150 cursor-pointer" href="#privacy">
            Конфиденциальность
          </a>
          <a className="hover:text-[#AE2F34] transition-colors duration-150 cursor-pointer" href="#help">
            Помощь
          </a>
        </nav>
      </div>
    </footer>
  );
};
