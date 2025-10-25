import { NavLink, useLocation } from 'react-router-dom';
import { mobileNavItems } from '../playgroundNaviConfig';
import { useEnvStore } from '../../../../store/envStore';

export const MobileBottomNavi = () => {
  const { pathname } = useLocation();
  const device = useEnvStore(state => state.device);

  return (
    <div className={`flex justify-around items-center py-1 ${device === 'android' ? 'pb-3' : ''} bg-background-secondary border-t border-border-primary min-md:hidden landscape:hidden`}>
        {mobileNavItems.map(({ path, label, Icon }) => {
          // This is the new logic. For 'Movies' and 'Series', we check if the pathname starts with their base path.
          // For all others, we use the default strict 'isActive' check.
          const isSectionActive = (path === '/playground/movies' && pathname.startsWith('/playground/movies')) ||
            (path === '/playground/series' && pathname.startsWith('/playground/series')) ||
            (pathname === path); // Fallback for LiveTV and General

          return (
            <NavLink
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-md font-semibold text-sm transition-colors ${isSectionActive ? 'text-primary' : 'text-text-secondary hover:bg-background-glass hover:text-text-primary'
                }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
      );
};