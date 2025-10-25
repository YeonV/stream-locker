import { CgDebug } from "react-icons/cg";
import { useDebugStore } from "../../../../store/debugStore";

export const ConsoleButton = () => {

  const { toggleConsole } = useDebugStore();

  return <button onClick={toggleConsole} title="toggleConsole" className="cursor-pointer p-2 rounded-full hover:bg-background-glass"><CgDebug size={24} /></button>
}