use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, AppHandle,
};

#[cfg(target_os = "android")]
use tauri::jni::{JNIEnv, JavaVM};

#[cfg(target_os = "android")]
use jni::objects::{JClass, JObject, JString, JValue};

// The command that will be exposed to JavaScript to play a video.
#[tauri::command]
fn play_fullscreen<R: Runtime>(app: AppHandle<R>, stream_url: String) {
    #[cfg(target_os = "android")]
    if let Err(e) = android_play_fullscreen(&app, stream_url) {
        eprintln!("[PLUGIN ERROR] play_fullscreen: {}", e);
    }
}

// The command that will be exposed to JavaScript to stop the video.
#[tauri::command]
fn force_stop<R: Runtime>(app: AppHandle<R>) {
    #[cfg(target_os = "android")]
    if let Err(e) = android_force_stop(&app) {
        eprintln!("[PLUGIN ERROR] force_stop: {}", e);
    }
}

// Helper function to get the JNI environment and call a function with it.
// This is the new, correct way for Tauri v2.
#[cfg(target_os = "android")]
fn with_jni_env<F, R>(app: &AppHandle, f: F) -> Result<R, String>
where
    F: FnOnce(JNIEnv, JClass, JObject) -> Result<R, String>,
{
    // Get the JavaVM from the AppHandle's state.
    let vm = app.state::<JavaVM>();
    let env = vm.get_env().map_err(|e| e.to_string())?;
    
    // Get the Activity object from the AppHandle.
    let activity = app.android_activity();
    
    // Replace this with your app's actual package identifier.
    let class_name = "com/yeonv/streamlocker/PlayerPlugin";
    let class = env.find_class(class_name)
        .map_err(|e| format!("Failed to find class '{}': {}", class_name, e.to_string()))?;

    f(env, class, activity.into())
}

// The internal Rust function that performs the JNI call to launch the player.
#[cfg(target_os = "android")]
fn android_play_fullscreen<R: Runtime>(app: &AppHandle<R>, stream_url: String) -> Result<(), String> {
    with_jni_env(app, |env, class, activity_obj| {
        let url_jstring: JString = env.new_string(&stream_url).map_err(|e| e.to_string())?;

        // The method signature remains the same.
        env.call_static_method(
            class,
            "launchPlayer",
            "(Landroid/app/Activity;Ljava/lang/String;)V",
            // This is the corrected way to pass JValue arguments.
            &[JValue::from(&activity_obj), JValue::from(&url_jstring)],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    })
}

// The internal Rust function that performs the JNI call to broadcast the stop signal.
#[cfg(target_os = "android")]
fn android_force_stop<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    with_jni_env(app, |env, class, activity_obj| {
        env.call_static_method(
            class,
            "broadcastStopPlayer",
            "(Landroid/app/Activity;)V",
            &[JValue::from(&activity_obj)],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    })
}

// The initialization function for the plugin.
// The R: Runtime generic is required for Tauri v2 plugins.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("streamlocker-player")
        .invoke_handler(tauri::generate_handler![play_fullscreen, force_stop])
        .build()
}