import { invoke } from '@tauri-apps/api/core'

export async function ping(value: string): Promise<string | null> {
  // This one is correct because the Rust command is also named 'ping'.
  return await invoke<{value?: string}>('plugin:streamlocker-player|ping', {
    payload: {
      value,
    },
  }).then((r) => (r.value ? r.value : null));
}

export async function playFullscreen(streamUrl: string): Promise<void> {
  // THE FIX: Removed the '_command' suffix.
  return await invoke('plugin:streamlocker-player|play_fullscreen', {
    payload: {
      streamUrl,
    }
  });
}
export async function forceStop(): Promise<void> {
  // THE FIX: Removed the '_command' suffix.
  return await invoke('plugin:streamlocker-player|force_stop');
}