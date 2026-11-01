/**
 * Motor del Beeper Digital Web (Alarma Háptica, Audio y Voz Sintética Text-To-Speech)
 * Reemplaza los buscapersonas físicos de plástico ($0 costo de hardware)
 */

export interface BeeperAlertOptions {
  folio: string;
  restaurantName?: string;
  stationName?: string;
}

/**
 * Anuncia por altavoces de barra la orden lista usando la Web Speech API
 */
export function speakOrderReady(
  folioOrOptions: string | BeeperAlertOptions,
  stationName?: string
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Cancelar locuciones previas

    const options: BeeperAlertOptions =
      typeof folioOrOptions === 'string'
        ? { folio: folioOrOptions, restaurantName: stationName }
        : folioOrOptions;

    const cleanFolio = options.folio.replace(/[^0-9a-zA-Z]/g, ' ');
    const text = options.restaurantName
      ? `¡Orden ${cleanFolio} de ${options.restaurantName}, favor de pasar a barra!`
      : `¡Orden ${cleanFolio}, lista en barra!`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 0.95; // Velocidad clara y pausada
    utterance.pitch = 1.05;

    // Buscar voz en español si está disponible
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find((v) => v.lang.startsWith('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Error reproduciendo síntesis de voz:', err);
  }
}

/**
 * Dispara vibración háptica pulsante continua en el teléfono del comensal
 */
export function triggerHapticBuzzer(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Patrón de alerta: vibra 600ms, pausa 200ms, vibra 600ms...
      navigator.vibrate([600, 200, 600, 200, 800]);
    } catch (err) {
      console.warn('Vibration API no disponible:', err);
    }
  }
}

/**
 * Reproduce alarma sonora insistente de llamada a barra mediante Web Audio API
 */
export function playBuzzerChime(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Doble tono ascendente distintivo (880Hz -> 1760Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch (err) {
    console.warn('Error en Web Audio Beeper:', err);
  }
}
