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

    companion object {
        const val ACTION_STOP_PLAYER = "com.yeonv.streamlocker.player.ACTION_STOP_PLAYER"
    }

    @Command
    fun playFullscreen(invoke: Invoke) {
        val args = invoke.parseArgs(PlayFullscreenArgs::class.java)
        val url = args.streamUrl

        if (url == null) {
            invoke.reject("streamUrl is required")
            return
        }

        val intent = Intent(activity, PlayerActivity::class.java)
        intent.putExtra("streamUrl", url)
        activity.startActivity(intent)
        
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