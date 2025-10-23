import { FaApple, FaLinux, FaAndroid, FaWindows } from "react-icons/fa";

export type ReleaseType = {
  name: string
  assets: {
    browser_download_url: string
    name: string
  }[]
  tag_name: string
  prerelease: boolean
  body: string
}

export const DownloadBinary = ({ asset, name, variant = "button" }: { asset: ReleaseType['assets'][number], name: string, variant?: 'button' | 'icon' }) => {
    if (variant === 'icon') {
        return (
            <a href={asset.browser_download_url} download title={asset.name} className="text-2xl text-text-primary hover:text-primary">
                {name === "MacOS" && <FaApple />}
                {name === "Windows" && <FaWindows />}
                {name === "Linux" && <FaLinux />}
                {name === "Android" && <FaAndroid />}
            </a>
        )
    }
    return (
    <div key={asset.name}>
        <a href={asset.browser_download_url} download>
        <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 w-full cursor-pointer" title={asset.name}>
            {name === "MacOS" && <FaApple className="inline-block mr-2" />}
            {name === "Windows" && <FaWindows className="inline-block mr-2" />}
            {name === "Linux" && <FaLinux className="inline-block mr-2" />}
            {name === "Android" && <FaAndroid size={24} className="inline-block mr-2" />}
            {name}
        </button>
        </a>
    </div>
)}