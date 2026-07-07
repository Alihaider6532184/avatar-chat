/**
 * TalkingHead wrapper.
 *
 * Initializes the TalkingHead 3D avatar class on a DOM element,
 * loads an avatar, and provides methods to trigger lip-synced speech.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

let talkingHeadInstance: any = null;
let avatarLoaded = false;

/**
 * Initialize TalkingHead on a container DOM element.
 */
export async function initTalkingHead(container: HTMLElement): Promise<any> {
  if (talkingHeadInstance) {
    return talkingHeadInstance;
  }

  try {
    const { TalkingHead } = await import(
      /* webpackIgnore: true */
      'https://cdn.jsdelivr.net/npm/@met4citizen/talkinghead@1.7/modules/talkinghead.mjs'
    );

    talkingHeadInstance = new TalkingHead(container, {
      lipsyncModules: ['en'],
      cameraView: 'upper',
      cameraRotateEnable: true,
      cameraPanEnable: false,
      cameraZoomEnable: false,
      lightAmbientColor: 0xffffff,
      lightAmbientIntensity: 2,
      lightDirectColor: 0x8888aa,
      lightDirectIntensity: 30,
      lightDirectPhi: 0.1,
      lightDirectTheta: 2,
      avatarMood: 'neutral',
      modelPixelRatio: 1,
      modelFPS: 30,
    });

    console.log('[TalkingHead] Instance created successfully');
    return talkingHeadInstance;
  } catch (error: any) {
    console.error('[TalkingHead] Failed to initialize:', error);
    talkingHeadInstance = null;
    throw new Error(`Failed to initialize 3D avatar engine: ${error?.message}`);
  }
}

/**
 * Load and display an avatar.
 */
export async function loadAvatar(
  url: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<void> {
  if (!talkingHeadInstance) {
    throw new Error('TalkingHead is not initialized. Call initTalkingHead() first.');
  }

  try {
    await talkingHeadInstance.showAvatar(
      {
        url,
        body: 'F',
        avatarMood: 'neutral',
        lipsyncLang: 'en',
      },
      onProgress || null
    );

    avatarLoaded = true;
    console.log('[TalkingHead] Avatar loaded successfully:', url);
  } catch (error: any) {
    avatarLoaded = false;
    console.error('[TalkingHead] Failed to load avatar:', error);
    throw new Error(`Failed to load avatar model: ${error?.message}`);
  }
}

/**
 * Make the avatar speak using audio data and lip-sync information (visemes)
 * provided by the HeadTTS engine.
 */
export async function speakWithAudio(
  audioData: any,
  onSubtitles?: (word: string) => void
): Promise<void> {
  if (!talkingHeadInstance) {
    console.error('[TalkingHead] Cannot speak — not initialized');
    return;
  }

  if (!avatarLoaded) {
    console.error('[TalkingHead] Cannot speak — no avatar loaded');
    return;
  }

  try {
    // Attempt to resume audio context if suspended
    if (talkingHeadInstance.audioCtx && talkingHeadInstance.audioCtx.state === 'suspended') {
      try {
        await talkingHeadInstance.audioCtx.resume();
        console.log('[TalkingHead] AudioContext resumed');
      } catch (resumeErr) {
        console.warn('[TalkingHead] AudioContext could not be resumed:', resumeErr);
      }
    }

    console.log('[TalkingHead] Speaking with audio data');
    await talkingHeadInstance.speakAudio(
      audioData,
      { lipsyncLang: 'en' },
      onSubtitles || null
    );
  } catch (error: any) {
    console.error('[TalkingHead] Error during speakAudio:', error);
  }
}

/**
 * Stop current speech.
 */
export function stopSpeaking(): void {
  if (talkingHeadInstance) {
    talkingHeadInstance.stopSpeaking?.();
  }
}

/**
 * Check if the avatar is loaded and ready.
 */
export function isAvatarReady(): boolean {
  return avatarLoaded && talkingHeadInstance !== null;
}

/**
 * Get the TalkingHead instance (for advanced usage).
 */
export function getTalkingHead(): any {
  return talkingHeadInstance;
}

export function setMood(mood: string): void {
  if (talkingHeadInstance) {
    talkingHeadInstance.setMood(mood);
  }
}

export function setView(view: 'full' | 'mid' | 'upper' | 'head'): void {
  if (talkingHeadInstance) {
    talkingHeadInstance.setView(view);
  }
}
