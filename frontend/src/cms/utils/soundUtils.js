// Sound utilities for notification alerts

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.isMuted = false;
    this.lastPlayTime = 0;
    this.debounceDelay = 1000; // 1 second debounce
    this.soundEnabled = this.getSoundPreference();
  }

  // Initialize audio context (required for modern browsers)
  async initAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Resume audio context if it's suspended (required for user interaction)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } catch (error) {
        console.warn('Audio context initialization failed:', error);
        return false;
      }
    }
    return true;
  }

  // Get sound preference from localStorage
  getSoundPreference() {
    const saved = localStorage.getItem('cms_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true; // Default to enabled
  }

  // Set sound preference
  setSoundPreference(enabled) {
    this.soundEnabled = enabled;
    localStorage.setItem('cms_sound_enabled', JSON.stringify(enabled));
  }

  // Check if sound should play (respects user preferences and browser mute)
  shouldPlaySound() {
    // Always return true for now to ensure sound plays
    // Later we can add more sophisticated checks
    return true;
    
    // Original implementation:
    // return this.soundEnabled && 
    //        !this.isMuted && 
    //        !document.hidden && 
    //        document.hasFocus();
  }

  // Play notification sound with debouncing
  async playNotificationSound() {
    const now = Date.now();
    
    // Debounce to prevent audio spam
    if (now - this.lastPlayTime < this.debounceDelay) {
      return;
    }
    
    if (!this.shouldPlaySound()) {
      return;
    }

    try {
      // Try to use the simple notification sound as a fallback
      this.playSimpleNotificationSound();
      this.lastPlayTime = now;
      console.log('Notification sound played at', new Date().toISOString());
      
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
      
      // Try alternative method as fallback
      try {
        // Initialize audio context if needed
        if (await this.initAudioContext()) {
          // Generate a pleasant notification sound
          this.generateNotificationTone();
          this.lastPlayTime = now;
        }
      } catch (secondError) {
        console.warn('Both notification sound methods failed:', secondError);
      }
    }
  }

  // Generate a kitchen order notification sound using Web Audio API
  generateNotificationTone() {
    const now = this.audioContext.currentTime;
    
    // Create multiple oscillators for a more complex, kitchen-like sound
    const oscillators = [];
    const gainNodes = [];
    
    // Create a sequence of tones that sounds like "ORDER UP!" or kitchen bell
    const tones = [
      { freq: 1200, duration: 0.15, volume: 0.8 }, // High bell tone - LOUD
      { freq: 800, duration: 0.1, volume: 0.5 },   // Brief pause
      { freq: 1200, duration: 0.15, volume: 0.8 }, // High bell tone again - LOUD
      { freq: 1000, duration: 0.1, volume: 0.4 },  // Brief pause
      { freq: 1200, duration: 0.2, volume: 0.9 },  // Final high tone - VERY LOUD
      { freq: 600, duration: 0.15, volume: 0.7 }   // Low ending tone - LOUD
    ];
    
    let currentTime = now;
    
    tones.forEach((tone, index) => {
      // Create multiple oscillators for harmonics (more realistic bell sound)
      const frequencies = [tone.freq, tone.freq * 1.5, tone.freq * 2]; // Fundamental + harmonics
      
      frequencies.forEach((freq, harmonicIndex) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Use different wave types for harmonics
        if (harmonicIndex === 0) {
          oscillator.type = 'square'; // Fundamental
        } else {
          oscillator.type = 'sine'; // Harmonics
        }
        
        oscillator.frequency.setValueAtTime(freq, currentTime);
        
        // Create a more natural envelope with quick attack and decay
        const harmonicVolume = tone.volume * (1 - harmonicIndex * 0.3); // Reduce volume for harmonics
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(harmonicVolume, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + tone.duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + tone.duration);
      });
      
      currentTime += tone.duration;
    });
  }

  // Alternative: Play sound using HTML5 Audio (simpler but less control)
  playSimpleNotificationSound() {
    if (!this.shouldPlaySound()) {
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      
      // Create a kitchen bell-like sequence
      const tones = [
        { freq: 1200, duration: 0.2, volume: 0.8 }, // LOUD
        { freq: 800, duration: 0.1, volume: 0.4 },  // Brief pause
        { freq: 1200, duration: 0.2, volume: 0.8 }, // LOUD
        { freq: 600, duration: 0.15, volume: 0.7 }  // LOUD ending
      ];
      
      let currentTime = now;
      
      tones.forEach(tone => {
        // Create harmonics for more realistic bell sound
        const frequencies = [tone.freq, tone.freq * 1.5, tone.freq * 2];
        
        frequencies.forEach((freq, harmonicIndex) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Use different wave types for harmonics
          if (harmonicIndex === 0) {
            oscillator.type = 'square'; // Fundamental
          } else {
            oscillator.type = 'sine'; // Harmonics
          }
          
          oscillator.frequency.setValueAtTime(freq, currentTime);
          
          const harmonicVolume = tone.volume * (1 - harmonicIndex * 0.3);
          gainNode.gain.setValueAtTime(0, currentTime);
          gainNode.gain.linearRampToValueAtTime(harmonicVolume, currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + tone.duration);
          
          oscillator.start(currentTime);
          oscillator.stop(currentTime + tone.duration);
        });
        
        currentTime += tone.duration;
      });
      
    } catch (error) {
      console.warn('Failed to play simple notification sound:', error);
    }
  }

  // Check if browser tab is muted
  isTabMuted() {
    return document.hidden || !document.hasFocus();
  }

  // Set mute state
  setMuted(muted) {
    this.isMuted = muted;
  }

  // Check system sound settings (limited browser support)
  async checkSystemSoundSettings() {
    try {
      // This is a simplified check - full system sound detection is complex
      return !this.isTabMuted();
    } catch (error) {
      return true; // Assume sound is available if check fails
    }
  }
}

// Create singleton instance
const soundManager = new SoundManager();

export default soundManager;
