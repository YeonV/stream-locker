use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<Streamlockerplayer<R>> {
  Ok(Streamlockerplayer(app.clone()))
}

/// Access to the streamlocker-player APIs on desktop.
pub struct Streamlockerplayer<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Streamlockerplayer<R> {
  // The existing ping command for testing.
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    Ok(PingResponse {
      value: payload.value,
    })
  }

  // A stub implementation for play_fullscreen.
  // It prints a warning and does nothing, but allows the code to compile.
  pub fn play_fullscreen(&self, _payload: PlayFullscreenRequest) -> crate::Result<()> {
    println!("'play_fullscreen' is only available on mobile.");
    Ok(())
  }

  // A stub implementation for force_stop.
  pub fn force_stop(&self) -> crate::Result<()> {
    println!("'force_stop' is only available on mobile.");
    Ok(())
  }
}