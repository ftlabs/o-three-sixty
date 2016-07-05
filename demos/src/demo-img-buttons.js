'use strict';
/* global document, window */

const OThreeSixty = require('../../main.js');
const Qr = require('qrious');

new Qr({
    element: document.getElementById('qrcode'),
    value: window.location.href
});

function onHoverStart() {
	this.object3d.material.opacity = 1;
}
function onHoverEnd() {
	this.object3d.material.opacity = 0.5;
}

OThreeSixty
.addScripts()
.then(function () {
	return new OThreeSixty(
		document.querySelector('[data-o-component~="o-three-sixty"]'), {
			reticule: 'https://image.webservices.ft.com/v1/images/raw/https%3A%2F%2Fcloud.githubusercontent.com%2Fassets%2F4225330%2F16559249%2F9583d8ba-41e3-11e6-94dd-f47aded72252.png?source=origami-demo',
			latOffset: 60,

			// Don't let the media be handled natively on gearVR
			allowNativeMediaInterpretation: false
		}
	);
})
.then(myThreeSixty => {
	myThreeSixty.addButton({
		image: 'https://image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fim.ft-static.com%2Fcontent%2Fimages%2Fa60ae24b-b87f-439c-bf1b-6e54946b4cf2.img?source=test',
		width: 320,
		height: 180
	})
	.then(buttonEvents => {
		buttonEvents.on('click', function onClick() {
			console.log('click 1');
			window.navigator.vibrate(200);
		})
		.on('hoverStart', onHoverStart)
		.on('hoverEnd', onHoverEnd);
		buttonEvents.object3d.material.opacity = 0.5;
	});
	myThreeSixty.addButton({
		image: 'https://image.webservices.ft.com/v1/images/raw/https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F6%2F60%2FMorning%2C_Interior_-_Luce.jpeg%2F1920px-Morning%2C_Interior_-_Luce.jpeg?source=origami-demo&width=160&height=180',
		width: 160,
		height: 180
	})
	.then(buttonEvents => {
		buttonEvents.on('click', function onClick() {
			console.log('click 2', this);
			window.navigator.vibrate(200);
		})
		.on('hoverStart', onHoverStart)
		.on('hoverEnd', onHoverEnd);
		buttonEvents.object3d.material.opacity = 0.5;
	});
    return myThreeSixty;
});
