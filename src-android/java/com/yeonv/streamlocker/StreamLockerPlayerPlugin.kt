package com.yeonv.streamlocker

import android.app.Activity
import android.content.Intent
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

// This data class defines the arguments we expect from JavaScript/Rust.
// Tauri automatically deserializes the JSON payload into this class.
@InvokeArg
class PlayArgs {
    var streamUrl: String? = null
}

@TauriPlugin
class StreamLockerPlayerPlugin(private val activity: Activity): Plugin(activity) {

    companion object {
        // This is still needed for the broadcast receiver.
        const val ACTION_STOP_PLAYER = "com.yeonv.streamlocker.ACTION_STOP_PLAYER"
    }

    @Command
    fun playFullscreen(invoke: Invoke) {
        val args = invoke.parseArgs(PlayArgs::class.java)
        val url = args.streamUrl

        if (url == null) {
            invoke.reject("streamUrl is required")
            return
        }

        val intent = Intent(activity, PlayerActivity::class.java)
        intent.putExtra("streamUrl", url)
        activity.startActivity(intent)
        
        // Signal back to the webview that the command was successful.
        invoke.resolve()
    }

    @Command
    fun forceStop(invoke: Invoke) {
        val intent = Intent(ACTION_STOP_PLAYER)
        activity.sendBroadcast(intent)
        println("[Stream Locker] Sent stop broadcast via plugin.")
        invoke.resolve()
    }
}