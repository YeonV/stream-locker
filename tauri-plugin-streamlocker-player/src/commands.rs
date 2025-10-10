use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::Result;
use crate::StreamlockerplayerExt;

#[command]
pub(crate) async fn play_fullscreen<R: Runtime>(
    app: AppHandle<R>,
    // This command receives the top-level request struct from JS.
    request: PlayFullscreenRequest,
) -> Result<()> {
    // We pass the inner .payload field to the internal plugin method.
    app.streamlockerplayer().play_fullscreen(request.payload)
}

#[command]
pub(crate) async fn force_stop<R: Runtime>(
    app: AppHandle<R>
) -> Result<()> {
    // This command takes no payload, so it's correct.
    app.streamlockerplayer().force_stop()
}

#[command]
pub(crate) async fn ping<R: Runtime>(
    app: AppHandle<R>,
    // This command receives the top-level request struct from JS.
    request: PingRequest,
) -> Result<PingResponse> {
    // We pass the inner .payload field to the internal plugin method.
    app.streamlockerplayer().ping(request.payload)
}