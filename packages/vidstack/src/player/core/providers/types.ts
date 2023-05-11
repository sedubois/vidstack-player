import type { JSX } from 'maverick.js';
import type { HTMLCustomElement } from 'maverick.js/element';

import type { FullscreenAdapter } from '../../../foundation/fullscreen/controller';
import type { MediaContext } from '../api/context';
import type { MediaState, MediaStore } from '../api/store';
import type { MediaSrc, MediaType } from '../api/types';
import type { MediaPlayerElement } from '../player';
import type { AudioProvider } from './audio/provider';
import type { HLSProvider } from './hls/provider';
import type { VideoProvider } from './video/provider';

export type AnyMediaProvider =
  | ({ type: 'audio' } & AudioProvider)
  | ({ type: 'video' } & VideoProvider)
  | ({ type: 'hls' } & HLSProvider);

export interface MediaProviderElement extends HTMLCustomElement {}

export interface MediaProviderLoader<Provider extends MediaProvider = MediaProvider> {
  canPlay(src: MediaSrc): boolean;
  mediaType(src: MediaSrc): MediaType;
  preconnect?(context: MediaContext): void;
  load(context: MediaContext): Promise<Provider>;
  render(store: MediaStore): JSX.Element;
}

export interface MediaProvider
  extends Pick<
    MediaState,
    'paused' | 'muted' | 'currentTime' | 'volume' | 'playsinline' | 'playbackRate'
  > {
  readonly type: string;
  readonly fullscreen?: MediaFullscreenAdapter;
  readonly pictureInPicture?: MediaPictureInPictureAdapter;
  readonly canLiveSync?: boolean;
  preconnect?(context: MediaContext): void;
  setup(context: MediaSetupContext): void;
  destroy?(): void;
  play(): Promise<void>;
  pause(): Promise<void>;
  loadSource(src: MediaSrc, preload: MediaState['preload']): Promise<void>;
}

export interface MediaSetupContext extends MediaContext {
  player: MediaPlayerElement;
}

export interface MediaFullscreenAdapter extends FullscreenAdapter {}

export interface MediaPictureInPictureAdapter {
  /**
   * Whether picture-in-picture mode is active.
   */
  readonly active: boolean;
  /**
   * Whether picture-in-picture mode is supported. This does not mean that the operation is
   * guaranteed to be successful, only that it can be attempted.
   */
  readonly supported: boolean;
  /**
   * Request to display the current provider in picture-in-picture mode.
   */
  enter(): Promise<void | PictureInPictureWindow>;
  /**
   * Request to display the current provider in inline by exiting picture-in-picture mode.
   */
  exit(): Promise<void>;
}