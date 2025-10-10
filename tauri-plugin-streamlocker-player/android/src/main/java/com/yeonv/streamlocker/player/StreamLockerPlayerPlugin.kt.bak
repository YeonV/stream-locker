package com.yeonv.streamlocker.player

import android.app.Activity
import android.widget.Toast
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

@TauriPlugin
class StreamLockerPlayerPlugin(private val activity: Activity): Plugin(activity) {

    @Command
    fun playFullscreen(invoke: Invoke) {
        // We will not launch the activity. We will just show a Toast.
        val message = "Native code received the playFullscreen command!"
        Toast.makeText(activity, message, Toast.LENGTH_LONG).show()
        println(message) // Also log it
        invoke.resolve()
    }

    @Command
    fun forceStop(invoke: Invoke) {
        val message = "Native code received the forceStop command!"
        Toast.makeText(activity, message, Toast.LENGTH_LONG).show()
        println(message) // Also log it
        invoke.resolve()
    }
}