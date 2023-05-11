import { peek, type Dispose } from 'maverick.js';
import { isString } from 'maverick.js/std';

import { preconnect } from '../../../../utils/network';
import { isHLSSupported } from '../../../../utils/support';
import type { MediaSrc } from '../../api/types';
import type { MediaProvider, MediaSetupContext } from '../types';
import { VideoProvider } from '../video/provider';
import { HLSController } from './hls';
import { HLSLibLoader } from './lib-loader';
import type { HLSConstructor, HLSInstanceCallback, HLSLibrary } from './types';

export const HLS_PROVIDER = Symbol(__DEV__ ? 'HLS_PROVIDER' : 0);

const JS_DELIVR_CDN = 'https://cdn.jsdelivr.net';

/**
 * The HLS provider introduces support for HLS streaming via the popular `hls.js`
 * library. HLS streaming is either [supported natively](https://caniuse.com/?search=hls) (generally
 * on iOS), or in environments that [support the Media Stream API](https://caniuse.com/?search=mediastream).
 *
 * @docs {@link https://www.vidstack.io/docs/player/providers/hls}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video}
 * @see {@link https://github.com/video-dev/hls.js/blob/master/docs/API.md}
 * @example
 * ```html
 * <media-player
 *   src="https://media-files.vidstack.io/hls/index.m3u8"
 *   poster="https://media-files.vidstack.io/poster.png"
 * >
 *   <media-outlet></media-outlet>
 * </media-player>
 * ```
 */
export class HLSProvider extends VideoProvider implements MediaProvider {
  [HLS_PROVIDER] = true;

  private _ctor: HLSConstructor | null = null;
  private readonly _controller = new HLSController(this.video);

  /**
   * The `hls.js` constructor.
   */
  get ctor() {
    return this._ctor;
  }

  /**
   * The current `hls.js` instance.
   */
  get instance() {
    return this._controller.instance;
  }

  /**
   * Whether `hls.js` is supported in this environment.
   */
  static supported = isHLSSupported();

  override get type() {
    return 'hls';
  }

  get canLiveSync() {
    return true;
  }

  protected _library: HLSLibrary = `${JS_DELIVR_CDN}/npm/hls.js@^1.0.0/dist/hls${
    __DEV__ ? '.js' : '.min.js'
  }`;

  /**
   * The `hls.js` configuration object.
   *
   * @see {@link https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning}
   */
  get config() {
    return this._controller._config;
  }

  set config(config) {
    this._controller._config = config;
  }

  /**
   * The `hls.js` constructor (supports dynamic imports) or a URL of where it can be found.
   *
   * @defaultValue `https://cdn.jsdelivr.net/npm/hls.js@^1.0.0/dist/hls.min.js`
   */
  get library() {
    return this._library;
  }

  set library(library) {
    this._library = library;
  }

  preconnect(): void {
    if (!isString(this._library)) return;
    preconnect(this._library);
  }

  override setup(context: MediaSetupContext) {
    super.setup(context);
    new HLSLibLoader(this._library, context, (ctor) => {
      this._ctor = ctor;
      this._controller.setup(ctor, context);
      context.delegate._dispatch('provider-setup', { detail: this });
      const src = peek(context.$store.source);
      if (src) this.loadSource(src);
    });
  }

  override async loadSource({ src }: MediaSrc) {
    if (!isString(src)) return;
    this._controller.instance?.loadSource(src);
  }

  /**
   * The given callback is invoked when a new `hls.js` instance is created and right before it's
   * attached to media.
   */
  onInstance(callback: HLSInstanceCallback): Dispose {
    const instance = this._controller.instance;
    if (instance) callback(instance);
    this._controller._callbacks.add(callback);
    return () => this._controller._callbacks.delete(callback);
  }

  destroy() {
    this._controller._destroy();
  }
}