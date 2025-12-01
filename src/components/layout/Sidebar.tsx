import { ChevronLeft, LogOutIcon, UserIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import type React from 'react';
import { useState } from 'react';
import { cn } from '../../libs/utils';
import Button from '../ui/Button';
import SidebarMenu from './SidebarMenu';

export interface SidebarProps {
  title: string;
}

const Sidebar: React.FC<PropsWithChildren<SidebarProps>> = ({
  children,
  title,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = (): void => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <aside
        className={`transition-all duration-300 ${isCollapsed ? 'w-14' : 'w-64'} bg-white shadow-md fixed top-0 left-0 h-screen`}
      >
        <div className="w-full h-full relative">
          <button
            onClick={toggleSidebar}
            className="absolute top-6 -right-3 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700 transition-colors cursor-pointer"
          >
            <ChevronLeft
              className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
          <div className="p-6">
            <h1
              className={`text-2xl font-bold text-red-600 ${isCollapsed ? 'hidden' : ''}`}
            >
              Katanusa Pakar
            </h1>
          </div>
          <SidebarMenu isCollapsed={isCollapsed} />
          <div className="absolute border-t border-gray-200 bottom-0 left-0 w-full">
            <div className="w-full flex flex-col gap-3 p-4">
              {!isCollapsed && (
                <div className="rounded-xl bg-gray-100 p-4 flex items-center justify-between flex flex-row gap-3">
                  {/* <img
                src="https://avatars.githubusercontent.com/u/102410352?v=4"
                alt="Profile"
                className="w-12 h-12 rounded-full"
              /> */}
                  <UserIcon className="w-5 h-5" />

                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      Muhammad Agung Rizkyana
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      Pakar
                    </span>
                  </div>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  'w-full text-red-600 hover:text-red-700 flex flex-row gap-3 justify-center item-center',
                  {
                    'block p-0': isCollapsed,
                  },
                )}
              >
                <LogOutIcon className="w-5 h-5" />
                {isCollapsed ? '' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </aside>
      <main
        className={`${isCollapsed ? 'ml-14' : 'ml-64'} transition-all duration-300`}
      >
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
