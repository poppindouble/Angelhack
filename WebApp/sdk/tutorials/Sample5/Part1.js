var WILL = {
	backgroundColor: Module.Color.from(190, 143, 1),

	init: function(width, height) {
		this.initInkEngine(width, height);
	},

	initInkEngine: function(width, height) {
		this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);
		this.canvas.clear(this.backgroundColor);

		this.initImageLayer();
	},

	initImageLayer: function() {
		var url = location.toString();
		url = url.substring(0, url.lastIndexOf("/")) + "/image.png";

		this.imageLayer = this.canvas.createLayer({width: 750, height: 600});

		Module.GLTools.prepareTexture(
			this.imageLayer.texture,
			url,
			function(texture) {
				this.canvas.blend(this.imageLayer, {mode: Module.BlendMode.NONE});
			},
			this
		);
	}
};

Module.addPostScript(function() {
	WILL.init(1600, 600);
});