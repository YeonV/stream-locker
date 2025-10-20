import { useState } from 'react'; // Import useState
import { FiTrash2, FiChevronUp, FiSettings } from 'react-icons/fi';
import type { Playlist, XtreamPlaylist } from '../types/playlist';
import { XtreamPlaylistManager } from './XtreamPlaylistManager';

function isXtreamPlaylist(playlist: Playlist): playlist is XtreamPlaylist {
  return playlist.type === 'xtream';
}

interface PlaylistDisplayProps {
  playlist: Playlist;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const PlaylistDisplay = ({ playlist, onDelete, isLoading }: PlaylistDisplayProps) => {
  // NEW: State to manage the expanded/collapsed view for Xtream playlists
  const [isExpanded, setIsExpanded] = useState(false);

  const isXtream = isXtreamPlaylist(playlist);
  const typeLabel = isXtream ? 'XTREAM' : 'M3U';
  const urlLabel = isXtream ? playlist.serverUrl : playlist.url;
  
  const typeStyles = isXtream 
    ? "bg-sky-600/20 text-sky-300 border border-sky-600/50" // Example: a blue tag for Xtream
    : "bg-primary/20 text-primary-focus border border-primary/50"; // Our amber tag for M3U

  return (
    <div className="bg-background-primary rounded-lg">
      {/* --- This is the new, unified summary header for BOTH playlist types --- */}
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <span className={`flex-shrink-0 px-3 py-0.5 text-xs font-semibold rounded-full ${typeStyles}`}>
              {typeLabel}
            </span>
            <p className="font-semibold text-text-primary truncate">{playlist.name}</p>
          </div>
          <p className="mt-1 text-sm text-text-tertiary truncate">{urlLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          {isXtream && (
            // The expand/collapse button, only shown for Xtream playlists
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-text-tertiary hover:bg-background-secondary rounded-full"
              title={isExpanded ? "Collapse" : "Manage"}
            >
              {isExpanded ? <FiChevronUp size={18} /> : <FiSettings size={18} />}
            </button>
          )}
          <button 
            onClick={() => onDelete(playlist.id)} 
            disabled={isLoading} 
            className="p-2 text-text-tertiary hover:bg-error hover:text-white rounded-full transition-colors disabled:opacity-50"
            title="Delete Playlist"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>
      
      {/* --- This is the new, conditionally rendered content area --- */}
      {isXtream && isExpanded && (
          <XtreamPlaylistManager />
      )}
    </div>
  );
};

export default PlaylistDisplay;