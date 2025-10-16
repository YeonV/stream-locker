// src/types/playlist.ts

export interface BasePlaylist {
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
  epgUrl?: string;
}

export type Playlist = M3uPlaylist | XtreamPlaylist;

export interface Channel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

export type GroupedChannels = {
  [groupName: string]: Channel[];
};

export interface Serie {
  series_id: number;
  name: string;
  cover: string;
  rating_5based: string;
  last_modified: string; // <-- ADDED THIS MISSING FIELD
  category_ids?: number[];  // <-- ADDED THIS MISSING FIELD
}

export interface Movie {
  stream_id: number;
  name: string;
  stream_icon: string;
  rating_5based: number;
  added: string;
  category_id: string; // <-- ADDED THIS MISSING FIELD
  category_ids?: number[]; // <-- ADDED THIS MISSING FIELD
  container_extension?: string;
}

export interface Season {
  name: string;
  episode_count: string;
  overview: string;
  air_date: string;
  cover: string;
  cover_tmdb: string;
  season_number: number;
  cover_big: string;
  releaseDate: string;
  duration: string;
}

export interface SeriesInfo {
  seasons: Season[];
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    release_date: string;
    last_modified: string;
    rating: string;
    rating_5based: string;
    backdrop_path: string[];
    youtube_trailer: string;
    tmdb: string;
    episode_run_time: string;
    category_id: string;
    category_ids: number[];
  };
  episodes: Record<string, Episode[]>;
}

export interface PosterItem {
  id: number;
  name: string;
  imageUrl: string;
  rating: number;
  added: string;
}

export interface LiveStream {
  num: number;
  name: string;
  stream_type: 'live';
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string | null;
  added: string;
  is_adult: number;
  category_id: string;
  category_ids?: number[]; // Making optional as it's good practice
  custom_sid: string | null;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface EpgListing {
  id: string;
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
  start_timestamp: string;
  stop_timestamp: string;
  stream_id: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface Profile {
  user_info: {
    username: string;
    status: string;
    exp_date: string;
    active_cons: string;
    max_connections: string;
    allowed_output_formats: string[];
  };
  server_info: {
    time_now: string;
    timezone: string;
  };
}

export interface EpisodeInfo {
  air_date: string;
  crew: string;
  rating: number;
  id: number;
  movie_image: string;
}

export interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: EpisodeInfo;
  custom_sid: null;
  added: string;
  season: number;
  direct_source: string;
}

export type PlayableItem = 
  | { type: 'movie'; movie: Movie }
  | { type: 'series'; episode: Episode }
  | { type: 'livetv'; channel: LiveStream };