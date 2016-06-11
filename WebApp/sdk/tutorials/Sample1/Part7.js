var WILL = {
	backgroundColor: Module.Color.WHITE,
	color: Module.Color.from(204, 204, 204),

	init: function(width, height) {
		Module.canvas = document.getElementById("canvas");
		Module.canvas.width = width;
		Module.canvas.height = height;
		Module.canvas.style.backgroundColor = Module.Color.toHex(this.backgroundColor);

		this.context = Module.canvas.getContext("2d");
	},

	draw: function() {
		var points = [0,300,10, 100,100,20, 400,100,40, 500,300,50];
		var path = Module.PathBuilder.createPath(points, 3);
		var strokeData = {path: path, color: this.color};

		var bezierPath = new Module.BezierPath();
		bezierPath.setStroke(strokeData);

		bezierPath.draw(this.context);
	}
};

Module.addPostScript(function() {
	WILL.init(1600, 600);
	WILL.draw();
});