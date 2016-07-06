/**
 * Initialises an o-three-sixty components inside the element passed as the first parameter
 *
 * @param {(HTMLElement|string)} [el=document.body] - Element where to search for the o-three-sixty component. You can pass an HTMLElement or a selector string
 * @returns {OThreeSixty} - A single OThreeSixty instance
 */

 /*
global document, HTMLElement, navigator
 */
'use strict';

const oVideo = require('o-video');
const ThreeSixtyMedia = require('./three-sixty');

function OThreeSixty(rootEl, opts) {

	if (!rootEl) {
		rootEl = document.body;
	} else if (!(rootEl instanceof HTMLElement)) {
		rootEl = document.querySelector(rootEl);
	}
	if (rootEl.getAttribute('data-o-component') === 'o-three-sixty') {
		this.rootEl = rootEl;
	} else {
		this.rootEl = rootEl.querySelector('[data-o-component~="o-three-sixty"]') || rootEl;
	}
	if (rootEl.querySelector('canvas')) {
		throw Error('OThreeSixty already instantiated on element. Canvas already present.');
	}

	if (this.rootEl !== undefined) {
		this.init(opts);
	}
}

OThreeSixty.prototype.init = function init(opts = {}) {

	opts.fov = opts.fov || this.rootEl.dataset.oThreeSixtyFov || 90;
	opts.longOffset = opts.longOffset || this.rootEl.dataset.oThreeSixtyLong || 0;
	opts.reticule = opts.reticule || this.rootEl.dataset.oThreeSixtyReticule || '';
	if (opts.allowNativeMediaInterpretation === undefined) {
		opts.allowNativeMediaInterpretation = this.rootEl.dataset.oThreeSixtyNativeMediaInterpretation;
	}
	if (opts.allowNativeMediaInterpretation === undefined) {
		opts.allowNativeMediaInterpretation = true;
	}

	this.webglPromise = Promise.resolve()
	.then(() => {
		if ((this.rootEl.dataset.oVideoSource || '').toLowerCase() === 'brightcove') {

			// init o-video
			const oVideoWrapper = document.createElement('div');
			oVideoWrapper.dataset.oComponent='o-video';

			// Transfer o-video data
			Object.keys(this.rootEl.dataset).forEach(k => {
				if (k.indexOf('oVideo') === 0) {
					oVideoWrapper.dataset[k] = this.rootEl.dataset[k];
					delete this.rootEl.dataset[k];
				}
			});

			this.rootEl.appendChild(oVideoWrapper);
			opts.context = this.rootEl;
			return oVideo.init(opts)
			.then(oV => this.oVideo=oV)
			.then(() => {
				const media = this.rootEl.querySelector('video');
				if (!media) throw Error('No video element found');
				media.width = media.clientWidth;
				media.height = media.clientHeight;
			});
		}
	})
	.then(() => {

		// find media
		const media = this.rootEl.querySelector('video,img');

		if (!media) {
			throw Error('No Image or Video Element Loaded');
		}

		media.setAttribute('crossorigin', 'anonymous');

		// Ensure it has the dimension=360 for native support.
		const type = media.getAttribute('type') || '';
		if (type.indexOf('dimension=360;') === -1) {
			media.setAttribute('type', type + ';dimension=360;');
		}

		if (media.tagName === 'VIDEO') {
			media.setAttribute('webkit-playsinline', '')
		}

		this.media = media;

		if (opts.allowNativeMediaInterpretation && navigator.userAgent.match(/samsung.* mobile vr/ig)) {
			throw Error('360 Video handled natively');
		} else {

			// use it to instantiate new ThreeSixtyMedia
			this.threeSixtyMedia = new ThreeSixtyMedia(this.rootEl, this.media, opts);

			if (opts.reticule) {
				this.threeSixtyMedia.addReticule({
					image: opts.reticule
				});
			}

			return this.threeSixtyMedia;
		}

	});
}

OThreeSixty.prototype.addButton = function addButton(opts) {
	return this.webglPromise.then(() => this.threeSixtyMedia.addSpriteButton(opts));
}

OThreeSixty.prototype.destroy = function destroy() {
	if (!this.oVideo && this.media) {
		this.rootEl.parentNode.insertBefore(this.media, this.rootEl);
	}
	if (this.threeSixtyMedia) this.threeSixtyMedia.destroy();
	this.rootEl.parentNode.removeChild(this.rootEl);
	delete this.rootEl;
	delete this.media;
	delete this.threeSixtyMedia;
}

module.exports = OThreeSixty;
