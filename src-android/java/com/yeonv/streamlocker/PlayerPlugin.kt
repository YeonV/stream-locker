package com.yeonv.streamlocker

import android.app.Activity
import android.content.Intent

class PlayerPlugin {
    companion object {
        // This is the unique action string for our "kill switch" broadcast.
        const val ACTION_STOP_PLAYER = "com.yeonv.streamlocker.ACTION_STOP_PLAYER"

        @JvmStatic
        fun launchPlayer(activity: Activity, streamUrl: String) {
            val intent = Intent(activity, PlayerActivity::class.java)
            intent.putExtra("streamUrl", streamUrl)
            activity.startActivity(intent)
        }

        @JvmStatic
        fun broadcastStopPlayer(activity: Activity) {
            val intent = Intent(ACTION_STOP_PLAYER)
            // Send the broadcast to all components within our app that are listening.
            activity.sendBroadcast(intent)
            println("[Stream Locker] Sent stop broadcast.")
        }
    }
}