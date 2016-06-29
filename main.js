/*global require, module*/


window.WebVRConfig = {
	BUFFER_SCALE: 0.5,
	CARDBOARD_UI_DISABLED: true,
};

require('webvr-polyfill');
module.exports = require('./src/js/oThreeSixty');
