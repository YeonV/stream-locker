use tauri::{AppHandle, command, Runtime};

use crate::models::*;
use crate::Result;
use crate::StreamlockerplayerExt;

#[command]
pub(crate) async fn play_fullscreen<R: Runtime>(
    app: AppHandle<R>,
    payload: PlayFullscreenRequest,
) -> Result<()> {
    app.streamlockerplayer().play_fullscreen(payload)
}

#[command]
pub(crate) async fn force_stop<R: Runtime>(
    app: AppHandle<R>,
) -> Result<()> {
    app.streamlockerplayer().force_stop()
}