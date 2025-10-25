import React from 'react'
import type { XtreamPlaylist } from '../../../../types/playlist';

type Props = {
    xtreamPlaylists: XtreamPlaylist[];
    selectedPlaylistId: string | null;
    handlePlaylistChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const PlaylistSelector = ({xtreamPlaylists, selectedPlaylistId, handlePlaylistChange}: Props) => {
    if (xtreamPlaylists.length > 1) {
        return (
            <select value={selectedPlaylistId || ''} onChange={handlePlaylistChange} className="px-3 py-2 text-text-primary bg-background-secondary border border-border-primary rounded-md">
                {xtreamPlaylists.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
        )
    }
    return null
}
