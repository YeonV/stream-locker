use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Streamlockerplayer;
#[cfg(mobile)]
use mobile::Streamlockerplayer;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the streamlockerplayer APIs.
pub trait StreamlockerplayerExt<R: Runtime> {
  fn streamlockerplayer(&self) -> &Streamlockerplayer<R>;
}

impl<R: Runtime, T: Manager<R>> crate::StreamlockerplayerExt<R> for T {
  fn streamlockerplayer(&self) -> &Streamlockerplayer<R> {
    self.state::<Streamlockerplayer<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("streamlockerplayer")
    // Replace `commands::ping` with our new commands
    .invoke_handler(tauri::generate_handler![
        commands::play_fullscreen,
        commands::force_stop
    ])
    .setup(|app, api| {
      #[cfg(mobile)]
      let streamlockerplayer = mobile::init(app, api)?;
      #[cfg(desktop)]
      let streamlockerplayer = desktop::init(app, api)?;
      app.manage(streamlockerplayer);
      Ok(())
    })
    .build()
}