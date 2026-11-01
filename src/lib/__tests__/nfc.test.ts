import { describe, it, expect, vi } from 'vitest';
import { isWebNfcSupported, NfcBatchWriter } from '../nfc';

describe('Asistente de Grabación NFC en Lote (DT-10)', () => {
  it('debe detectar correctamente si Web NFC está soportado en el entorno', () => {
    // En entorno Node vitest, NDEFReader no existe en window
    expect(isWebNfcSupported()).toBe(false);
  });

  it('debe gestionar la cola y el progreso de tags por escribir', () => {
    const codes = ['NFC-001', 'NFC-002', 'NFC-003'];
    const onWritten = vi.fn();
    const onError = vi.fn();

    const writer = new NfcBatchWriter(codes, 'https://app.com', onWritten, onError);

    const progressInitial = writer.getProgress();
    expect(progressInitial.current).toBe(0);
    expect(progressInitial.total).toBe(3);
    expect(progressInitial.nextCode).toBe('NFC-001');
  });
});

