use serde::de::DeserializeOwned;
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_streamlocker_player);

// This function registers our Kotlin class with the Tauri runtime.
pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<Streamlockerplayer<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin("com.yeonv.streamlocker.player", "StreamLockerPlayerPlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_streamlocker_player)?;
  Ok(Streamlockerplayer(handle))
}

/// Access to the streamlocker-player APIs.
pub struct Streamlockerplayer<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Streamlockerplayer<R> {
  // The example ping command, kept for consistency.
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    self
      .0
      .run_mobile_plugin("ping", payload)
      .map_err(Into::into)
  }

  // This is the function that calls our native 'playFullscreen' command.
  pub fn play_fullscreen(&self, payload: PlayFullscreenRequest) -> crate::Result<()> {
    self
      .0
      .run_mobile_plugin("playFullscreen", payload)
      .map(|_| ()) // Discard the empty JSObject return value from mobile
      .map_err(Into::into)
  }

  // This is the function that calls our native 'forceStop' command.
  pub fn force_stop(&self) -> crate::Result<()> {
    self
      .0
      .run_mobile_plugin("forceStop", ())
      .map(|_| ()) // Discard the empty JSObject return value from mobile
      .map_err(Into::into)
  }
}