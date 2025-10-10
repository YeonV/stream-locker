use serde::{Deserialize, Serialize};

// --- PING COMMAND MODELS (from the template) ---
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PingRequest {
  pub value: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResponse {
  pub value: Option<String>,
}

// --- OUR CUSTOM COMMAND MODELS ---

// Arguments for the play_fullscreen command
#[derive(Debug, Serialize, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayFullscreenRequest {
  pub stream_url: String,
}

// An empty response for our custom commands
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CommandResponse {}