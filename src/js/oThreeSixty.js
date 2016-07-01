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
		this.rootEl = rootEl.querySelector('[data-o-component~="o-three-sixty"]');
	}

	if (this.rootEl !== undefined) {
		this.init(opts);
	}
}

OThreeSixty.prototype.init = function init(opts = {}) {

	opts.latOffset = opts.latOffset || this.rootEl.dataset.oThreeSixtyLat || 0;
	opts.longOffset = opts.longOffset || this.rootEl.dataset.oThreeSixtyLong || 0;

	Promise.resolve()
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
			.then(oV => this.oVideo=oV);
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

		this.media = media;

		if (navigator.userAgent.match(/samsung.* mobile vr/ig)) {
			console.log('360 Video handled natively');
		} else {
			// use it to instantiate new ThreeSixtyMedia
			this.threeSixtyMedia = new ThreeSixtyMedia(this.rootEl, this.media, opts);
		}

	});
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
