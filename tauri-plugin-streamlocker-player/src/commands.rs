use tauri::{command, AppHandle, Runtime};

use crate::models::*;
// use crate::models::{PingRequest, PingResponse}; // Import PingRequest and PingResponse if defined in models.rs
use crate::Result;
use crate::StreamlockerplayerExt; // Import the extension trait defined in lib.rs

#[command]
pub(crate) async fn play_fullscreen<R: Runtime>(
    app: AppHandle<R>,
    payload: PlayFullscreenRequest,
) -> Result<()> {
    // Corrected: use streamlockerplayer() without the underscore
    app.streamlockerplayer().play_fullscreen(payload)
}

#[command]
pub(crate) async fn force_stop<R: Runtime>(
    app: AppHandle<R>
) -> Result<()> {
    // Corrected: use streamlockerplayer() without the underscore
    app.streamlockerplayer().force_stop()
}

#[command]
pub(crate) async fn ping<R: Runtime>(
    app: AppHandle<R>,
    payload: PingRequest,
) -> Result<PingResponse> {
    // Corrected: use streamlockerplayer() without the underscore
    app.streamlockerplayer().ping(payload)
}