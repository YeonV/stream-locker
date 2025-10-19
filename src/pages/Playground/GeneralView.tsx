import type { Playlist, XtreamPlaylist } from '../../types/playlist';
import { useState, useEffect, } from 'react';
import { XtreamPlaylistManager } from '../../components/XtreamPlaylistManager';
import { useAuthStore } from '../../store/authStore';
import { useEnvStore } from '../../store/envStore';

export const GeneralView = () => {
    const { session } = useAuthStore();
    const [xtreamPlaylists, setXtreamPlaylists] = useState<XtreamPlaylist[]>([]);
        
    const device = useEnvStore(state => state.device);
    const engine = useEnvStore(state => state.engine);
    const mode = useEnvStore(state => state.mode);

    useEffect(() => {
        const userMetadata = session?.user?.user_metadata;
        if (userMetadata?.playlists) {
            setXtreamPlaylists(userMetadata.playlists.filter((p: Playlist) => p.type === 'xtream'));
        }
    }, [session]);

    return (<>
        <div className="w-screen bg-gray-900 text-white p-8 overflow-auto">
            <div className="max-w-full mx-auto space-y-8 px-4">
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                    {engine === 'web' ? `Running on ${device} in web mode` : `Running on ${device} natively in ${mode} mode`}
                </div>
            </div>
        </div>
        <div className="h-screen w-screen bg-gray-900 text-white p-8 overflow-auto">
            <div className="max-w-full mx-auto space-y-8 px-4">
                {xtreamPlaylists.length > 0 && <XtreamPlaylistManager playlist={xtreamPlaylists[0]} />}
            </div>
        </div>
        </>
    );
};