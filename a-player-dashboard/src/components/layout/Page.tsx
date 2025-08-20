import React from 'react';
import { Header } from './Header';

interface PageProps {
  children: React.ReactNode;
  subNav?: React.ReactNode;
}

export const Page: React.FC<PageProps> = ({ children, subNav }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header subNav={subNav} />
      <main className={`${subNav ? 'mt-6' : 'mt-6'}`}>
        {children}
      </main>
    </div>
  );
};
