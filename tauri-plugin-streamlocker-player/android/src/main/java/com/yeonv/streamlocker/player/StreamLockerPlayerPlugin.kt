package com.yeonv.streamlocker.player

import android.app.Activity
import android.content.Intent
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

@InvokeArg
class PlayFullscreenArgs {
  var streamUrl: String? = null
}

@TauriPlugin
class StreamLockerPlayerPlugin(private val activity: Activity): Plugin(activity) {

    @Command
    fun playFullscreen(invoke: Invoke) {
        val args = invoke.parseArgs(PlayFullscreenArgs::class.java)
        val url = args.streamUrl

        if (url == null) {
            invoke.reject("streamUrl is required")
            return
        }

        // This class no longer has a companion object or any constants.
        val intent = Intent(activity, PlayerActivity::class.java)
        intent.putExtra("streamUrl", url)
        activity.startActivity(intent)
        
        invoke.resolve()
    }

    @Command
    fun forceStop(invoke: Invoke) {
        // We now reference the constant from the new file.
        val intent = Intent(ACTION_STOP_PLAYER)
        activity.sendBroadcast(intent)
        println("[Stream Locker] Sent stop broadcast via plugin.")
        invoke.resolve()
    }
}