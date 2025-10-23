// Bottom Status bar with controller info
import { IoMdRewind } from "react-icons/io";
import { IoMdFastforward } from "react-icons/io";
import { IoPlaySharp } from "react-icons/io5";
import { IoPauseSharp } from "react-icons/io5";
import { useFooterStore } from "../../../store/footerStore";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
// import { TbDeviceRemoteFilled } from "react-icons/tb";

const RewindIcon = ({className, onClick}: {className?: string, onClick?: (e: React.MouseEvent) => void}) => <div className={`rounded-full border border-text-primary p-1 flex items-center justify-center ${className}`} onClick={onClick}><IoMdRewind size={14} /></div>
const PlayPauseIcon = ({className, onClick}: {className?: string, onClick?: (e: React.MouseEvent) => void}) => <div className={`w-6 h-6 rounded-full border border-text-primary p-1 flex items-center justify-center ${className}`} onClick={onClick}><IoPlaySharp size={7} /><IoPauseSharp size={7} /></div>
const ForwardIcon = ({className, onClick}: {className?: string, onClick?: (e: React.MouseEvent) => void}) => <div className={`rounded-full border border-text-primary p-1 flex items-center justify-center ${className}`} onClick={onClick}><IoMdFastforward size={14} /></div>

const Chip = ({icon, label, active} : {icon: React.ReactNode, label: string, active: boolean}) => {
    return (
        <div className={`flex space-x-2 items-center justify-center bg-background-glass border border-border-primary pl-1 pr-3 py-1 rounded-full pointer-events-none ${active ? 'opacity-100' : 'opacity-50'}`}>
            {icon}
            <div>
                {label}
            </div>
        </div>
    )
}

const Rewind = ({label, active} : {label: string, active: boolean}) => {
  return (
    <Chip icon={<RewindIcon />} label={label} active={active} />
  )
}

const PlayPause = ({label, active} : {label: string, active: boolean}) => {
  return (
    <Chip icon={<PlayPauseIcon />} label={label} active={active} />
  )
}

const Forward = ({label, active} : {label: string, active: boolean}) => {
  return (
    <Chip icon={<ForwardIcon />} label={label} active={active} />
  )
}

const Footer = () => {
    const play = useFooterStore(state => state.play);
    const rewind = useFooterStore(state => state.rewind);
    const forward = useFooterStore(state => state.forward);
    const setPlay = useFooterStore(state => state.setPlay);
    // const setRewind = useFooterStore(state => state.setRewind);
    // const setForward = useFooterStore(state => state.setForward);
    
    const items = [play, rewind, forward].filter(item => item && item !== '');

    const [isRewindActive, setIsRewindActive] = useState(false);
    const [isPlayActive, setIsPlayActive] = useState(false);
    const [isForwardActive, setIsForwardActive] = useState(false);
    const [currentFocusedElement, setCurrentFocusedElement] = useState<Element | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentFocus, setCurrentFocus] = useState<'main' | 'header' | null>(null);

    // const [showFullRemote, setShowFullRemote] = useState(false);
    // const sendMediaKeyEvent = (action: 'MediaRewind' | 'MediaPlayPause' | 'MediaFastForward') => {
    //     // can we simulate media key events in browser?
    //     const event = new KeyboardEvent('keydown', {
    //         key: action,
    //         code: action,
    //         keyCode: action === 'MediaRewind' ? 412 : action === 'MediaPlayPause' ? 413 : 414,
    //         which: action === 'MediaRewind' ? 412 : action === 'MediaPlayPause' ? 413 : 414,
    //         bubbles: true
    //     });
    //     document.dispatchEvent(event);
    // }

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

    useEffect(() => {
      const handleFocusChange = () => {
        if (document.activeElement !== null && (document.activeElement !== currentFocusedElement)) {
            setCurrentFocusedElement(document.activeElement);
            if (document.activeElement.closest('main')) {
                console.log('Focus is inside <main>');
                setCurrentFocus('main');
                setPlay('Focus Header');
            }
            else if (document.activeElement.closest('header')) {
                console.log('Focus is inside <header>');
                setCurrentFocus('header');
                setPlay('Focus Main');
            } else {
                console.log('Focused Element Changed:', document.activeElement);
                setCurrentFocus(null);
            }
        }
      };

      window.addEventListener('focusin', handleFocusChange);
      return () => {
        window.removeEventListener('focusin', handleFocusChange);
      };
    }, []);

    return (
        <footer className={`flex flex-col`}>
            {/* <div id="fullRemote" className={`absolute bottom-12 right-4 bg-background-secondary border border-border-primary rounded-lg p-4 shadow-lg transition-opacity duration-300 ${showFullRemote ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="grid grid-cols-3 gap-4">
                        <RewindIcon className={`${isRewindActive ? 'bg-primary' : ''}`} onClick={(e) => {
        e.preventDefault(); 
        sendMediaKeyEvent('MediaRewind');
    }} />
                        <PlayPauseIcon className={`${isPlayActive ? 'bg-primary' : ''}`} onClick={(e) => {
        e.preventDefault(); 
        sendMediaKeyEvent('MediaPlayPause');
    }} />
                        <ForwardIcon className={`${isForwardActive ? 'bg-primary' : ''}`} onClick={(e) => {
        e.preventDefault(); 
        sendMediaKeyEvent('MediaFastForward');
    }} />
                </div>
            </div> */}
            {/* <div id="devbar" className="flex items-center justify-between">DEV || Focus:{currentFocus} | <TbDeviceRemoteFilled onClick={() => setShowFullRemote(!showFullRemote)} /></div> */}
            <div className={`w-full bg-black border-t border-border-primary py-1 px-4 flex ${items.length === 1 ? 'justify-center' : 'justify-between'} items-center text-text-primary text-sm`}>
                {rewind && rewind !== '' && <Rewind label={rewind} active={isRewindActive} />}
                {play && play !== '' && <PlayPause label={play} active={isPlayActive} />}
                {forward && forward !== '' && <Forward label={forward} active={isForwardActive} />}
            </div>
        </footer>
    )
}

export default Footer