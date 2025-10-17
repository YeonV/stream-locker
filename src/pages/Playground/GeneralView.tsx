import type { Playlist, XtreamPlaylist } from '../../types/playlist';
import { useState, useEffect, } from 'react';
import { XtreamPlaylistManager } from '../../components/XtreamPlaylistManager';
import { useAuthStore } from '../../store/authStore';

export const GeneralView = () => {
    const { session } = useAuthStore();
    const [xtreamPlaylists, setXtreamPlaylists] = useState<XtreamPlaylist[]>([]);

    useEffect(() => {
        const userMetadata = session?.user?.user_metadata;
        if (userMetadata?.playlists) {
            setXtreamPlaylists(userMetadata.playlists.filter((p: Playlist) => p.type === 'xtream'));
        }
    }, [session]);

    return (
        <div className="h-screen w-screen bg-gray-900 text-white p-8 overflow-auto">
            <div className="max-w-full mx-auto space-y-8 px-4">
                {xtreamPlaylists.length > 0 && <XtreamPlaylistManager playlist={xtreamPlaylists[0]} />}
            </div>
        </div>
    );
};