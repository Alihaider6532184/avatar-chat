/**
 * HeadTTS singleton wrapper.
 *
 * Initializes the HeadTTS client-side TTS engine once and caches it.
 * Uses WebGPU with WASM fallback. Provides progress callbacks for loading UI.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

let headttsInstance: any = null;
let headttsReady = false;
let initPromise: Promise<any> | null = null;

/**
 * Initialize HeadTTS. Call once on app load.
 * Returns a cached instance on subsequent calls.
 */
export async function initHeadTTS(
  onProgress?: (progress: number) => void,
  onError?: (error: string) => void
): Promise<any> {
  // Return existing instance if already initialized
  if (headttsReady && headttsInstance) {
    return headttsInstance;
  }

  // If initialization is already in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // Detect WebGPU support
      const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
      if (hasWebGPU) {
        console.log('[HeadTTS] WebGPU is available — using GPU acceleration');
      } else {
        console.warn('[HeadTTS] WebGPU NOT available — falling back to WASM (slower)');
      }

      // Dynamic import of HeadTTS from local public folder
      const { HeadTTS } = await import(
        /* webpackIgnore: true */
        // @ts-ignore - Ignore TypeScript module resolution for public browser assets
        '/modules/headtts.mjs'
      );

      headttsInstance = new HeadTTS({
        endpoints: ['wasm'],
        dtypeWebgpu: 'fp32',
        dtypeWasm: 'q4',
        languages: ['en-us'],
        voices: ['af_bella'],
        splitSentences: false,
        splitLength: 120,
        trace: 7, // connection(1) + messages(2) + events(4)
      });

      // Connect with progress tracking
      await headttsInstance.connect(
        null,
        (event: ProgressEvent) => {
          if (event.lengthComputable && onProgress) {
            const pct = Math.round((event.loaded / event.total) * 100);
            onProgress(pct);
          }
        },
        (error: any) => {
          console.error('[HeadTTS] Connection error during progress:', error);
        }
      );

      // Setup default voice
      headttsInstance.setup({
        voice: 'af_bella',
        language: 'en-us',
        speed: 1,
        audioEncoding: 'wav',
      });

      headttsReady = true;
      console.log('[HeadTTS] Initialization complete — ready to synthesize');
      return headttsInstance;
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown HeadTTS initialization error';
      console.error('[HeadTTS] Failed to initialize:', errorMsg);
      headttsReady = false;
      headttsInstance = null;
      initPromise = null;
      if (onError) {
        onError(`Voice engine failed to load: ${errorMsg}`);
      }
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get the cached HeadTTS instance. Returns null if not yet initialized.
 */
export function getHeadTTS(): any {
  return headttsInstance;
}

/**
 * Check if HeadTTS is ready to synthesize speech.
 */
export function isHeadTTSReady(): boolean {
  return headttsReady;
}

/**
 * Synthesize speech for the given text using the event-based approach.
 * Sets onmessage handler and calls synthesize.
 * The onAudio callback is called for each audio chunk with data
 * that can be passed directly to TalkingHead.speakAudio().
 */
export async function synthesizeSpeech(
  text: string,
  onAudio: (audioData: any) => void,
  onWord?: (word: string) => void
): Promise<void> {
  if (!headttsInstance || !headttsReady) {
    throw new Error('HeadTTS is not initialized. Please wait for loading to complete.');
  }

  if (!text || text.trim().length === 0) {
    console.warn('[HeadTTS] Empty text provided, skipping synthesis');
    return;
  }

  return new Promise<void>((resolve, reject) => {
    let resolved = false;

    // Set up the message handler for this synthesis
    headttsInstance.onmessage = (message: any) => {
      if (message.type === 'audio') {
        try {
          onAudio(message.data);
        } catch (error) {
          console.error('[HeadTTS] Error handling audio message:', error);
        }
      } else if (message.type === 'error') {
        console.error('[HeadTTS] Synthesis error:', message.data?.error);
        if (!resolved) {
          resolved = true;
          reject(new Error(message.data?.error || 'Speech synthesis failed'));
        }
      }
    };

    headttsInstance.onend = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    headttsInstance.onerror = (error: any) => {
      console.error('[HeadTTS] onerror:', error);
      if (!resolved) {
        resolved = true;
        reject(new Error(error?.message || 'Speech synthesis failed'));
      }
    };

    try {
      headttsInstance.synthesize({ input: text });
    } catch (error: any) {
      if (!resolved) {
        resolved = true;
        reject(new Error(`Failed to start synthesis: ${error?.message}`));
      }
    }
  });
}
