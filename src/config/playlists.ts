interface BuiltInPlaylist {
  id: string; // We can use a static ID for these
  name: string;
  url: string;
  epgUrl?: string;
}

export const BUILT_IN_PLAYLISTS: BuiltInPlaylist[] = [
  {
    id: 'iptv-org-de-test',
    name: 'TEST - DE',
    url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/de.m3u',
  },
  {
    id: 'iptv-org-full',
    name: 'TEST - Example',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
  },
];