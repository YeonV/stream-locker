import { FiSettings } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export const SettingsButton = () => {
  return (
    <Link to="/playground/settings" title="Settings" className="p-2 rounded-full hover:bg-background-glass"><FiSettings size={24} /></Link>
  )
}

