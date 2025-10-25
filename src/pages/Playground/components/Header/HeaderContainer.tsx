import { useEnvStore } from "../../../../store/envStore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const HeaderContainer = ({ children }: { children: any }) => {
    
    const device = useEnvStore(state => state.device);

    return (
        <header className={`flex items-center justify-between ${device === 'android' ? 'pt-8' : 'pt-2'} pb-2 px-4 border-b border-border-primary bg-background-secondary/80 backdrop-blur-sm flex-shrink-0 z-10`}>
            <div className="flex items-center space-x-8 w-full">
                <div id="main-nav" className="flex items-center space-x-1 w-full">
                    {children}
                </div>
            </div>
        </header>
    )
}

