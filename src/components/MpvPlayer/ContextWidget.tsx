// src/components/MpvPlayer/ContextWidget.tsx

import { useUiContextStore } from '../../store/uiContextStore';
import { SerieInfoOverlay } from './SerieInfoOverlay';
import ChannelListOverlay from './ChannelListOverlay';
import MovieInfoOverlay from './MovieInfoOverlay';

export const ContextWidget = () => {
    const context = useUiContextStore(state => state.context);
    const contextType = useUiContextStore(state => state.context?.type);

    const renderContent = () => {
        if (!context) return null;

        switch (contextType) {
            case 'livetv-xtream':
                return <ChannelListOverlay />;
            case 'livetv-m3u':
                return <ChannelListOverlay />;
            case 'movie':
                return <MovieInfoOverlay />;
            case 'series':
                return <SerieInfoOverlay />;
            default:
                return null;
        }
    };

    // The main return for the ContextWidget
    return (
        <div className={`absolute top-0 left-0 bottom-0 right-0 z-0 transition-opacity duration-300  pointer-events-none'}`}>
            <div className="h-20 pl-20 flex items-center bg-black/50">
                {/* Topbar placeholder for future use (e.g., movie title) */}
            </div>
            <div className="absolute top-20 left-0 right-0 bottom-20 flex">
                {renderContent()}
            </div>
        </div>
    );
};