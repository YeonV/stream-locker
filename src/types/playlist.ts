interface BasePlaylist {
  id: string;
  name: string;
}

export interface M3uPlaylist extends BasePlaylist {
  type: 'm3u';
  url: string;
  epgUrl?: string;
}

export interface XtreamPlaylist extends BasePlaylist {
  type: 'xtream';
  serverUrl: string;
  username: string;
  password?: string;
  epgUrl?: string; // Xtream providers also often provide a separate EPG URL
}

export type Playlist = M3uPlaylist | XtreamPlaylist;

// Define a type for a parsed channel item
export interface Channel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

export type GroupedChannels = {
  [groupName: string]: Channel[];
};

