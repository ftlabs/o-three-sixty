/**
 * Initialises an o-three-sixty components inside the element passed as the first parameter
 *
 * @param {(HTMLElement|string)} [el=document.body] - Element where to search for the o-three-sixty component. You can pass an HTMLElement or a selector string
 * @returns {OThreeSixty} - A single OThreeSixty instance
 */

 /*
global document, HTMLElement
 */

const oVideo = require('o-video');
const ThreeSixtyMedia = require('./three-sixty');

function wrapElement(targetEl, wrapEl) {
	const parentEl = targetEl.parentNode;
	parentEl.insertBefore(wrapEl, targetEl);
	wrapEl.appendChild(targetEl);
}

function OThreeSixty(rootEl, opts) {

	if (!rootEl) {
		rootEl = document.body;
	} else if (!(rootEl instanceof HTMLElement)) {
		rootEl = document.querySelector(rootEl);
	}
	if (rootEl.getAttribute('data-o-component') === "o-three-sixty") {
		this.rootEl = rootEl;
	} else {
		this.rootEl = rootEl.querySelector('[data-o-component~="o-three-sixty"]');
	}

	if (this.rootEl !== undefined) {
		this.init(opts);
	}
}

OThreeSixty.prototype.init = function init(opts = {}) {


	opts.latOffset = this.rootEl.dataset.oThreeSixtyMediaLat || 0;
	opts.longOffset = this.rootEl.dataset.oThreeSixtyMediaLong || 0;

	Promise.resolve()
	.then(() => {
		if (this.rootEl.dataset.oVideoSource === 'Brightcove') {

			// init o-video
			const mediaEl = this.rootEl;
			this.rootEl = document.createElement('div');
			mediaEl.dataset.oComponent='o-video';
			this.rootEl.dataset.oComponent='o-three-sixty';
			wrapElement(mediaEl, this.rootEl);
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
			new ThreeSixtyMedia(this.rootEl, this.media, opts);
		}

	});
}

const constructAll = function() {
	[].slice.call(document.querySelectorAll('[data-o-component~="o-three-sixty"]')).forEach(function (el) {
		new OThreeSixty(el);
	});
	document.removeEventListener('o.DOMContentLoaded', constructAll);
};
document.addEventListener('o.DOMContentLoaded', constructAll);

module.exports = OThreeSixty;
