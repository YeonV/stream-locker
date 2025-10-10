import { invoke } from '@tauri-apps/api/core'

export async function ping(value: string): Promise<string | null> {
  return await invoke<{value?: string}>('plugin:streamlocker-player|ping', {
    payload: {
      value,
    },
  }).then((r) => (r.value ? r.value : null));
}

export async function playFullscreen(streamUrl: string): Promise<void> {
  return await invoke('plugin:streamlocker-player|play_fullscreen_command', {
    payload: {
      streamUrl,
    }
  });
}
export async function forceStop(): Promise<void> {
  return await invoke('plugin:streamlocker-player|force_stop_command');
}
