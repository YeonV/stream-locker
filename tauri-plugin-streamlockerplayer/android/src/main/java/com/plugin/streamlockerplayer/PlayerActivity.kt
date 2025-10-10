package com.plugin.streamlockerplayer

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.os.Bundle
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.View
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.roundToInt

// --- HELPER CLASSES (Self-contained for simplicity) ---
data class PlayerPreferences(
    val useSwipeControls: Boolean = true,
    val useSeekControls: Boolean = true,
    val doubleTapGesture: String = "BOTH", // Options: "BOTH", "PLAY_PAUSE", "NONE"
    val seekIncrement: Int = 10 // in seconds
)

class VolumeManager(private val audioManager: AudioManager) {
    val maxVolume: Int get() = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    var currentVolume: Int
        get() = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
        set(value) {
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, value.coerceIn(0, maxVolume), 0)
        }
    val volumePercentage: Int get() = if (maxVolume > 0) (currentVolume.toFloat() / maxVolume * 100).roundToInt() else 0
}

class BrightnessManager(private val activity: AppCompatActivity) {
    fun setBrightness(newBrightness: Float) {
        val layoutParams = activity.window.attributes
        layoutParams.screenBrightness = newBrightness.coerceIn(0.01f, 1.0f) // 0 is not allowed, can cause issues
        activity.window.attributes = layoutParams
    }
    val currentBrightness: Float get() = activity.window.attributes.screenBrightness.takeIf { it > 0 } ?: 0.5f
    val brightnessPercentage: Int get() = (currentBrightness * 100).roundToInt()
}

// --- MAIN PLAYER ACTIVITY ---
class PlayerActivity : AppCompatActivity() {
    private var player: ExoPlayer? = null
    lateinit var playerView: PlayerView
    private lateinit var gestureHelper: PlayerGestureHelper

    lateinit var volumeLayout: View
    lateinit var brightnessLayout: View
    lateinit var infoLayout: View
    lateinit var volumeProgress: ProgressBar
    lateinit var volumeText: TextView
    lateinit var brightnessProgress: ProgressBar
    lateinit var brightnessText: TextView
    lateinit var infoText: TextView
    
    private var hideVolumeJob: Job? = null
    private var hideBrightnessJob: Job? = null
    private var hideInfoJob: Job? = null

    private val stopReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == StreamLockerPlayerPlugin.ACTION_STOP_PLAYER) {
                finish()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        hideSystemUi()
        setContentView(resources.getIdentifier("activity_player", "layout", packageName))

        val filter = IntentFilter(StreamLockerPlayerPlugin.ACTION_STOP_PLAYER)
        registerReceiver(stopReceiver, filter, RECEIVER_EXPORTED)

        playerView = findViewById(resources.getIdentifier("player_view", "id", packageName))
        val backButton: ImageButton = findViewById(resources.getIdentifier("back_button", "id", packageName))
        val bufferingIndicator: ProgressBar? = playerView.findViewById(androidx.media3.ui.R.id.exo_buffering)

        volumeLayout = findViewById(resources.getIdentifier("volume_gesture_layout", "id", packageName))
        brightnessLayout = findViewById(resources.getIdentifier("brightness_gesture_layout", "id", packageName))
        infoLayout = findViewById(resources.getIdentifier("info_layout", "id", packageName))
        volumeProgress = findViewById(resources.getIdentifier("volume_progress_bar", "id", packageName))
        volumeText = findViewById(resources.getIdentifier("volume_progress_text", "id", packageName))
        brightnessProgress = findViewById(resources.getIdentifier("brightness_progress_bar", "id", packageName))
        brightnessText = findViewById(resources.getIdentifier("brightness_progress_text", "id", packageName))
        infoText = findViewById(resources.getIdentifier("info_text", "id", packageName))

        val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val volumeManager = VolumeManager(audioManager)
        val brightnessManager = BrightnessManager(this)
        gestureHelper = PlayerGestureHelper(this, volumeManager, brightnessManager, PlayerPreferences())

        backButton.setOnClickListener { finish() }
        playerView.setOnTouchListener { _, event -> gestureHelper.onTouch(event) }

        player = ExoPlayer.Builder(this).build()
        playerView.player = player
        player?.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                bufferingIndicator?.visibility = if (playbackState == Player.STATE_BUFFERING) View.VISIBLE else View.GONE
            }
        })

        val streamUrl = intent.getStringExtra("streamUrl")
        if (streamUrl != null) {
            initializePlayer(streamUrl)
        } else {
            finish()
        }
    }

    fun showVolumeIndicator() {
        hideVolumeJob?.cancel()
        volumeLayout.visibility = View.VISIBLE
    }
    fun hideVolumeIndicator(delay: Long = 800L) {
        hideVolumeJob = lifecycleScope.launch {
            delay(delay)
            volumeLayout.visibility = View.GONE
        }
    }
    fun showBrightnessIndicator() {
        hideBrightnessJob?.cancel()
        brightnessLayout.visibility = View.VISIBLE
    }
    fun hideBrightnessIndicator(delay: Long = 800L) {
        hideBrightnessJob = lifecycleScope.launch {
            delay(delay)
            brightnessLayout.visibility = View.GONE
        }
    }
    fun showSeekIndicator(text: String) {
        hideInfoJob?.cancel()
        infoText.text = text
        infoLayout.visibility = View.VISIBLE
    }
    fun hideSeekIndicator(delay: Long = 800L) {
        hideInfoJob = lifecycleScope.launch {
            delay(delay)
            infoLayout.visibility = View.GONE
        }
    }

    private fun initializePlayer(url: String) {
        val mediaItem = MediaItem.fromUri(url)
        player?.setMediaItem(mediaItem)
        player?.playWhenReady = true
        player?.prepare()
    }

    private fun releasePlayer() {
        player?.release()
        player = null
    }

    private fun hideSystemUi() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).let { controller ->
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    override fun onPause() {
        super.onPause()
        player?.pause()
    }

    override fun onResume() {
        super.onResume()
        player?.play()
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(stopReceiver)
        releasePlayer()
    }
}

@SuppressLint("ClickableViewAccessibility")
class PlayerGestureHelper(
    private val activity: PlayerActivity,
    private val volumeManager: VolumeManager,
    private val brightnessManager: BrightnessManager,
    private val prefs: PlayerPreferences
) {
    private enum class GestureAction { SWIPE, SEEK }
    private var currentGestureAction: GestureAction? = null
    private var isPlayingOnSeekStart: Boolean = false
    private var seekStartPosition: Long = 0

    private val playerView: PlayerView get() = activity.playerView
    private val player: Player? get() = playerView.player

    private val tapDetector = GestureDetector(activity, object : GestureDetector.SimpleOnGestureListener() {
        override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
            if (activity.isDestroyed) return false
            if (playerView.isControllerVisible) playerView.hideController() else playerView.showController()
            return true
        }

        override fun onDoubleTap(e: MotionEvent): Boolean {
            player ?: return false
            if (activity.isDestroyed) return false
            val width = playerView.width
            val x = e.x
            
            if (prefs.doubleTapGesture == "NONE") return false

            if (prefs.doubleTapGesture == "PLAY_PAUSE" || (prefs.doubleTapGesture == "BOTH" && x > width * 0.35 && x < width * 0.65)) {
                player?.playWhenReady = !player!!.playWhenReady
            } else {
                val newPosition = if (x < width / 2) {
                    player!!.currentPosition - (prefs.seekIncrement * 1000)
                } else {
                    player!!.currentPosition + (prefs.seekIncrement * 1000)
                }
                player?.seekTo(newPosition.coerceIn(0, player!!.duration))
            }
            return true
        }
    })

    private val scrollDetector = GestureDetector(activity, object : GestureDetector.SimpleOnGestureListener() {
        override fun onScroll(e1: MotionEvent?, e2: MotionEvent, distanceX: Float, distanceY: Float): Boolean {
            if (e1 == null || player == null || activity.isDestroyed) return false

            if (currentGestureAction == null) {
                if (abs(distanceX) > abs(distanceY)) {
                    if (!prefs.useSeekControls) return false
                    currentGestureAction = GestureAction.SEEK
                    isPlayingOnSeekStart = player!!.isPlaying
                    seekStartPosition = player!!.currentPosition
                } else {
                    if (!prefs.useSwipeControls) return false
                    currentGestureAction = GestureAction.SWIPE
                }
            }
            
            when (currentGestureAction) {
                GestureAction.SEEK -> {
                    val totalDistance = e2.x - e1.x
                    val seekAmount = (totalDistance / playerView.width * (player!!.duration.coerceAtLeast(600000))).toLong() // Seek up to 10 mins for a full swipe
                    val newPosition = (seekStartPosition + seekAmount).coerceIn(0, player!!.duration)
                    player?.seekTo(newPosition)
                    
                    val diff = newPosition - seekStartPosition
                    val diffSign = if (diff >= 0) "+" else ""
                    activity.showSeekIndicator("${formatDuration(newPosition)}\n[$diffSign${formatDuration(abs(diff))}]")
                }
                GestureAction.SWIPE -> {
                    val ratio = -distanceY / (playerView.height * 0.8f)
                    if (e1.x > playerView.width / 2) {
                        val newVolume = volumeManager.currentVolume + (ratio * volumeManager.maxVolume)
                        volumeManager.currentVolume = newVolume.roundToInt()
                        activity.volumeProgress.progress = volumeManager.volumePercentage
                        activity.volumeText.text = "${volumeManager.volumePercentage}%"
                        activity.showVolumeIndicator()
                    } else {
                        val newBrightness = brightnessManager.currentBrightness + ratio
                        brightnessManager.setBrightness(newBrightness)
                        activity.brightnessProgress.progress = brightnessManager.brightnessPercentage
                        activity.brightnessText.text = "${brightnessManager.brightnessPercentage}%"
                        activity.showBrightnessIndicator()
                    }
                }
                else -> {}
            }
            return true
        }
    })

    fun onTouch(event: MotionEvent): Boolean {
        if (activity.isDestroyed) return false
        tapDetector.onTouchEvent(event)
        scrollDetector.onTouchEvent(event)

        if (event.action == MotionEvent.ACTION_UP || event.action == MotionEvent.ACTION_CANCEL) {
            if (currentGestureAction == GestureAction.SWIPE) {
                activity.hideVolumeIndicator()
                activity.hideBrightnessIndicator()
            } else if (currentGestureAction == GestureAction.SEEK) {
                activity.hideSeekIndicator()
            }
            currentGestureAction = null
        }
        return true
    }

    private fun formatDuration(millis: Long): String {
        val totalSeconds = abs(millis / 1000)
        val seconds = totalSeconds % 60
        val minutes = (totalSeconds / 60) % 60
        val hours = totalSeconds / 3600
        return if (hours > 0) {
            String.format("%d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format("%02d:%02d", minutes, seconds)
        }
    }
}