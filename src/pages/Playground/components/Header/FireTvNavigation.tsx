import { NavLink } from "react-router-dom"
import { flatNavItems } from "../playgroundNaviConfig"

export const FireTvNavigation = () => {
    return flatNavItems.map((nav, index) => <NavLink
        key={index}
        to={nav.path}
        className={({ isActive }) => `max-md:portrait:hidden flex items-center space-x-2 pl-3 pr-4 py-2 rounded-md font-semibold text-sm transition-colors ${isActive ? 'text-text-primary border-b-1 border-primary rounded-none' : 'text-text-secondary hover:bg-background-glass hover:text-text-primary'}`}
    >
        <nav.Icon size={16} />
        <span>{nav.path === '/playground/movies-categories' ? 'M-Cat' : nav.path === '/playground/series-categories' ? 'S-Cat' : nav.label}</span>
    </NavLink>)
}