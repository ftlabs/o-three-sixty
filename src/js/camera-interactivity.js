/**
 *
 * Sets up an enviroment for detecting that
 * the camera is looking at objects.
 *
 * Ported from https://github.com/AdaRoseEdwards/three-camera-interactions/blob/master/lib/index.js
 */

 /*
global document, HTMLElement, navigator, THREE
 */
'use strict';

const EventEmitter = require('event-emitter');
const util = require('util');

const visibleFilter = target => target.object3d.visible

/**
 * Keeps track of interactive 3D elements and
 * can be used to trigger events on them.
 *
 * The domElement is to pick up touch ineractions
 *
 * @param  {[type]} domElement [description]
 * @return {[type]}            [description]
 */
module.exports = function CameraInteractivityWorld(domElement, threeOverride) {

	const THREE_IN = threeOverride || THREE;

	if (!THREE_IN) throw Error('No Three Library Detected');

	function InteractivityTarget(node) {

		EventEmitter.call(this);

		this.position = node.position;
		this.hasHover = false;
		this.object3d = node;

		this.on('hover', () => {
			if (!this.hasHover) {
				this.emit('hoverStart');
			}
			this.hasHover = true;
		});

		this.on('hoverOut', () => {
			this.hasHover = false;
		});

		this.hide = () =>{
			this.object3d.visible = false;
		};

		this.show = () =>{
			this.object3d.visible = true;
		};
	}
	util.inherits(InteractivityTarget, EventEmitter);

	this.targets = new Map();

	this.detectInteractions = function (camera) {

		const targets = Array.from(this.targets.values());
		const raycaster = new THREE_IN.Raycaster();
		raycaster.setFromCamera(new THREE_IN.Vector2(0,0), camera);
		const hits = raycaster.intersectObjects(targets.filter(visibleFilter));
		let target = false;

		if (hits.length) {

			// Show hidden text object3d child
			target = this.targets.get(hits[0].object);
			if (target) target.emit('hover');
		}

		// if it is not the one just marked for highlight
		// and it used to be highlighted un highlight it.
		for (const t of targets) {
			if (t !== target && t.hasHover) t.emit('hoverOut');
		}
	};

	const interact = (event) => {
		Array.from(this.targets.values()).forEach(target => {
			if (target.hasHover) {
				target.emit(event.type);
			}
		});
	};
	this.interact = interact;

	domElement.addEventListener('click', interact);
	domElement.addEventListener('mousedown', interact);
	domElement.addEventListener('mouseup', interact);
	domElement.addEventListener('touchup', interact);
	domElement.addEventListener('touchdown', interact);

	this.destroy = () => {
		domElement.removeEventListener('click', interact);
		domElement.removeEventListener('mousedown', interact);
		domElement.removeEventListener('mouseup', interact);
		domElement.removeEventListener('touchup', interact);
		domElement.removeEventListener('touchdown', interact);
	}

	this.makeTarget = node => {
		const newTarget = new InteractivityTarget(node);
		this.targets.set(node, newTarget);
		return newTarget;
	};
};