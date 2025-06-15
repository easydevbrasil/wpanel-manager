// Toast notification sounds utility
export class ToastSounds {
  // Generate different sound types
  static playSound(type: 'success' | 'error' | 'info' | 'warning') {
    try {
      let frequency: number;
      let duration: number;

      switch (type) {
        case 'success':
          // Pleasant upward chime
          frequency = 880; // A5
          duration = 0.2;
          this.playTone(frequency, duration);
          setTimeout(() => this.playTone(1108, 0.15), 100); // C#6
          break;
        
        case 'error':
          // Lower, more serious tone
          frequency = 220; // A3
          duration = 0.3;
          this.playTone(frequency, duration);
          break;
        
        case 'warning':
          // Medium tone
          frequency = 440; // A4
          duration = 0.25;
          this.playTone(frequency, duration);
          break;
        
        case 'info':
        default:
          // Gentle notification
          frequency = 660; // E5
          duration = 0.2;
          this.playTone(frequency, duration);
          break;
      }
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  private static playTone(frequency: number, duration: number) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log('Web Audio API not available');
    }
  }
}