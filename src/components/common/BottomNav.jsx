import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, PlusCircle, BookOpen } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { to: '/', label: '탐구 홈', icon: Compass },
    { to: '/ask', label: '질문하기', icon: PlusCircle, isMain: true },
    { to: '/my-portfolios', label: '내 탐구일지', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.isMain) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center -mt-6 transition group`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-13 h-13 p-3 rounded-full shadow-lg flex items-center justify-center transition transform group-active:scale-95 ${
                        isActive
                          ? 'bg-gradient-to-tr from-eureka-600 to-eureka-400 text-white shadow-eureka-300'
                          : 'bg-eureka-500 text-white hover:bg-eureka-600 shadow-eureka-200'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-1 ${
                        isActive ? 'text-eureka-700' : 'text-slate-500'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 py-1 transition ${
                  isActive ? 'text-eureka-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
