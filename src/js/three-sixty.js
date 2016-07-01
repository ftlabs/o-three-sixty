'use strict';
/* global document, navigator, window, cancelAnimationFrame, requestAnimationFrame, THREE */

let rotWorldMatrix;
let yAxis;
let zAxis;

// from THREE.js
function fovToNDCScaleOffset( fov ) {
	const pxscale = 2.0 / ( fov.leftTan + fov.rightTan );
	const pxoffset = ( fov.leftTan - fov.rightTan ) * pxscale * 0.5;
	const pyscale = 2.0 / ( fov.upTan + fov.downTan );
	const pyoffset = ( fov.upTan - fov.downTan ) * pyscale * 0.5;
	return { scale: [ pxscale, pyscale ], offset: [ pxoffset, pyoffset ] };
}

// from THREE.js
function fovPortToProjection( fov, rightHanded, zNear, zFar ) {

	rightHanded = rightHanded === undefined ? true : rightHanded;
	zNear = zNear === undefined ? 0.01 : zNear;
	zFar = zFar === undefined ? 10000.0 : zFar;

	const handednessScale = rightHanded ? - 1.0 : 1.0;

	// start with an identity matrix
	const mobj = new THREE.Matrix4();
	const m = mobj.elements;

	// and with scale/offset info for normalized device coords
	const scaleAndOffset = fovToNDCScaleOffset( fov );

	// X result, map clip edges to [-w,+w]
	m[ 0 * 4 + 0 ] = scaleAndOffset.scale[ 0 ];
	m[ 0 * 4 + 1 ] = 0.0;
	m[ 0 * 4 + 2 ] = scaleAndOffset.offset[ 0 ] * handednessScale;
	m[ 0 * 4 + 3 ] = 0.0;

	// Y result, map clip edges to [-w,+w]
	// Y offset is negated because this proj matrix transforms from world coords with Y=up,
	// but the NDC scaling has Y=down (thanks D3D?)
	m[ 1 * 4 + 0 ] = 0.0;
	m[ 1 * 4 + 1 ] = scaleAndOffset.scale[ 1 ];
	m[ 1 * 4 + 2 ] = - scaleAndOffset.offset[ 1 ] * handednessScale;
	m[ 1 * 4 + 3 ] = 0.0;

	// Z result (up to the app)
	m[ 2 * 4 + 0 ] = 0.0;
	m[ 2 * 4 + 1 ] = 0.0;
	m[ 2 * 4 + 2 ] = zFar / ( zNear - zFar ) * - handednessScale;
	m[ 2 * 4 + 3 ] = ( zFar * zNear ) / ( zNear - zFar );

	// W result (= Z in)
	m[ 3 * 4 + 0 ] = 0.0;
	m[ 3 * 4 + 1 ] = 0.0;
	m[ 3 * 4 + 2 ] = handednessScale;
	m[ 3 * 4 + 3 ] = 0.0;

	mobj.transpose();

	return mobj;
}

function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}

// from THREE.js
function fovToProjection( fov, rightHanded, zNear, zFar ) {

	const DEG2RAD = Math.PI / 180.0;

	const fovPort = {
		upTan: Math.tan( fov.upDegrees * DEG2RAD ),
		downTan: Math.tan( fov.downDegrees * DEG2RAD ),
		leftTan: Math.tan( fov.leftDegrees * DEG2RAD ),
		rightTan: Math.tan( fov.rightDegrees * DEG2RAD )
	};

	return fovPortToProjection( fovPort, rightHanded, zNear, zFar );
}

class ThreeSixtyMedia {
	constructor (container, media, opts) {

		if (!THREE) {
			throw Error('Threee.js required.');
		}

		if (!rotWorldMatrix) {
			rotWorldMatrix = new THREE.Matrix4();
			yAxis = new THREE.Vector3(0,1,0);
			zAxis = new THREE.Vector3(0,0,1);
		}

		this.listeners = [];

		let video;
		if (media.tagName === 'VIDEO') {
			video = media;
			this.video = video;
		}

		let preserveDrawingBuffer = false;

		this.buttonContainer = document.createElement('div');
		this.buttonContainer.classList.add('button-container');

		this.latOffset = opts.latOffset;
		this.longOffset = opts.longOffset;

		container.classList.add('o-three-sixty-container');

		container.appendChild(this.buttonContainer);

		this.container = container;
		this.fullscreen = this.container.requestFullscreen || this.container.mozRequestFullscreen || this.container.webkitRequestFullscreen;

		this.addButton('Exit Fullscreen', null, 'exit-fullscreen', function () {
			(document.exitFullscreen || document.mozExitFullscreen || document.webkitExitFullscreen).bind(document)();
		});

		if (document.isFullScreen !== undefined) {
			this.addButton('Full Screen', 'F', 'fullscreen', function () {
				this.fullscreen.bind(this.container)();
			});
			this.addEventListener(document,'fullscreenchange', function() {
				if ( document.isFullScreen ) {
					if (document.fullscreenElement === this.container) {
						setTimeout(() => this.resize(), 500);
					}
				} else {
					setTimeout(() => this.resize(), 500);
				}
			}.bind(this));
		} else if (document.webkitIsFullScreen !== undefined) {
			this.addButton('Full Screen', 'F', 'fullscreen', function () {
				this.fullscreen.bind(this.container)();
			});
			this.addEventListener(document,'webkitfullscreenchange', function() {
				if ( document.webkitIsFullScreen ) {
					if (document.webkitFullscreenElement === this.container) {
						setTimeout(() => this.resize(), 500);
					}
				} else {
					setTimeout(() => this.resize(), 500);
				}
			}.bind(this));
		} else if (document.mozIsFullScreen !== undefined) {
			this.addButton('Full Screen', 'F', 'fullscreen', function () {
				this.fullscreen.bind(this.container)();
			});
			this.addEventListener(document,'mozfullscreenchange', function() {
				if ( document.mozIsFullScreen ) {
					if (document.mozFullscreenElement === this.container) {
						setTimeout(() => this.resize(), 500);
					}
				} else {
					setTimeout(() => this.resize(), 500);
				}
			}.bind(this));
		}

		if (navigator.getVRDisplays) {
			navigator.getVRDisplays()
			.then(displays => {
				if (displays.length > 0) {
					this.vrDisplay = displays[0];
					this.addButton('Reset', 'R', null, function () { this.vrDisplay.resetPose(); });
					if (this.vrDisplay.capabilities.canPresent) this.vrPresentButton = this.addButton('Enter VR', 'E', 'cardboard-icon', this.onVRRequestPresent);
					this.addEventListener(window,'vrdisplaypresentchange', () => this.onVRPresentChange(), false);
				}
			});
			preserveDrawingBuffer = true;
		} else if (navigator.getVRDevices) {
			console.error('Your browser supports WebVR but not the latest version. See <a href=\'http://webvr.info\'>webvr.info</a> for more info.');
		} else {
			console.error('Your browser does not support WebVR. See <a href=\'http://webvr.info\'>webvr.info</a> for assistance.');
		}

		this.vrDisplay = null;
		this.vrPresentButton;
		media.style.display = 'none';
		this.media = media;

		this.camera = new THREE.PerspectiveCamera( 90, this.media.width / this.media.height, 1, 10000 );
		this.camera.up.set( 0, 0, 1 );
		this.scene = new THREE.Scene();
		this.orientation = new THREE.Quaternion([0,0,0,1]);

		const renderer = new THREE.WebGLRenderer( { antialias: false, preserveDrawingBuffer } );
		renderer.context.disable(renderer.context.DEPTH_TEST);
		renderer.setPixelRatio(Math.floor(window.devicePixelRatio));
		renderer.autoClear = false;
		container.appendChild( renderer.domElement );
		this.renderer = renderer;

		setTimeout(this.resize.bind(this), 100);

		this.addGeometry();

		this.startAnimation();

		this.addEventListener(this.renderer.domElement,'touchmove', e => {
			e.preventDefault();
			return false;
		});

		if (video) {
			if (video.readyState >= 2) {
				this.loadVideoTexture();
				this.addPlayButton();
			} else {
				this.addEventListener(video,'canplay', function oncanplay() {
					video.removeEventListener('canplay', oncanplay);
					this.loadVideoTexture();
					this.addPlayButton();
				}.bind(this));
			}

			let lastClick;

			this.addEventListener(this.renderer.domElement,'mousedown', () => {
				lastClick = Date.now();
			});

			this.addEventListener(this.renderer.domElement,'click', e => {
				if (Date.now() - lastClick >= 300) return;
				if (!this.hasVideoTexture) return;
				e.preventDefault();
				if (this.video.paused) {
					this.updateTexture(this.videoTexture);
					this.video.play();
					this.removeButton(this.playButton);
					this.playButton = null;
				} else {
					this.addPlayButton();
					this.video.pause();
				}
			});
		}
	}

	addPlayButton() {
		if (this.playButton) return;
		this.playButton = this.addButton('Play', 'space', 'play-icon', e => {
			this.removeButton(this.playButton);
			this.playButton = null;
			if (this.hasVideoTexture) this.updateTexture(this.videoTexture);
			this.video.play();
			e.stopPropagation();
		});
	}

	addEventListener(el, type, callback) {
		this.listeners.push({el, type, callback});
		el.addEventListener(type, callback);
	}

	removeAllEventListeners() {
		this.listeners.forEach(function remove({el, type, callback}) {
			el.removeEventListener(type, callback);
		});
	}

	loadVideoTexture() {
		if (this.hasVideoTexture) return;
		const texture = new THREE.VideoTexture( this.video );
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.format = THREE.RGBFormat;

		this.hasVideoTexture = true;
		this.videoTexture = texture;
	}

	updateTexture(map) {
		if (this.currentTexture === map) return;
		if (!map) throw Error('No texture to update');
		this.currentTexture = map;
		const material = new THREE.MeshBasicMaterial({ color: 0xffffff, map });
		this.sphere.material = material;
	}

	addGeometry() {

		if (this.sphere) {
			throw Error('Geometery already set up');
		}

		const poster = this.video ? this.video.getAttribute('poster') : this.media.src;
		if (poster) {
			const loader = new THREE.TextureLoader();
			loader.crossOrigin = 'Anonymous';
			loader.load(
				poster,
				t => (!this.hasVideoTexture || this.currentTexture !== this.videoTexture) && this.updateTexture(t)
			);
		}

		const material = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true });
		const geometry = new THREE.SphereGeometry( 5000, 64, 32 );

		const mS = (new THREE.Matrix4()).identity();
		mS.elements[0] = -1;
		geometry.applyMatrix(mS);

		const sphere = new THREE.Mesh( geometry, material );
		rotateAroundWorldAxis(sphere, zAxis, -this.longOffset);
		rotateAroundWorldAxis(sphere, yAxis, -this.latOffset);
		this.sphere = sphere;
		this.scene.add( sphere );
	}

	resize() {

		if (this.vrDisplay && this.vrDisplay.isPresenting) {

			const leftEye = this.vrDisplay.getEyeParameters('left');
			const rightEye = this.vrDisplay.getEyeParameters('right');

			const w = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
			const h = Math.max(leftEye.renderHeight, rightEye.renderHeight);
			this.camera.aspect = w/h;
			this.renderer.setSize(w, h);
		} else if (document.isFullScreen || document.webkitIsFullScreen || document.mozIsFullScreen) {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.renderer.setSize(
				window.innerWidth,
				window.innerHeight
			);
		} else {
			this.camera.aspect = this.media.width / this.media.height;
			this.renderer.setSize( this.media.width, this.media.height );
		}
		this.camera.updateProjectionMatrix();
	}

	stopAnimation() {
		cancelAnimationFrame(this.raf);
		if (this.video) {
			this.video.pause();
		}
	}

	startAnimation() {
		this.raf = requestAnimationFrame( () => this.startAnimation() );
		this.render();
	}

	renderSceneView (pose, eye) {
		let orientation = pose.orientation;
		let position = pose.position;
		if (!orientation) {
			orientation = [0, 0, 0, 1];
		}
		if (!position) {
			position = [0, 0, 0];
		}
		this.camera.position.fromArray(position);
		this.orientation.set(...orientation);
		this.camera.rotation.setFromQuaternion(this.orientation, 'XZY');
		if (eye) {
			this.camera.projectionMatrix = fovToProjection(eye.fieldOfView, true, this.camera.near, this.camera.far );
			this.camera.position.add(new THREE.Vector3(...eye.offset));
		} else {
			this.camera.fov = 45;
			this.camera.updateProjectionMatrix();
		}

		this.renderer.render(this.scene, this.camera);
	}

	render() {
		this.renderer.clear();
		if (this.vrDisplay) {
			const pose = this.vrDisplay.getPose();
			if (this.vrDisplay.isPresenting) {
				const size = this.renderer.getSize();

				this.renderer.setScissorTest( true );

				this.renderer.setScissor( 0, 0, size.width / 2, size.height );
				this.renderer.setViewport( 0, 0, size.width / 2, size.height );
				this.renderSceneView(pose, this.vrDisplay.getEyeParameters('left'));

				this.renderer.setScissor( size.width / 2, 0, size.width / 2, size.height );
				this.renderer.setViewport( size.width / 2, 0, size.width / 2, size.height );
				this.renderSceneView(pose, this.vrDisplay.getEyeParameters('right'));

				this.renderer.setScissorTest( false );
				this.renderer.setViewport( 0, 0, size.width, size.height );
				this.vrDisplay.submitFrame(pose);
			} else {
				this.renderSceneView(pose, null);
			}
		} else {

			// No VRDisplay found.
			this.renderer.render(this.scene, this.camera);
		}
	}

	destroy() {
		this.media.style.display = '';
		this.stopAnimation();
		this.removeAllEventListeners();
		this.container.removeChild(this.buttonContainer);
	}

	onVRRequestPresent () {
		this.vrDisplay.requestPresent({ source: this.renderer.domElement })
		.then(() => {}, function () {
			console.error('requestPresent failed.', 2000);
		});
	}

	onVRExitPresent () {
		this.vrDisplay.exitPresent()
		.then(() => {}, function () {
			console.error('exitPresent failed.', 2000);
		});
	}

	onVRPresentChange () {
		this.resize();
	}

	addButton(text, shortcut, classname, callback) {
		const button = document.createElement('button');
		if (classname) button.classList.add(classname);
		button.textContent = text;
		this.addEventListener(button,'click', callback.bind(this));
		this.buttonContainer.appendChild(button);
		return button;
	}

	removeButton(el) {
		this.buttonContainer.removeChild(el);
	}
}

module.exports = ThreeSixtyMedia;