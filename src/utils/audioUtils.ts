/**
 * Audio Utility
 * Provides methods for playing notification sounds
 */

class AudioPlayer {
    private static audio: HTMLAudioElement | null = null;
    private static isInitialized = false;

    /**
     * Initializes the audio element
     */
    static init() {
        if (this.isInitialized) return;
        this.audio = new Audio('/ringtone.mp3');
        this.isInitialized = true;
    }

    /**
     * Unlocks the audio context (must be called from user interaction)
     * Plays a tiny bit of the audio then pauses it.
     */
    static unlock() {
        this.init();
        if (this.audio) {
            const originalVolume = this.audio.volume;
            this.audio.volume = 0;
            this.audio.play().then(() => {
                this.audio?.pause();
                if (this.audio) this.audio.volume = originalVolume;
            }).catch(() => {
                // Silently fail if still blocked
            });
        }
    }

    /**
     * Plays the new order notification sound
     */
    static playNewOrderSound() {
        this.init();
        if (this.audio) {
            // Reset to start if already playing
            this.audio.pause();
            this.audio.currentTime = 0;
            
            // Play and catch any potential autoplay blocking errors
            this.audio.play().catch(error => {
                console.error("Audio autoplay blocked by browser policies until user interacts with the document.", error);
            });
        }
    }
}

export const playNewOrderSound = () => {
    AudioPlayer.playNewOrderSound();
};

export const unlockAudio = () => {
    AudioPlayer.unlock();
};
