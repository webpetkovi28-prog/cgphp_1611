import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  const NAV_LINKS = [
    { label: 'Начало', href: '/' },
    { label: 'Имоти', href: '/properties' },
    { label: 'Контакти', href: '/contact' }
  ];

  return (
    <nav className="hidden md:flex items-center gap-8">
      {NAV_LINKS.map((item) => (
        <NavLink 
          key={item.href}
          to={item.href}
          end={item.href === '/'}
          className={({ isActive }) =>
            `px-4 py-2 backdrop-blur-sm rounded-lg border border-white/20 font-medium transition-colors ${
              isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:text-white hover:bg-white/5'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navbar;