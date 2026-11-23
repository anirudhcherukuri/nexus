import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080817] text-[#F4F2FF] font-sans relative selection:bg-[#7957E8]/40 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-[#9875FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[350px] bg-[#42D9E8]/08 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar container */}
      <div className="p-3 pr-0 h-full flex flex-col z-30">
        <Sidebar />
      </div>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 p-3 pl-3">
        <div className="flex-1 flex flex-col h-full rounded-2xl overflow-hidden glass-panel border border-[rgba(160,140,255,0.16)] shadow-glass">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#0D1024]/60 to-[#080817]/90">
            <div className="max-w-7xl mx-auto space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
