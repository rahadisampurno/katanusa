import { Home, Receipt } from 'lucide-react';
import type React from 'react';
import { Link } from 'react-router';
import { cn } from '../../libs/utils';

interface SidebarMenuProps {
  isCollapsed: boolean;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ isCollapsed }) => {
  const activePath = window.location.pathname;

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Transaction', icon: Receipt, path: '/dashboard/transaction' },
  ];

  return (
    <div className="flex flex-col p-4">
      <nav className="flex-grow">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={cn(
                  'flex items-center p-4 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-xl',
                  {
                    'bg-red-50 text-red-600': activePath === item.path,
                  },
                )}
              >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarMenu;
