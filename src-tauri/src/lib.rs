// src-tauri/src/lib.rs

// Keep these 'use' statements, they don't hurt anything
// use tauri::{webview::WebviewWindowBuilder, WebviewUrl};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // You can leave the port definition, it won't be used
  // let port: u16 = 9527;

  tauri::Builder::default()
    .plugin(tauri_plugin_videoplayer::init())
    // 1. Comment out the localhost plugin initialization
    // .plugin(tauri_plugin_localhost::Builder::new(port).build()) 
    .setup(|app| {
      // Your existing logging setup logic
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // 2. Comment out the localhost window creation logic
      // let url = format!("http://localhost:{}", port).parse().unwrap();
      // WebviewWindowBuilder::new(app, "main".to_string(), WebviewUrl::External(url))
      //     .title("Your App Title")
      //     .build()?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}