use serde::{Deserialize, Serialize};

// Arguments for the play_fullscreen command
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayFullscreenRequest {
  pub stream_url: String,
}

// We can define an empty response if we don't need to return data
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct CommandResponse {}