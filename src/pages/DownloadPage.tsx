import { useEffect, useState } from "react"
import logo from '../assets/logo.png';         
import { DownloadBinary, type ReleaseType } from "../components/DownloadBinary";

const DownloadPage = () => {
    const [releases, setReleases] = useState<ReleaseType[]>([])

    useEffect(() => {
        const get = async () => {
        const res = await fetch('https://api.github.com/repos/YeonV/Stream-Locker/releases')
        const releases_with_pre = await res.json()
        const releases_new: ReleaseType[] = releases_with_pre.filter((r: ReleaseType) => r.prerelease === false)
        setReleases(releases_new)
        
        }
        get()
  }, [])
  if (releases.length === 0) {
    return null
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <img src={logo} alt="Logo" className="w-80 h-80  rounded-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-4 mt-20">
      {releases[0].assets.map(asset => {
        if (asset.name.toLowerCase().includes('win') || asset.name.toLowerCase().includes('msi')) {
          return <DownloadBinary asset={asset} name="Windows" key={asset.name} />;
        }
        if (asset.name.toLowerCase().includes('mac') || asset.name.toLowerCase().includes('dmg')) {
          return <DownloadBinary asset={asset} name="MacOS" key={asset.name} />;
        }
        if (asset.name.toLowerCase().includes('linux') || asset.name.toLowerCase().includes('appimage')) {
          return <DownloadBinary asset={asset} name="Linux" key={asset.name} />;
        }
        if (asset.name.toLowerCase().includes('apk')) {
          return <DownloadBinary asset={asset} name="Android" key={asset.name} />;
        }
      })}
      </div>
    </div>
  )
}

export default DownloadPage