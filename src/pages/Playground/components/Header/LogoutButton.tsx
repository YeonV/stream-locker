import { FiLogOut } from "react-icons/fi"
import { supabase } from "../../../../lib/supabase";

export const LogoutButton = () => {
    const handleLogout = () => supabase.auth.signOut();
    return (
        <button onClick={handleLogout} title="Logout" className="p-2 rounded-full hover:bg-background-glass"><FiLogOut size={24} /></button>
    )
}