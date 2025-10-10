use serde::Serialize;
use tauri::{
    plugin::{Builder, TauriPlugin, PluginHandle, PluginApi}, // <-- THE FIX IS HERE
    Manager,
    Runtime, State,
};

// This struct defines the payload for the 'play' command.
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct PlayArgs {
    stream_url: String,
}

// 1. This is our plugin struct.
pub struct StreamlockerPlayer<R: Runtime>(PluginHandle<R>);

// 2. We add methods to it.
impl<R: Runtime> StreamlockerPlayer<R> {
    // This method now works because `PluginApi` brings `run_mobile_plugin` into scope for `self.0`.
    pub fn play_fullscreen(&self, stream_url: String) -> Result<(), String> {
        self.0
            .run_mobile_plugin("playFullscreen", PlayArgs { stream_url })
            .map_err(|e| e.to_string())
    }

    pub fn force_stop(&self) -> Result<(), String> {
        self.0
            .run_mobile_plugin("forceStop", ())
            .map_err(|e| e.to_string())
    }
}

// These are the Tauri commands called from JavaScript.
#[tauri::command]
fn play_fullscreen_command<R: Runtime>(
    state: State<'_, StreamlockerPlayer<R>>,
    stream_url: String,
) -> Result<(), String> {
    state.play_fullscreen(stream_url)
}

#[tauri::command]
fn force_stop_command<R: Runtime>(
    state: State<'_, StreamlockerPlayer<R>>
) -> Result<(), String> {
    state.force_stop()
}

// The initialization function for the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("streamlocker-player")
        .invoke_handler(tauri::generate_handler![
            play_fullscreen_command,
            force_stop_command
        ])
        .setup(|app, _api| {
            app.manage(StreamlockerPlayer(app.clone()));
            Ok(())
        })
        .build()
}