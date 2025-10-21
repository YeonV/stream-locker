import { useCallback, useEffect, useState } from "react"
import { DownloadBinary, type ReleaseType } from "../DownloadBinary"
import { version } from "../../../package.json"
import semver from "semver"

interface DownloadAndroidState {
  releases: ReleaseType[]
  isLoading: boolean
  error: string | null
}

const DownloadAndroid = () => {
  const [state, setState] = useState<DownloadAndroidState>({
    releases: [],
    isLoading: true,
    error: null
  })

  const fetchReleases = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('https://api.github.com/repos/YeonV/Stream-Locker/releases')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch releases: ${response.statusText}`)
      }
      
      const allReleases = await response.json()
      const stableReleases: ReleaseType[] = allReleases.filter(
        (release: ReleaseType) => !release.prerelease
      )
      
      setState(prev => ({
        ...prev,
        releases: stableReleases,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false
      }))
    }
  }, [])

  useEffect(() => {
    fetchReleases()
  }, [fetchReleases])

  const { releases, isLoading, error } = state

  if (isLoading) {
    return null
  }

  if (error) {
    return null
  }

  if (releases.length === 0) {
    return null
  }

  // Find Android APK assets from the latest release
  const latestRelease = releases[0]
  const androidAssets = latestRelease.assets.filter(asset =>
    asset.name.toLowerCase().includes('apk')
  )

  if (androidAssets.length === 0) {
    return null
  }

  // Check if there's a newer version available
  const currentVersion = version
  const latestVersion = latestRelease.tag_name.replace(/^v/, '') // Remove 'v' prefix if present
  const hasUpdate = semver.gt(latestVersion, currentVersion)

  if (!hasUpdate) {
    return null
  }


  return (
    <div className="space-y-2">
      {androidAssets.map(asset => (
        <DownloadBinary
          key={asset.name}
          asset={asset}
          name="Android"
          variant="icon"
        />
      ))}
    </div>
  )
}

export default DownloadAndroid