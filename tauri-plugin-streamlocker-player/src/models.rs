use serde::{Deserialize, Serialize};

// --- PING COMMAND MODELS ---

// This is the inner payload, as expected by the plugin methods.
#[derive(Debug, Serialize, Deserialize)]
pub struct PingValue {
  pub value: Option<String>,
}

// This is the top-level request struct, as sent from JS and received by the command.
#[derive(Debug, Serialize, Deserialize)]
pub struct PingRequest {
  pub payload: PingValue,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResponse {
  pub value: Option<String>,
}

// --- OUR CUSTOM COMMAND MODELS ---

// This is the inner payload for the play_fullscreen command.
#[derive(Debug, Serialize, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayFullscreenValue {
  pub stream_url: String,
}

// This is the top-level request struct for the command.
#[derive(Debug, Serialize, Clone, Deserialize)]
pub struct PlayFullscreenRequest {
    pub payload: PlayFullscreenValue,
}

// An empty response for our custom commands that don't return data.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CommandResponse {}