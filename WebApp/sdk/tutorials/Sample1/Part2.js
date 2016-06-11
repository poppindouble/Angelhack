var WILL = {
	backgroundColor: Module.Color.WHITE,
	color: Module.Color.from(204, 204, 204),

	init: function(width, height) {
		this.initInkEngine(width, height);
		this.initEvents();
	},

	initInkEngine: function(width, height) {
		this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);
		this.canvas.clear(this.backgroundColor);

		this.brush = new Module.DirectBrush();

		this.speedPathBuilder = new Module.SpeedPathBuilder();
		this.speedPathBuilder.setNormalizationConfig(182, 3547);
		this.speedPathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

		if (window.PointerEvent) {
			this.pressurePathBuilder = new Module.PressurePathBuilder();
			this.pressurePathBuilder.setNormalizationConfig(0.195, 0.88);
			this.pressurePathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);
		}

		this.strokeRenderer = new Module.StrokeRenderer(this.canvas, this.canvas);
		this.strokeRenderer.configure({brush: this.brush, color: this.color});
	},

	initEvents: function() {
		var self = this;

		if (window.PointerEvent) {
			Module.canvas.addEventListener("pointerdown", function(e) {self.beginStroke(e);});
			Module.canvas.addEventListener("pointermove", function(e) {self.moveStroke(e);});
			document.addEventListener("pointerup", function(e) {self.endStroke(e);});
		}
		else {
			Module.canvas.addEventListener("mousedown", function(e) {self.beginStroke(e);});
			Module.canvas.addEventListener("mousemove", function(e) {self.moveStroke(e);});
			document.addEventListener("mouseup", function(e) {self.endStroke(e);});

			if (window.TouchEvent) {
				Module.canvas.addEventListener("touchstart", function(e) {self.beginStroke(e);});
				Module.canvas.addEventListener("touchmove", function(e) {self.moveStroke(e);});
				document.addEventListener("touchend", function(e) {self.endStroke(e);});
			}
		}
	},

	getPressure: function(e) {
		return (window.PointerEvent && e instanceof PointerEvent && e.pressure !== 0.5)?e.pressure:NaN;
	},

	beginStroke: function(e) {
		if (e.button != 0) return;

		this.inputPhase = Module.InputPhase.Begin;
		this.pressure = this.getPressure(e);
		this.pathBuilder = isNaN(this.pressure)?this.speedPathBuilder:this.pressurePathBuilder;

		this.buildPath({x: e.clientX, y: e.clientY});
		this.drawPath();
	},

	moveStroke: function(e) {
		if (!this.inputPhase) return;

		this.inputPhase = Module.InputPhase.Move;
		this.pointerPos = {x: e.clientX, y: e.clientY};
		this.pressure = this.getPressure(e);

		if (WILL.frameID != WILL.canvas.frameID) {
			var self = this;

			WILL.frameID = WILL.canvas.requestAnimationFrame(function() {
				if (self.inputPhase && self.inputPhase == Module.InputPhase.Move) {
					self.buildPath(self.pointerPos);
					self.drawPath();
				}
			}, true);
		}
	},

	endStroke: function(e) {
		if (!this.inputPhase) return;

		this.inputPhase = Module.InputPhase.End;
		this.pressure = this.getPressure(e);

		this.buildPath({x: e.clientX, y: e.clientY});
		this.drawPath();

		delete this.inputPhase;
	},

	buildPath: function(pos) {
		var pathBuilderValue = isNaN(this.pressure)?Date.now() / 1000:this.pressure;

		var pathPart = this.pathBuilder.addPoint(this.inputPhase, pos, pathBuilderValue);
		var pathContext = this.pathBuilder.addPathPart(pathPart);

		this.pathPart = pathContext.getPathPart();
	},

	drawPath: function() {
		this.strokeRenderer.draw(this.pathPart, this.inputPhase == Module.InputPhase.End);
	},

	clear: function() {
		this.canvas.clear(this.backgroundColor);
	}
};

Module.addPostScript(function() {
	WILL.init(1600, 600);
});