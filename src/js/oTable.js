/**
 * Initialises an o-three-sixty components inside the element passed as the first parameter
 *
 * @param {(HTMLElement|string)} [el=document.body] - Element where to search for the o-three-sixty component. You can pass an HTMLElement or a selector string
 * @returns {OThreeSixty} - A single OThreeSixty instance
 */

 /*
global document, HTMLElement
 */

window.WebVRConfig = {
	BUFFER_SCALE: 0.5,
	CARDBOARD_UI_DISABLED: true,
};

require('webvr-polyfill');
const ThreeSixtyMedia = require('./three-sixty-media');

const constructAll = function() {
	OThreeSixty.init();
	[].slice.call(document.querySelectorAll('[data-o-component~="o-three-sixty"]')).forEach(function (el) {
		new OThreeSixty(el);
	});
	document.removeEventListener('o.DOMContentLoaded', constructAll);
};

function OThreeSixty(rootEl) {

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

		// init o-video

		// find video
		const video = this.rootEl.querySelector('video');

		// use it to instantiate new ThreeSixtyMedia
		new ThreeSixtyMedia(this.rootEl, video);
	}
}

document.addEventListener('o.DOMContentLoaded', constructAll);

module.exports = OThreeSixty;
