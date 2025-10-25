import { FaThList } from "react-icons/fa"
import { FiGrid } from "react-icons/fi"
import { useEnvStore } from "../../../../store/envStore";
import { useLocation, useNavigate } from "react-router-dom";


export const CategorySwitch = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const device = useEnvStore(state => state.device);

    const isMoviesSection = pathname.startsWith('/playground/movies');
    const isSeriesSection = pathname.startsWith('/playground/series');

    const handleViewSwitch = () => {
        if (device === 'firetv') return;
        if (isMoviesSection) {
            if (pathname === '/playground/movies') {
                navigate('/playground/movies-categories');
            } else {
                navigate('/playground/movies');
            }
        } else if (isSeriesSection) {
            if (pathname === '/playground/series') {
                navigate('/playground/series-categories');
            } else {
                navigate('/playground/series');
            }
        }
    }

    return (
        <div className="ml-2 p-1 px-2 bg-background-primary rounded-md flex min-md:hidden landscape:hidden" title="Switch View" onClick={() => handleViewSwitch()}>
            <FiGrid size={16} className={`mr-1 ${pathname.includes('categories') ? 'text-text-secondary' : 'text-primary'}`} />
            <FaThList size={16} className={`${pathname.includes('categories') ? 'text-primary' : 'text-text-secondary'}`} />
        </div>
    )
}

