/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom';
import VirtualList from 'react-tiny-virtual-list';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FiLogOut, FiMenu, FiSettings, FiStopCircle, FiX } from 'react-icons/fi';
import Player from '../../../components/Player';
import ChannelList from '../../../components/ChannelList';
import logo from '../../../assets/logo.png';
import type { Playlist } from '../../../types/playlist';
import { useDebugStore } from '../../../store/debugStore';
import yz from '../../../assets/yz.png';

export const WebAndApkPortraitLayout = (props: any) => {
  const {
    apk, isSidebarOpen, setIsSidebarOpen,
    availablePlaylists, selectedPlaylistId, handlePlaylistChange,
    viewMode, setViewMode, searchTerm, setSearchTerm,
    isLoading, error, groupedChannels, filteredChannels, handleChannelClick,
    handleLogout, handleTakeover, stopAndRelease, lockStatus,
    hasXtreamPlaylists
  } = props;
  const { toggleConsole } = useDebugStore();
  return (
    <div 
      className={`relative h-screen w-screen bg-gray-900 text-white overflow-hidden md:flex`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <aside className={`absolute top-0 left-0 h-full w-64 bg-gray-800 flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center p-4 border-b border-gray-700 shrink-0">
            <h2 className="text-xl font-bold">Playlists</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden"><FiX size={24} /></button>
          </div>
          {availablePlaylists.length > 0 ? (<select value={selectedPlaylistId || ''} onChange={handlePlaylistChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md">{availablePlaylists.map((p: Playlist) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>) : (<p className="text-sm text-gray-400">No playlists found.</p>)}
        </div>
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold mb-2">Channels</h2>
          <div className="flex bg-gray-700 rounded-md p-1 mb-4">
            <button onClick={() => setViewMode('grouped')} className={`flex-1 py-1 text-sm rounded-md ${viewMode === 'grouped' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}>Grouped</button>
            <button onClick={() => setViewMode('flat')} className={`flex-1 py-1 text-sm rounded-md ${viewMode === 'flat' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}>Flat</button>
          </div>
          {viewMode === 'flat' && <input type="text" placeholder="🔎 Search channels..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" />}
        </div>
        <div className="flex-1 overflow-y-hidden">
          {isLoading && <p className="p-4">Loading playlist...</p>}
          {error && <p className="p-4 text-red-400 text-sm">{error}</p>}
          {!isLoading && !error && (
            <>
              {viewMode === 'grouped' && <ChannelList groupedChannels={groupedChannels} onChannelClick={handleChannelClick} />}
              {viewMode === 'flat' && (
                <div className="h-full">
                  <AutoSizer>
                    {({ height, width }) => (<VirtualList width={width} height={height} itemCount={filteredChannels.length} itemSize={44} renderItem={({ index, style }) => {const channel = filteredChannels[index]; return (<div key={channel.url + index} style={style}><button onClick={() => handleChannelClick(channel.url)} className="w-full text-left p-2 rounded hover:bg-gray-600 text-sm flex items-center space-x-2 h-11">{(channel.logo && channel.logo !== '') ? <img src={channel.logo} alt="" className="w-8 h-8 object-contain rounded-sm bg-gray-700" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <div className="w-8 h-8 bg-gray-700 rounded-sm flex items-center justify-center text-xs text-gray-400">N/A</div>}<span className="flex-1 truncate">{channel.name}</span></button></div>);}}/>)}
                  </AutoSizer>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full">
        <header className={`flex justify-between items-center ${apk ? 'px-4 pt-6 pb-2' : 'p-4'} bg-gray-800 border-b border-gray-700 shrink-0`}>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden"><FiMenu size={24} /></button>
            <img src={logo} alt="Logo" className={`${apk ? 'w-8 h-8' : 'w-12 h-12'} rounded-full`} onClick={() => toggleConsole()} />
            <div><h1 className="text-xl font-bold">Stream Locker</h1></div>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            {window.location.origin === "https://yeonv.github.io" && <Link to="/download"><button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Download App</button></Link>}
            {lockStatus === 'ACQUIRED' && <button onClick={stopAndRelease} className={`px-4 py-2 font-semibold text-white bg-yellow-600 rounded-md hover:bg-yellow-700`}>Stop Stream</button>}
            {hasXtreamPlaylists && <Link to="/playground" className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"><img src={yz} width={24} /></Link>}
            <Link to="/settings"><button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"><FiSettings size={24} className='mr-2' />Settings</button></Link>
            {/* <button onClick={handleTakeover} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"><FiRefreshCcw size={24} className='mr-2' />Reload</button> */}
            {/* <button onClick={handleTakeover} title="Play Here" className={`p-2 rounded-full hover:bg-gray-700 ${lockStatus === 'LOCKED_BY_OTHER' ? 'text-blue-400 animate-pulse' : 'hidden'}`} > <FiRefreshCcw size={24} /></button> */}
            <button onClick={handleLogout} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center"><FiLogOut size={24} className='mr-2' />Logout</button>
          </div>
        </header>
        <div className="flex-1 p-4 max-h-[calc(100vh-145px)] md:max-h-[calc(100vh-81px)]"><Player onRequestTakeover={handleTakeover} /></div>
        <nav className={`md:hidden fixed bottom-0 left-0 w-full bg-gray-800 border-t border-gray-700 flex justify-around items-center ${apk ? 'pb-2' : ''} h-16`}>
          <Link to="/settings" className="flex flex-col items-center justify-center text-gray-400 hover:text-white"><FiSettings size={24} /><span className="text-xs mt-1">Settings</span></Link>
          <button onClick={stopAndRelease} className={`flex flex-col items-center justify-center text-yellow-400 hover:text-yellow-300 ${lockStatus !== 'ACQUIRED' ? 'hidden' : 'flex'}`}><FiStopCircle size={24} /><span className="text-xs mt-1">Stop</span></button>
          {/* <button onClick={handleTakeover} className="flex flex-col items-center justify-center text-gray-400 hover:text-white"><FiRefreshCcw size={24} /><span className="text-xs mt-1">Reload</span></button> */}
          {/* <button onClick={handleTakeover} title="Play Here" className={`p-2 rounded-full hover:bg-gray-700 ${lockStatus === 'LOCKED_BY_OTHER' ? 'text-blue-400 animate-pulse' : 'hidden'}`} > <FiRefreshCcw size={24} /></button> */}
          <button onClick={handleLogout} className="flex flex-col items-center justify-center text-gray-400 hover:text-white"><FiLogOut size={24} /><span className="text-xs mt-1">Logout</span></button>
        </nav>
        {isSidebarOpen && (<div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black opacity-50 z-30"></div>)}
      </main>
    </div>
  );
};
