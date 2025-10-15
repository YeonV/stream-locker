import { useState, useEffect,  } from 'react';
import { ProfileInfo } from './components/ProfileInfo';
import type { Profile } from '../../types/playlist';
import { useApiStore } from '../../store/apiStore';

export const GeneralView = () => {
    const [profile, setProfile] = useState<Profile | null>(null);

    const xtreamApi = useApiStore((state) => state.xtreamApi);

    useEffect(() => {
        if (!xtreamApi) return        
        const fetchData = async () => {
            setProfile(await xtreamApi.getProfile())
        };        
        fetchData();
    }, [xtreamApi]);


    return (
        <div className="h-screen w-screen bg-gray-900 text-white p-8 overflow-auto">
            <div className="max-w-full mx-auto space-y-8 px-4">
                {profile && <ProfileInfo profile={profile} />}
            </div>
        </div>
    );
};