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
  // This now correctly accepts the inner `PingValue` struct.
  pub fn ping(&self, payload: PingValue) -> crate::Result<PingResponse> {
    Ok(PingResponse {
      value: payload.value,
    })
  }

  // This now correctly accepts the inner `PlayFullscreenValue` struct.
  pub fn play_fullscreen(&self, _payload: PlayFullscreenValue) -> crate::Result<()> {
    println!("'play_fullscreen' is only available on mobile.");
    Ok(())
  }

  // This function takes no arguments, so it is already correct.
  pub fn force_stop(&self) -> crate::Result<()> {
    println!("'force_stop' is only available on mobile.");
    Ok(())
  }
}