use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

#[cfg(target_os = "android")]
use jni::{
    objects::{JClass, JObject, JString},
    JNIEnv,
};

// The command that will be exposed to JavaScript to play a video.
#[tauri::command]
fn play_fullscreen<R: Runtime>(app: tauri::AppHandle<R>, stream_url: String) {
    // This cfg attribute ensures the android-specific code only compiles for Android.
    #[cfg(target_os = "android")]
    if let Err(e) = android_play_fullscreen(app.android_activity(), stream_url) {
        eprintln!("[PLUGIN ERROR] play_fullscreen: {}", e);
    }
}

// The command that will be exposed to JavaScript to stop the video.
#[tauri::command]
fn force_stop<R: Runtime>(app: tauri::AppHandle<R>) {
    #[cfg(target_os = "android")]
    if let Err(e) = android_force_stop(app.android_activity()) {
        eprintln!("[PLUGIN ERROR] force_stop: {}", e);
    }
}

// This is a helper function to reduce boilerplate. It gets the JNI environment
// and the reference to our future Kotlin PlayerPlugin class.
#[cfg(target_os = "android")]
fn with_jni_env<F, R>(activity: &JObject, f: F) -> Result<R, String>
where
    F: FnOnce(JNIEnv, JClass, &JObject) -> Result<R, String>,
{
    let vm = tauri::private::android::vm();
    let env = vm.attach_current_thread().map_err(|e| e.to_string())?;
    
    // IMPORTANT: Replace this with your app's actual package identifier.
    // Use slashes instead of dots.
    let class = env.find_class("com/yeonv/streamlocker/PlayerPlugin")
        .map_err(|e| format!("Failed to find PlayerPlugin class: {}", e.to_string()))?;

    f(env, class, activity)
}

// The internal Rust function that performs the JNI call to launch the player.
#[cfg(target_os = "android")]
fn android_play_fullscreen(activity: &JObject, stream_url: String) -> Result<(), String> {
    with_jni_env(activity, |mut env, class, activity_obj| {
        let url_jstring: JString = env.new_string(&stream_url).map_err(|e| e.to_string())?;

        env.call_static_method(
            class,
            "launchPlayer",
            // This is the JNI method signature: a static void method that takes
            // an Activity and a String as arguments.
            "(Landroid/app/Activity;Ljava/lang/String;)V",
            &[activity_obj.into(), url_jstring.into()],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    })
}

// The internal Rust function that performs the JNI call to broadcast the stop signal.
#[cfg(target_os = "android")]
fn android_force_stop(activity: &JObject) -> Result<(), String> {
    with_jni_env(activity, |mut env, class, activity_obj| {
        env.call_static_method(
            class,
            "broadcastStopPlayer",
            // A static void method that takes just the Activity.
            "(Landroid/app/Activity;)V",
            &[activity_obj.into()],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    })
}

// The initialization function for the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("streamlocker-player")
        .invoke_handler(tauri::generate_handler![play_fullscreen, force_stop])
        .build()
}