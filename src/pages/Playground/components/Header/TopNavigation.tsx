import { FaThList } from "react-icons/fa";
import { FiGrid } from "react-icons/fi";
import { NavLink, useLocation } from "react-router-dom";
import { navItems } from "../playgroundNaviConfig";
import type { XtreamPlaylist } from "../../../../types/playlist";

export const TopNavigation = ({ xtreamPlaylists, devMode }: { xtreamPlaylists: XtreamPlaylist[]; devMode: boolean; }) => {
    const { pathname } = useLocation();
    const isSettings = pathname === '/playground/settings'
    const isMoviesSection = pathname.startsWith('/playground/movies');
    const isSeriesSection = pathname.startsWith('/playground/series');
    return (isSettings || !(xtreamPlaylists.length > 0) ? [] : devMode ? navItems : navItems.filter(nav => nav.type !== 'single' || nav.item.path !== '/playground/dev')).map((nav, index) => {


        if (nav.type === 'group') {
            const isMoviesGroup = nav.items[0].path.startsWith('/playground/movies');
            const isSeriesGroup = nav.items[0].path.startsWith('/playground/series');
            const linkToRender = pathname === nav.items[0].path ? nav.items[1] : nav.items[0];
            const { path, label, Icon } = linkToRender;
            const isGroupActive = (isMoviesSection && isMoviesGroup) || (isSeriesSection && isSeriesGroup);

            return (
                <NavLink
                    key={index}
                    to={path}
                    className={`max-md:portrait:hidden flex items-center space-x-2 pl-3 pr-4 py-2 rounded-md font-semibold text-sm transition-colors ${isGroupActive ? 'text-text-primary border-b-1 border-primary rounded-none' : 'text-text-secondary hover:bg-background-glass hover:text-text-primary'
                        }`
                    }
                >
                    <Icon size={16} />
                    <span>{label}</span>
                    {isGroupActive && <div className="ml-2 p-1 px-2 bg-background-primary rounded-md flex" title="Switch View">
                        <FiGrid size={16} className={`mr-1 ${pathname.includes('categories') ? 'text-text-secondary' : 'text-primary'}`} />
                        <FaThList size={16} className={`${pathname.includes('categories') ? 'text-primary' : 'text-text-secondary'}`} />
                    </div>}
                </NavLink>
            )
        }

        const { path, label, Icon } = nav.item;
        return (
            <NavLink
                key={index}
                to={path}
                className={({ isActive }) => `max-md:portrait:hidden flex items-center space-x-2 pl-3 pr-4 py-2 rounded-md font-semibold text-sm transition-colors ${isActive ? 'text-text-primary border-b-1 border-primary rounded-none' : 'text-text-secondary hover:bg-background-glass hover:text-text-primary'}`}
            >
                <Icon size={16} />
                <span>{label}</span>
            </NavLink>
        );
    })
}