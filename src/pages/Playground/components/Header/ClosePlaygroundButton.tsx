import { FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export const ClosePlaygroundButton = () => {
  return (
    <Link to="/dashboard" className="p-2 rounded-full hover:bg-background-glass"><FiX size={24} /></Link>
  )
}

