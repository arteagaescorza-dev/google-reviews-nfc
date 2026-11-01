import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { speakOrderReady, triggerHapticBuzzer, playBuzzerChime } from '../beeper';

describe('Motor Beeper Digital Web (DT-14)', () => {
  let mockSpeak: any;
  let mockCancel: any;
  let mockVibrate: any;

  beforeEach(() => {
    mockSpeak = vi.fn();
    mockCancel = vi.fn();
    mockVibrate = vi.fn();

    // Mock window y SpeechSynthesis
    const mockWindow = {
      speechSynthesis: {
        speak: mockSpeak,
        cancel: mockCancel,
        getVoices: () => [{ lang: 'es-MX', name: 'Mexican Spanish' }],
      },
    };

    try {
      Object.defineProperty(globalThis, 'window', {
        value: mockWindow,
        configurable: true,
        writable: true,
      });
    } catch {
      (globalThis as any).window = mockWindow;
    }

    (globalThis as any).SpeechSynthesisUtterance = class {
      text: string;
      lang: string = 'es-MX';
      rate: number = 1;
      pitch: number = 1;
      voice: any = null;
      constructor(text: string) {
        this.text = text;
      }
    };

    // Mock Navigator Vibration API usando defineProperty sobre navigator existente
    try {
      Object.defineProperty(globalThis.navigator, 'vibrate', {
        value: mockVibrate,
        configurable: true,
        writable: true,
      });
    } catch {
      // Fallback
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe sintetizar la voz en español con folio y nombre de estación', () => {
    speakOrderReady('382', 'Tacos Don Güero');

    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
    const utteranceArg = mockSpeak.mock.calls[0][0];
    expect(utteranceArg.text).toContain('382');
    expect(utteranceArg.text).toContain('Tacos Don Güero');
    expect(utteranceArg.lang).toBe('es-MX');
  });

  it('debe disparar la vibración háptica con patrón pulsante distintivo', () => {
    triggerHapticBuzzer();

    expect(mockVibrate).toHaveBeenCalled();
    const pattern = mockVibrate.mock.calls[0][0];
    expect(Array.isArray(pattern)).toBe(true);
    expect(pattern.length).toBeGreaterThan(1);
    expect(pattern[0]).toBe(600); // 600ms primer pulso
  });

  it('no debe lanzar excepciones si Web Audio no está disponible', () => {
    expect(() => {
      playBuzzerChime();
    }).not.toThrow();
  });
});
