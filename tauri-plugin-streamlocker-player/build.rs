const COMMANDS: &[&str] = &["ping", "play_fullscreen", "force_stop"];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
