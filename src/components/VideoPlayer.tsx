import { usePlayerStore } from '../store/playerStore';
import { useEnvStore } from '../store/envStore';
import { HlsPlayer } from './HlsPlayer';
import { MkvPlayer } from './MkvPlayer';
import { MpvPlayer } from './MpvPlayer/MpvPlayer';
import { useCallback } from 'react';
import { FiArrowLeft } from 'react-icons/fi';

export const VideoPlayer = () => {
    const currentStreamUrl = usePlayerStore(state => state.currentStreamUrl);
    const stopAndRelease = usePlayerStore(state => state.stopAndRelease);
    const device = useEnvStore(state => state.device);
    const engine = useEnvStore(state => state.engine);

    const handlePlayerError = useCallback(() => {
        usePlayerStore.getState().stopStream();
    }, []);

    if (!currentStreamUrl) {
        return null;
    }

    const shouldUseMpv = engine === 'native' && device === 'windows';
    const isMkv = currentStreamUrl.includes('.mkv');
    const isAndroidNative = engine === 'native' && (device === 'android' || device === 'androidtv' || device === 'firetv');

    if (isAndroidNative) {
        return null;
    }

    if (shouldUseMpv) {
        return (
            <div className="mpv-player-container absolute inset-0 z-50">
                <MpvPlayer src={currentStreamUrl} />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <div className="absolute top-4 left-4 z-10">
                <button
                    onClick={() => stopAndRelease()}
                    className="p-3 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer"
                    title="Go Back"
                >
                    <FiArrowLeft size={24} />
                </button>
            </div>

            {isMkv ? (
                <MkvPlayer src={currentStreamUrl} onError={handlePlayerError} />
            ) : (
                <HlsPlayer src={currentStreamUrl} onPlayerError={handlePlayerError} />
            )}
        </div>
    );
};