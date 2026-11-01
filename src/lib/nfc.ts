/**
 * Asistente de Grabación de Tags NFC (Web NFC API / NDEFReader)
 * Soporta grabación individual y modo continuo por lotes para Chrome en Android
 */

export function isWebNfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

export interface NfcWriteResult {
  success: boolean;
  error?: string;
}

/**
 * Graba un registro NDEF de tipo URL en un tag físico NFC
 */
export async function writeNfcUrl(targetUrl: string): Promise<NfcWriteResult> {
  if (!isWebNfcSupported()) {
    return {
      success: false,
      error: 'Tu navegador o dispositivo no soporta Web NFC (Usa Chrome en Android con NFC activo).',
    };
  }

  try {
    const NDEFReaderClass = (window as any).NDEFReader;
    const ndef = new NDEFReaderClass();
    
    // Iniciar escritura con timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    await ndef.write(
      {
        records: [
          {
            recordType: 'url',
            data: targetUrl,
          },
        ],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    // Feedback háptico de éxito
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    return { success: true };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Tiempo de espera agotado sin detectar tag NFC.' };
    }
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Permiso NFC denegado por el usuario.' };
    }
    return { success: false, error: err.message || 'Error al escribir tag NFC.' };
  }
}

/**
 * Controlador de grabación continua por lotes
 * Permite acercar tag tras tag sin recargar la pantalla
 */
export class NfcBatchWriter {
  private tagCodes: string[];
  private baseUrl: string;
  private currentIndex: number = 0;
  private onTagWritten: (index: number, code: string, progressPct: number) => void;
  private onError: (errorMsg: string) => void;

  constructor(
    tagCodes: string[],
    baseUrl: string,
    onTagWritten: (index: number, code: string, progressPct: number) => void,
    onError: (errorMsg: string) => void
  ) {
    this.tagCodes = tagCodes;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.onTagWritten = onTagWritten;
    this.onError = onError;
  }

  public getProgress(): { current: number; total: number; nextCode: string | null } {
    return {
      current: this.currentIndex,
      total: this.tagCodes.length,
      nextCode: this.currentIndex < this.tagCodes.length ? this.tagCodes[this.currentIndex] : null,
    };
  }

  /**
   * Escribe el siguiente tag pendiente de la cola
   */
  public async writeNextTag(): Promise<boolean> {
    if (this.currentIndex >= this.tagCodes.length) {
      return false; // Lote completo
    }

    const currentCode = this.tagCodes[this.currentIndex];
    const targetUrl = `${this.baseUrl}?t=${encodeURIComponent(currentCode)}`;

    const res = await writeNfcUrl(targetUrl);
    if (res.success) {
      this.currentIndex++;
      const progressPct = Math.round((this.currentIndex / this.tagCodes.length) * 100);
      this.onTagWritten(this.currentIndex, currentCode, progressPct);
      return true;
    } else {
      if (res.error) this.onError(res.error);
      return false;
    }
  }

  public reset(): void {
    this.currentIndex = 0;
  }
}
