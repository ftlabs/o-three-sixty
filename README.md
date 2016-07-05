# o-three-sixty

Embed Three Sixty distorted Media or o-videos, provide click-drag interface and vr interface.

``` html
	<!--
		Use o-video to pull down a 360 video
		Setting the data-o-video-source to
		Brightcove will get it to pull the video
		in using o-video from Brightcove.

		All other data-o-video work as specced out there.
	-->
	<div
		data-o-component="o-three-sixty"
		data-o-video-source="Brightcove"
		data-o-video-id="4165329773001"
		style="width: 480px; min-height:288px;"
	></div>

	<!-- Embed a 360 image -->
	<div data-o-component="o-three-sixty">
		<img
			width=480
			height=360
			src="https://image.webservices.ft.com/v1/images/raw/https%3A%2F%2Fcdn.rawgit.com%2Fftlabs%2Fo-three-sixty%2Fmaster%2Fdemos%2Fsrc%2Fdemo-img.jpg?source=test" alt="A 360 image of 3 men and a woman." />
	</div>

	<!-- Embed a 360 video

		You can also choose the starting angle

		data-o-three-sixty-lat="15"
	-->
	<div data-o-component="o-three-sixty" data-o-three-sixty-lat="15" >
		<video
			poster="https://image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fftlabs.github.io%2Fthree-sixty-video%2Fimages%2Fmuaythai.jpg?source=test"
			src="https://ada-pull-zone-egnalefgk5.netdna-ssl.com/mt2.webm"
			width="450"
			height="300"
			controls
			crossorigin="anonymous"
			type="video/webm;">
	</div>
```

```js

	// If you are using o-video by setting then give it the same options as o-video
	OThreeSixty(
		document.querySelector('[data-o-component="o-three-sixty"]'),
		{
			latOffset: 15,
			longOffset: 0
		}
	)
```

## Licence

This software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).
