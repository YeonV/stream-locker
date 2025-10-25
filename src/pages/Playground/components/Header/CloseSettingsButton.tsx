import { FiX } from "react-icons/fi"

export const CloseSettingsButton = () => {
  return (
    <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-background-glass"><FiX size={24} /></button>
  )
}

