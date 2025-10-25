import { useCallback, useEffect, useState } from "react"
import { DownloadBinary, type ReleaseType } from "../DownloadBinary"
import { version } from "../../../package.json"
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import semver from "semver"
import { useEnvStore } from "../../store/envStore";


interface DownloadAndroidState {
  releases: ReleaseType[]
  isLoading: boolean
  error: string | null
}

export const DownloadAndroid = () => {
  const device = useEnvStore(state => state.device);
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

  // Extract downloader code from release body
  const extractDownloaderCode = useCallback((releaseBody: string): string | null => {
    const regex = /!\[downloadercode\]\([^)]*\)\s*```\s*(\d+)\s*```/;
    const matchResult = releaseBody.match(regex);
    
    if (matchResult && matchResult[1]) {
      return matchResult[1];
    }
    return null;
  }, []);

  // Copy downloader code to clipboard
  const copyDownloaderCode = useCallback(async (releaseBody: string) => {
    const downloaderCode = extractDownloaderCode(releaseBody);
    
    if (downloaderCode && downloaderCode !== "00000000") {
      try {
        await writeText(downloaderCode);
        console.log("Downloader Code copied to clipboard:", downloaderCode);
      } catch (error) {
        console.error("Failed to copy downloader code to clipboard:", error);
      }
    } else {
      console.log("Downloader Code not found in the release description.");
    }
  }, [extractDownloaderCode]);

  // Auto-copy downloader code when releases are fetched and there's an update
  useEffect(() => {
    if (releases.length > 0) {
      const latestRelease = releases[0];
      const currentVersion = version;
      const latestVersion = latestRelease.tag_name.replace(/^v/, '');
      const hasUpdate = semver.gt(latestVersion, currentVersion);
      
      if (hasUpdate && latestRelease.body) {
        copyDownloaderCode(latestRelease.body);
      }
    }
  }, [releases, copyDownloaderCode]);

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

  if (device === 'android') {
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
  } else {
    // Update available, Downloader Code copied to clipboard
    return (
      <div className="px-4 py-2 rounded-md text-color-on-primary bg-background-primary hover:bg-background-glass cursor-default w-max text-sm">
        Update Code in clipboard
      </div>
    )
  }

}