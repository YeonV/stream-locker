use serde::de::DeserializeOwned;
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_streamlockerplayer);

// This function is perfect as is. It registers our Kotlin class.
pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<Streamlockerplayer<R>> {
  #[cfg(target_os = "android")]
  // IMPORTANT: The first argument must match your Android namespace/package.
  // The second argument is the NAME of the Kotlin class.
  let handle = api.register_android_plugin("com.yeonv.streamlocker", "StreamLockerPlayerPlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_streamlockerplayer)?;
  Ok(Streamlockerplayer(handle))
}

/// Access to the streamlockerplayer APIs.
pub struct Streamlockerplayer<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Streamlockerplayer<R> {
  // Our new play_fullscreen method
  pub fn play_fullscreen(&self, payload: PlayFullscreenRequest) -> crate::Result<()> {
    self
      .0
      .run_mobile_plugin("playFullscreen", payload)
      .map_err(Into::into)
  }

  // Our new force_stop method
  pub fn force_stop(&self) -> crate::Result<()> {
    self
      .0
      // forceStop takes no arguments, so we pass `()`
      .run_mobile_plugin("forceStop", ())
      .map_err(Into::into)
  }
}