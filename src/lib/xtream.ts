// import profile from '../mocks/profile.json';
// import moviesStreams from '../mocks/movies_streams.json'; 
// import moviesInfo from '../mocks/movies_info.json';
// import moviesCategories from '../mocks/movies_categories.json';
// import series from '../mocks/series.json';
// import seriesInfo from '../mocks/series_info.json';
// import seriesCategories from '../mocks/series_categories.json'; 
// import liveCategories from '../mocks/live_categories.json';
// import liveStreams from '../mocks/live_streams.json';
// import shortEpg from '../mocks/live_stream_info_shortepg.json'; 
import type { Category, EpgListing, Movie, Serie, Profile } from '../types/playlist';


const decodeBase64Utf8 = (base64: string): string => {
  if (!base64) return '';
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    console.error('Failed to decode Base64 string as UTF-8:', base64, e);
    try { return atob(base64); } catch { return 'Invalid Encoded Data'; }
  }
};

type DevOptions = { mode?: 'dev'; };
type ProdOptions = { 
  mode: 'prod'; 
  url: string; 
  username: string; 
  password?: string; 
};
type XtreamOptions = DevOptions | ProdOptions;

// The main Xtream API class
export class Xtream {
    private mode: 'dev' | 'prod';
    private url: string;
    private username: string;
    private password?: string;
    private baseUrl: string;
    
    constructor(options: XtreamOptions = {}) {
      this.mode = options.mode || 'dev';

      if (this.mode === 'prod') {
        if (!('url' in options) || !('username' in options)) {
          throw new Error("URL and Username are required for 'prod' mode.");
        }
        this.url = options.url;
        this.username = options.username;
        this.password = options.password;

        console.log('Xtream API initialized in PRODUCTION mode.');
      } 
      else {
        this.url = '';
        this.username = '';
        console.log('Xtream API initialized in DEVELOPMENT mode (using mock data).');
      }

      this.baseUrl = `${this.url}/player_api.php?username=${this.username}&password=${this.password || ''}&action=`;
    }


  // Method to get live categories
  public async getLiveCategories(): Promise<Category[]> {
      const fullUrl = `${this.baseUrl}get_live_categories`;
      try {
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error(`Failed to fetch live categories: ${response.status}`);
        
        return await response.json();
      } catch (error) {
        console.error("PROD mode: syncLiveCategories() failed.", error);
        return [];
      }
  }

  public async getProfile(): Promise<Profile | null> {
      const fullUrl = `${this.baseUrl}get_profile`;
      try {
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("PROD mode: getProfile() failed.", error);
        return null;
      }
  }

  public async getMoviesStreams(categoryId?: string): Promise<Movie[]> {
    const fullUrl = `${this.baseUrl}get_vod_streams${categoryId ? `&category_id=${categoryId}` : ''}`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`Failed to fetch movie streams: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("PROD mode: getMoviesStreams() failed.", error);
      return [];
    }
  }

  public async getMovieInfo(movieId: number) {
      const fullUrl = `${this.baseUrl}get_vod_info&vod_id=${movieId}`;
      try {
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch movie info: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`PROD mode: getMovieInfo(${movieId}) failed.`, error);
        return null;
      }
  }

  public async getSeries(): Promise<Serie[]> {
    const fullUrl = `${this.baseUrl}get_series`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`Failed to fetch series: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("PROD mode: getSeries() failed.", error);
      return [];
    }
  }

  public async getSeriesInfo(seriesId: number) {
    const fullUrl = `${this.baseUrl}get_series_info&series_id=${seriesId}`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch series info: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`PROD mode: getSeriesInfo(${seriesId}) failed.`, error);
      return null;
    }
  }

  public async getMoviesCategories(): Promise<Category[]> {
    const fullUrl = `${this.baseUrl}get_vod_categories`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`Failed to fetch movie categories: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("PROD mode: getMoviesCategories() failed.", error);
      return [];
    }
  }

  public async getSeriesCategories(): Promise<Category[]> {
    const fullUrl = `${this.baseUrl}get_series_categories`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`Failed to fetch series categories: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("PROD mode: getSeriesCategories() failed.", error);
      return [];
    }
  }

  public async getLiveStreams(categoryId?: string) {
    const fullUrl = `${this.baseUrl}get_live_streams${categoryId ? `&category_id=${categoryId}` : ''}`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`Failed to fetch live streams: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("PROD mode: getLiveStreams() failed.", error);
      return [];
    }
  }

  public async getShortEpg(streamId: number): Promise<{ epg_listings: EpgListing[] } | null> {
      const fullUrl = `${this.baseUrl}get_short_epg&stream_id=${streamId}`;
      try {
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch EPG: ${response.status} ${response.statusText}`);
        }
        const rawEpgData = await response.json();
        if (!rawEpgData || !rawEpgData.epg_listings) {
            throw new Error('Invalid EPG data structure received from server.');
        }
        const decodedListings = rawEpgData.epg_listings.map((listing: EpgListing) => ({
          ...listing,
          title: decodeBase64Utf8(listing.title),
          description: decodeBase64Utf8(listing.description),
        }));
        return { ...rawEpgData, epg_listings: decodedListings };
      } catch (error) {
        console.error(`PROD mode: getShortEpg(${streamId}) failed.`, error);
        return null;
      }
  }
}