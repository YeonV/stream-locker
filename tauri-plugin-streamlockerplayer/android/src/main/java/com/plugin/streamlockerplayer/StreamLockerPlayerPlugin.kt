package com.plugin.streamlockerplayer // Keep this package name as is

import android.app.Activity
import android.content.Intent
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

// This data class defines the arguments for the 'playFullscreen' command.
// The field name 'streamUrl' must match the Rust PlayArgs struct.
@InvokeArg
class PlayFullscreenArgs {
  var streamUrl: String? = null
}

@TauriPlugin
class StreamLockerPlayerPlugin(private val activity: Activity): Plugin(activity) {

    companion object {
        // The unique action string for our "kill switch" broadcast.
        const val ACTION_STOP_PLAYER = "com.yeonv.streamlocker.ACTION_STOP_PLAYER"
    }

    @Command
    fun playFullscreen(invoke: Invoke) {
        val args = invoke.parseArgs(PlayFullscreenArgs::class.java)
        val url = args.streamUrl

        if (url == null) {
            invoke.reject("streamUrl is required")
            return
        }

        // Create an Intent to launch our PlayerActivity.
        val intent = Intent(activity, PlayerActivity::class.java)
        intent.putExtra("streamUrl", url)
        activity.startActivity(intent)
        
        // Signal back to Rust/JS that the command was successful.
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