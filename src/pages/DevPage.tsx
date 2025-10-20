import { useState } from 'react';
import { RemoteEventLogger } from '../components/RemoteEventLogger';
import { TbDeviceRemote } from "react-icons/tb";

export const DevPage = () => {
    const [showKeylogger, setShowKeylogger] = useState(false);

    return (
        <div className="h-screen w-screen bg-gray-900 text-white p-8 overflow-auto">
            <div className="max-w-full mx-auto space-y-8 px-4">
                <div className="flex justify-between items-center">
                    <button onClick={() => setShowKeylogger(!showKeylogger)} className="p-2 rounded-full hover:bg-background-glass"><TbDeviceRemote /></button>
                </div>
                {showKeylogger && <RemoteEventLogger />}
            </div>
        </div>
    );
};