/*global require, module, window, document */

'use strict';

window.WebVRConfig = {
	BUFFER_SCALE: 0.5,
	CARDBOARD_UI_DISABLED: true,
};

const OThreeSixty = require('./src/js/oThreeSixty');

function addScript (url) {
	const p = new Promise(function (resolve, reject) {
		const script = document.createElement('script');
		script.setAttribute('src', url);
		document.head.appendChild(script);
		script.onload = resolve;
		script.onerror = reject;
	});
	function promiseScript () {
		return p;
	};
	promiseScript.promise = p;
	return promiseScript;
}

OThreeSixty.addScripts = function () {
	return Promise.all([
		addScript('https://cdn.rawgit.com/borismus/webvr-polyfill/v1.0.0/build/webvr-polyfill.js').promise,
		addScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r78/three.min.js').promise
	]);
}

const constructAll = function() {

	OThreeSixty.addScripts()
	.then(() => {
		[].slice.call(document.querySelectorAll('[data-o-component~="o-three-sixty"]')).forEach(function (el) {
			new OThreeSixty(el);
		});
	});

	document.removeEventListener('o.DOMContentLoaded', constructAll);
};
document.addEventListener('o.DOMContentLoaded', constructAll);

module.exports = OThreeSixty;
