import { useEffect, useState } from "react"

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
        const res = await fetch('https://api.github.com/repos/YeonV/stream-locker/releases')

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
    <div>
      <div>DownloadPage</div>
      {releases[0].assets.map(asset => (
        <div key={asset.name}>
          <a href={asset.browser_download_url} download>
            {asset.name}
          </a>
        </div>
      ))}
    </div>
  )
}

export default DownloadPage