// src-tauri/src-lib.rs

// We can keep the use statements, they don't harm anything if unused.
// use tauri::{webview::WebviewWindowBuilder, WebviewUrl};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Start building our application.
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_videoplayer::init());
    // We do NOT add libmpv here by default.

    // --- THIS IS THE SURGICAL STRIKE ---
    // This `#[cfg(windows)]` attribute is a direct command to the compiler.
    // This entire block of code will only exist when compiling for a Windows target.
    #[cfg(windows)]
    {
        // If we are on Windows, we add the libmpv plugin to the builder.
        builder = builder.plugin(tauri_plugin_libmpv::init());
    }
    // --- END OF STRIKE ---

    // Now, we continue building with the potentially modified builder.
    builder
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
