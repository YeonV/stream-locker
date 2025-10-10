package com.yeonv.streamlocker

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

// Helper classes remain the same
data class PlayerPreferences(
    val useSwipeControls: Boolean = true,
    val useSeekControls: Boolean = true,
    val doubleTapGesture: String = "BOTH",
    val seekIncrement: Int = 10
)
class VolumeManager(private val audioManager: AudioManager) {
    val maxVolume: Int get() = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    var currentVolume: Int
        get() = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
        set(value) {
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, value.coerceIn(0, maxVolume), 0)
        }
    val volumePercentage: Int get() = (currentVolume.toFloat() / maxVolume * 100).roundToInt()
}
class BrightnessManager(private val activity: AppCompatActivity) {
    fun setBrightness(newBrightness: Float) {
        val layoutParams = activity.window.attributes
        layoutParams.screenBrightness = newBrightness.coerceIn(0.01f, 1.0f)
        activity.window.attributes = layoutParams
    }
    val currentBrightness: Float get() = activity.window.attributes.screenBrightness.takeIf { it > 0 } ?: 0.5f
    val brightnessPercentage: Int get() = (currentBrightness * 100).roundToInt()
}


class PlayerActivity : AppCompatActivity() {
    private var player: ExoPlayer? = null
    lateinit var playerView: PlayerView // Make public for helper
    private lateinit var gestureHelper: PlayerGestureHelper

    // Views for gesture indicators, now public for helper
    lateinit var volumeLayout: View
    lateinit var brightnessLayout: View
    lateinit var infoLayout: View
    lateinit var volumeProgress: ProgressBar
    lateinit var volumeText: TextView
    lateinit var brightnessProgress: ProgressBar
    lateinit var brightnessText: TextView
    lateinit var infoText: TextView
    
    // Jobs to hide indicators
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
        setContentView(R.layout.activity_player)

        val filter = IntentFilter(StreamLockerPlayerPlugin.ACTION_STOP_PLAYER)
        registerReceiver(stopReceiver, filter, RECEIVER_EXPORTED)

        playerView = findViewById(R.id.player_view)
        val backButton: ImageButton = findViewById(R.id.back_button)
        val bufferingIndicator: ProgressBar? = playerView.findViewById(androidx.media3.ui.R.id.exo_buffering)

        // Find all gesture indicator views
        volumeLayout = findViewById(R.id.volume_gesture_layout)
        brightnessLayout = findViewById(R.id.brightness_gesture_layout)
        infoLayout = findViewById(R.id.info_layout)
        volumeProgress = findViewById(R.id.volume_progress_bar)
        volumeText = findViewById(R.id.volume_progress_text)
        brightnessProgress = findViewById(R.id.brightness_progress_bar)
        brightnessText = findViewById(R.id.brightness_progress_text)
        infoText = findViewById(R.id.info_text)

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

    // --- NEW METHODS TO CONTROL UI INDICATORS ---
    fun showVolumeIndicator() {
        hideVolumeJob?.cancel()
        volumeLayout.visibility = View.VISIBLE
    }
    fun hideVolumeIndicator(delay: Long = 500L) {
        hideVolumeJob = lifecycleScope.launch {
            delay(delay)
            volumeLayout.visibility = View.GONE
        }
    }
    fun showBrightnessIndicator() {
        hideBrightnessJob?.cancel()
        brightnessLayout.visibility = View.VISIBLE
    }
    fun hideBrightnessIndicator(delay: Long = 500L) {
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
    fun hideSeekIndicator(delay: Long = 500L) {
        hideInfoJob = lifecycleScope.launch {
            delay(delay)
            infoLayout.visibility = View.GONE
        }
    }

    // The rest of the methods are the same
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

    // Lifecycle methods
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

// --- GESTURE HELPER (FINAL, FULLY WIRED VERSION) ---

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

    private val playerView: PlayerView = activity.playerView
    private val player: Player? get() = playerView.player

    private val scrollDetector = GestureDetector(activity, object : GestureDetector.SimpleOnGestureListener() {
        override fun onScroll(e1: MotionEvent?, e2: MotionEvent, distanceX: Float, distanceY: Float): Boolean {
            if (e1 == null || player == null) return false

            if (currentGestureAction == null) { // First scroll event
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
                    // Scale seek amount by gesture distance (more intuitive)
                    val seekAmount = (totalDistance / playerView.width * (player!!.duration.coerceAtLeast(600000))).toLong() // Seek up to 10 mins
                    val newPosition = (seekStartPosition + seekAmount).coerceIn(0, player!!.duration)
                    player?.seekTo(newPosition)
                    
                    val diff = newPosition - seekStartPosition
                    val diffSign = if (diff > 0) "+" else ""
                    activity.showSeekIndicator("${formatDuration(newPosition)}\n[$diffSign${formatDuration(abs(diff))}]")
                }
                GestureAction.SWIPE -> {
                    val ratio = -distanceY / (playerView.height * 0.8f) // Use a larger portion of the screen
                    if (e1.x > playerView.width / 2) { // Right side for volume
                        val newVolume = volumeManager.currentVolume + (ratio * volumeManager.maxVolume)
                        volumeManager.currentVolume = newVolume.roundToInt()
                        activity.volumeProgress.progress = volumeManager.volumePercentage
                        activity.volumeText.text = "${volumeManager.volumePercentage}%"
                        activity.showVolumeIndicator()
                    } else { // Left side for brightness
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
    
    private val tapDetector = GestureDetector(activity, object : GestureDetector.SimpleOnGestureListener() {
        override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
            if (playerView.isControllerVisible) playerView.hideController() else playerView.showController()
            return true
        }

        override fun onDoubleTap(e: MotionEvent): Boolean {
            player ?: return false
            val width = playerView.width
            val x = e.x
            
            if (prefs.doubleTapGesture == "NONE") return false

            if (prefs.doubleTapGesture == "PLAY_PAUSE" || (prefs.doubleTapGesture == "BOTH" && x > width * 0.35 && x < width * 0.65)) {
                player?.playWhenReady = !player!!.playWhenReady
            } else { // Seek forward/backward
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

    fun onTouch(event: MotionEvent): Boolean {
        tapDetector.onTouchEvent(event)
        scrollDetector.onTouchEvent(event)

        if (event.action == MotionEvent.ACTION_UP) {
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
        val totalSeconds = millis / 1000
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