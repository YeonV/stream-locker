import { FiPlay } from 'react-icons/fi';
import type { PosterItem } from '../../../types/playlist';
import { FaStar } from 'react-icons/fa';
import { useEffect, useRef } from 'react';

interface PosterProps {
    stream: PosterItem;
    onClick: () => void;
    rowIndex?: number;
    colIndex?: number;
}

export const Poster = ({ stream, onClick, rowIndex, colIndex }: PosterProps) => {
    const postRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (rowIndex === 0 && colIndex === 0) {
            postRef?.current?.focus();
        }
    }, [rowIndex, colIndex]);
    
    const content = (dummy?: boolean) => {
        return (
            <>
                <p
                    // THEME: Changed text-white to text-text-primary
                    className="text-base font-bold text-text-primary [text-shadow:_0_1px_4px_#000]"
                    style={{
                        display: '-webkit-box',
                        fontSize: '1rem',
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
                        // FOCUS: Added group-focus states to mirror group-hover
                        className="text-5xl text-white/80 group-hover/poster:text-white  group-focus/poster:text-white 
                     transition-transform duration-200 drop-shadow-lg"
                    />
                </div>}
                {/* YOUR LOGIC FOR RATING: Unchanged. It will only show if not a dummy */}
                {!dummy && stream.rating > 0 && (
                    <p style={{ fontSize: '1.2rem' }} className="flex items-center self-end font-bold text-primary-focus [text-shadow:_0_1px_4px_#000]">
                        <FaStar className='mr-1' /> {stream.rating}
                    </p>
                )}
            </>
        )
    }
    return (
        <button
            onClick={onClick}
            ref={postRef}
            className="relative group/poster w-full h-full bg-background-secondary rounded-lg overflow-hidden transform 
                     hover:-translate-y-1 transition-transform duration-200 cursor-pointer shadow-lg 
                     focus:outline-none focus:ring-4 focus:ring-primary-focus focus:z-10"
        >
            {stream.imageUrl && stream.imageUrl !== '' ? (<img
                src={stream.imageUrl}
                alt={stream.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => (e.currentTarget.style.display = 'none')}
            />) : (
                // THEME: Changed bg-gray-700 to bg-background-secondary
                <div className="bg-background-secondary w-full h-full flex flex-col justify-between p-2 inset-0">
                    {content(true)}
                </div>
            )}
            {/* FOCUS: Added group-focus to make overlay appear on focus */}
            <div className="absolute inset-0 bg-black/85 p-2 flex flex-col justify-between 
                         opacity-0 group-hover/poster:opacity-100 group-focus/poster:opacity-100 
                         transition-opacity duration-300">
                {content()}
            </div>
        </button>
    )
}