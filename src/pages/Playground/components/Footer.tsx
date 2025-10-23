// Bottom Status bar with controller info
import { IoMdRewind } from "react-icons/io";
import { IoMdFastforward } from "react-icons/io";
import { IoPlaySharp } from "react-icons/io5";
import { IoPauseSharp } from "react-icons/io5";
import { useFooterStore } from "../../../store/footerStore";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const Rewind = ({label, active} : {label: string, active: boolean}) => {
  return (
    <div className={`flex space-x-2 items-center justify-center bg-background-glass border border-border-primary pl-1 pr-3 py-1 rounded-full pointer-events-none ${active ? 'opacity-100' : 'opacity-50'}`}>
        <div className="rounded-full border border-text-primary p-1 flex items-center justify-center">
            <IoMdRewind size={14} />
        </div>
        <div>
            {label}
        </div>
    </div>
  )
}

const PlayPause = ({label, active} : {label: string, active: boolean}) => {
  return (
    <div className={`flex space-x-2 items-center justify-center bg-background-glass border border-border-primary pl-1 pr-3 py-1 rounded-full pointer-events-none ${active ? 'opacity-100' : 'opacity-50'}`}>
        <div className="w-6 h-6 rounded-full border border-text-primary p-1 flex items-center justify-center">
            <IoPlaySharp size={7} />
            <IoPauseSharp size={7} />
        </div>
        <div>
            {label}
        </div>
    </div>
  )
}

const Forward = ({label, active} : {label: string, active: boolean}) => {
  return (
    <div className={`flex space-x-2 items-center justify-center bg-background-glass border border-border-primary pl-1 pr-3 py-1 rounded-full pointer-events-none ${active ? 'opacity-100' : 'opacity-50'}`}>
        <div className="rounded-full border border-text-primary p-1 flex items-center justify-center">
            <IoMdFastforward size={14} />
        </div>
        <div>
            {label}
        </div>
    </div>
  )
}

const Footer = () => {
    const play = useFooterStore(state => state.play);
    const rewind = useFooterStore(state => state.rewind);
    const forward = useFooterStore(state => state.forward);
    
    const items = [play, rewind, forward].filter(item => item && item !== '');

    const [isRewindActive, setIsRewindActive] = useState(false);
    const [isPlayActive, setIsPlayActive] = useState(false);
    const [isForwardActive, setIsForwardActive] = useState(false);

    useHotkeys('MediaRewind', () => {
      if (rewind && rewind !== '') {
        setIsRewindActive(true);
        setTimeout(() => setIsRewindActive(false), 200);
      }
    }, [rewind]);

    useHotkeys('MediaPlayPause', () => {
      if (play && play !== '') {
        setIsPlayActive(true);
        setTimeout(() => setIsPlayActive(false), 200);
      }
    }, [play]);

    useHotkeys('MediaFastForward', () => {
      if (forward && forward !== '') {
        setIsForwardActive(true);
        setTimeout(() => setIsForwardActive(false), 200);
      }
    }, [forward]);

    return (
        <footer className={`w-full bg-black border-t border-border-primary py-1 px-4 flex ${items.length === 1 ? 'justify-center' : 'justify-between'} items-center text-text-primary text-sm`}>
        {rewind && rewind !== '' && <Rewind label={rewind} active={isRewindActive} />}
        {play && play !== '' && <PlayPause label={play} active={isPlayActive} />}
        {forward && forward !== '' && <Forward label={forward} active={isForwardActive} />}
        </footer>
    )
}

export default Footer