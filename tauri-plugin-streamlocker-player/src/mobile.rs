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
  // The ping command is correct because it has an explicit return type.
  pub fn ping(&self, payload: PingValue) -> crate::Result<PingResponse> {
    self
      .0
      .run_mobile_plugin("ping", payload)
      .map_err(Into::into)
  }

  // This is the function that calls our native 'playFullscreen' command.
  pub fn play_fullscreen(&self, payload: PlayFullscreenValue) -> crate::Result<()> {
    // --- THE FIX ---
    // We explicitly tell the compiler to expect a `CommandResponse` from Kotlin.
    self
      .0
      .run_mobile_plugin::<CommandResponse>("playFullscreen", payload)
      .map(|_| ()) // Now we can safely discard the (empty) response.
      .map_err(Into::into)
  }

  // This is the function that calls our native 'forceStop' command.
  pub fn force_stop(&self) -> crate::Result<()> {
    // --- THE FIX ---
    // We do the same here, expecting an empty CommandResponse.
    self
      .0
      .run_mobile_plugin::<CommandResponse>("forceStop", ())
      .map(|_| ()) // And discard it.
      .map_err(Into::into)
  }
}
