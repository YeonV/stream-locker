import { useEffect, useState } from "react"
import { FaApple, FaLinux, FaAndroid, FaWindows } from "react-icons/fa";
import logo from '../assets/logo.png';

export type ReleaseType = {
  name: string
  assets: {
    browser_download_url: string
    name: string
  }[]
  tag_name: string
  prerelease: boolean
}

const DownloadPage = () => {
    const [releases, setReleases] = useState<ReleaseType[]>([])

    useEffect(() => {
        const get = async () => {
        const res = await fetch('https://api.github.com/repos/YeonV/Stream-Locker/releases')

        const releases_with_pre = await res.json()
        // console.log(releases_with_pre)
        const releases_new: ReleaseType[] = releases_with_pre.filter((r: ReleaseType) => r.prerelease === false)
        setReleases(releases_new)
        
        }
        get()
  }, [])
  if (releases.length === 0) {
    return <div>Loading...</div>
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <img src={logo} alt="Logo" className="w-80 h-80  rounded-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-4 mt-20">
      {releases[0].assets.map(asset => {
        if (asset.name.toLowerCase().includes('win') || asset.name.toLowerCase().includes('msi')) {
          return (
            <div key={asset.name}>
              <a href={asset.browser_download_url} download>
                <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 w-full" title={asset.name}>
                  <FaWindows className="inline-block mr-2" />
                  Windows
                </button>
              </a>
            </div>
          )
        }
        if (asset.name.toLowerCase().includes('mac') || asset.name.toLowerCase().includes('dmg')) {
          return (
            <div key={asset.name}>
              <a href={asset.browser_download_url} download>
                <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 w-full" title={asset.name}>
                  <FaApple className="inline-block mr-2" />
                  MacOS
                </button>
              </a>
            </div>
          )
        }
        if (asset.name.toLowerCase().includes('linux') || asset.name.toLowerCase().includes('appimage')) {
          return (
            <div key={asset.name}>
              <a href={asset.browser_download_url} download>
                <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 w-full" title={asset.name}>
                  <FaLinux className="inline-block mr-2" />
                  Linux
                </button>
              </a>
            </div>
          )
        }
        if (asset.name.toLowerCase().includes('apk')) {
          return (
            <div key={asset.name}>
              <a href={asset.browser_download_url} download>
                <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 w-full" title={asset.name}>
                  <FaAndroid className="inline-block mr-2" />
                  Android
                </button>
              </a>
            </div>
          )
        }
        return null
      })}
      </div>
    </div>
      
  )
}

export default DownloadPage