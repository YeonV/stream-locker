import { FiPlay } from 'react-icons/fi';
import type { PosterItem } from '../../../types/playlist';



export const Poster = ({ stream, onClick }: { stream: PosterItem, onClick: () => void; }) => {
    const content = (dummy?: boolean) => {
        return (
            <>
                <p
                    className="text-base font-bold text-white [text-shadow:_0_1px_4px_#000]"
                    style={{
                        display: '-webkit-box',
                        fontSize: '1.875rem',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {stream.name}
                </p>
                {!dummy && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <FiPlay
                        className="text-5xl text-white/80 group-hover/poster:text-white group-hover/poster:scale-110 
                     transition-transform duration-200 drop-shadow-lg"
                    />
                </div>}
                <p style={{ fontSize: '1.875rem' }} className="self-end font-bold text-yellow-400 [text-shadow:_0_1px_4px_#000]">
                    ⭐ {stream.rating}
                </p>
            </>
        )
    }
    return (
        <div
            onClick={onClick}
            tabIndex={0}
            className="relative group/poster w-full h-full bg-gray-800 rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-200 cursor-pointer shadow-lg focus:ring-4 focus:ring-blue-500 outline-none"
        >
            {stream.imageUrl && stream.imageUrl !== '' ? (<img
                src={stream.imageUrl}
                alt={stream.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => (e.currentTarget.style.display = 'none')}
            />) : (
                <div className="bg-gray-700 w-full h-full flex flex-col justify-between p-2 inset-0">
                    {content(true)}
                </div>
            )}
            <div className="absolute inset-0 bg-black/85 p-2 flex flex-col justify-between opacity-0 group-hover/poster:opacity-100 transition-opacity duration-300">
                {content()}
            </div>
        </div>
    )
}