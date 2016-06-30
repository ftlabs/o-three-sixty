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


	opts.latOffset = this.rootEl.dataset.oThreeSixtyLat || 0;
	opts.longOffset = this.rootEl.dataset.oThreeSixtyLong || 0;

	Promise.resolve()
	.then(() => {
		if (this.rootEl.dataset.oVideoSource === 'Brightcove') {

			// init o-video
			this.mediaEl = document.createElement('div');
			this.mediaEl.dataset.oComponent='o-video';

			// Transfer o-video data
			Object.keys(this.rootEl.dataset).forEach(k => {
				if (k.indexOf("oVideo") === 0) {
					this.mediaEl.dataset[k] = this.rootEl.dataset[k];
					delete this.rootEl.dataset[k];
				}
			});

			this.rootEl.appendChild(this.mediaEl);
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
