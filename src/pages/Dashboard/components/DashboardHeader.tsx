import { Link } from 'react-router-dom';
import { FiSettings, FiSearch } from 'react-icons/fi';
import { FaLayerGroup } from 'react-icons/fa';
import { FaList } from "react-icons/fa6";
import { useDebugStore } from '../../../store/debugStore';
import { useEnvStore } from '../../../store/envStore';
import type { M3uPlaylist } from '../../../types/playlist';
import logo from '../../../assets/logo.png';
import yz from '../../../assets/yz.png';

interface DashboardHeaderProps {
  m3uPlaylists: M3uPlaylist[];
  selectedPlaylistId: string | null;
  handlePlaylistChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  viewMode: 'grouped' | 'flat';
  setViewMode: (mode: 'grouped' | 'flat') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hasXtreamPlaylists: boolean;
}

export const DashboardHeader = (props: DashboardHeaderProps) => {
  const {
    m3uPlaylists, selectedPlaylistId, handlePlaylistChange,
    viewMode, setViewMode, searchTerm, setSearchTerm, hasXtreamPlaylists
  } = props;

  const { toggleConsole } = useDebugStore();
  const device = useEnvStore(state => state.device);

  return (
    // Main header container. Uses flex-wrap and aligns items to the top on small screens.
    <header className={`flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-4 px-4 py-2 ${device === 'android' ? 'pt-8' : ''} bg-gray-800 border-b border-border-primary shrink-0`}>
      
      {/* === ZONE 1: CONTROLS (LEFT) === */}
      {/* This container stacks vertically on small screens, horizontally on sm+ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
        
        {/* Sub-container for the top row elements */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-full cursor-pointer flex-shrink-0" onClick={toggleConsole} />
          
          {m3uPlaylists.length > 0 && (
            <select
              value={selectedPlaylistId || ''}
              onChange={handlePlaylistChange}
              className="w-48 px-3 py-2 text-text-primary bg-background-secondary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus appearance-none"
            >
              {m3uPlaylists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          
          <div className="flex bg-background-secondary rounded-md border border-border-primary">
            {/* PADDING FIX: Using py-2.5 as requested */}
            <button onClick={() => setViewMode('grouped')} title="Grouped View" className={`px-3 py-2.5 rounded-l-md ${viewMode === 'grouped' ? 'bg-primary text-white' : 'hover:bg-background-glass'}`}><FaLayerGroup /></button>
            <button onClick={() => setViewMode('flat')} title="List View" className={`px-3 py-2.5 rounded-r-md ${viewMode === 'flat' ? 'bg-primary text-white' : 'hover:bg-background-glass'}`}><FaList /></button>
          </div>
        </div>

        {/* Search Bar Container */}
        {/* Conditionally rendered based on viewMode. Takes full width on small screens. */}
        <div className={`w-full max-w-[21.125rem] ${viewMode === 'flat' ? 'block' : 'hidden'}`}>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-text-primary bg-background-secondary border border-border-primary rounded-md"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" />
            </div>
        </div>
      </div>

      {/* === ZONE 2: ACTIONS (RIGHT) === */}
      {/* Hidden below md breakpoint, flex-shrink-0 to prevent squishing */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <Link to="/playground/settings" title="Settings" className="p-2 rounded-full hover:bg-background-glass"><FiSettings size={24} /></Link>
        {hasXtreamPlaylists && <Link to="/playground" title="Go to Playground" className="p-2 rounded-full hover:bg-background-glass"><img src={yz} alt="Playground" width={24} /></Link>}
      </div>
    </header>
  );
};