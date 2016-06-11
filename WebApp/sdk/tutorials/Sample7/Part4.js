var WILL = {
	MIN_SCALE_FACTOR: 0.2,
	MAX_SCALE_FACTOR: 4,

	backgroundColor: Module.Color.TRANSPARENT,
	color: Module.Color.from(204, 204, 204),

	init: function(width, height) {
		this.VIEW_AREA = Module.RectTools.create(0, 0, width, height);

		this.initInkEngine(width, height);
		this.initEvents();
	},

	initInkEngine: function(width, height) {
		this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);

		this.canvas2D = document.getElementById("canvas2d");
		this.canvas2D.width = width;
		this.canvas2D.height = height;

		this.ctx2d = this.canvas2D.getContext("2d");

		this.brush = new Module.DirectBrush();

		this.pathBuilder = new Module.SpeedPathBuilder();
		this.pathBuilder.setNormalizationConfig(182, 3547);
		this.pathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

		this.smoothener = new Module.MultiChannelSmoothener(this.pathBuilder.stride);

		this.strokeRenderer = new Module.StrokeRenderer(this.canvas);
		this.strokeRenderer.configure({brush: this.brush, color: this.color});

		this.transform = Module.MatTools.create();

		this.clear();
	},

	initEvents: function() {
		var self = this;
		$(Module.canvas).on("mousedown", function(e) {self.beginStroke(e);});
		$(Module.canvas).on("mousemove", function(e) {self.moveStroke(e);});
		$(document).on("mouseup", function(e) {self.endStroke(e);});
	},

	getMousePos: function(e) {
		var pos = {x: e.clientX, y: e.clientY};
		var transform = Module.MatTools.invert(this.transform);
		var pt = Module.MatTools.transformPoint(pos, transform);

		return pt;
	},

	beginStroke: function(e) {
		if (["mousedown", "mouseup"].contains(e.type) && e.button != 0) return;

		this.inputPhase = Module.InputPhase.Begin;

		this.buildPath(this.getMousePos(e));
		this.drawPath();
	},

	moveStroke: function(e) {
		if (!this.inputPhase) return;

		this.inputPhase = Module.InputPhase.Move;
		this.pointerPos = this.getMousePos(e);

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

		this.buildPath(this.getMousePos(e));
		this.drawPath();

		delete this.inputPhase;
	},

	buildPath: function(pos) {
		if (this.inputPhase == Module.InputPhase.Begin)
			this.smoothener.reset();

		var pathPart = this.pathBuilder.addPoint(this.inputPhase, pos, Date.now()/1000);
		var smoothedPathPart = this.smoothener.smooth(pathPart, this.inputPhase == Module.InputPhase.End);
		var pathContext = this.pathBuilder.addPathPart(smoothedPathPart);

		this.pathPart = pathContext.getPathPart();
		this.pathPart.transform = this.transform;

		this.path = pathContext.getPath();
		this.path.transform = this.transform;

		if (this.inputPhase == Module.InputPhase.Move) {
			var preliminaryPathPart = this.pathBuilder.createPreliminaryPath();
			var preliminarySmoothedPathPart = this.smoothener.smooth(preliminaryPathPart, true);

			this.preliminaryPathPart = this.pathBuilder.finishPreliminaryPath(preliminarySmoothedPathPart);
			this.preliminaryPathPart.transform = this.transform;
		}
	},

	drawPath: function() {
		switch (this.inputPhase) {
			case Module.InputPhase.Begin:
				if (this.pathPart.points.length > 0) {
					this.strokeRenderer.draw(this.pathPart, false);
					this.refresh();
				}

				break;
			case Module.InputPhase.Move:
				this.strokeRenderer.draw(this.pathPart, false);
				this.refresh();

				break;
			case Module.InputPhase.End:
				this.strokeRenderer.draw(this.pathPart, true);
				this.refresh();

				var stroke = this.strokeRenderer.toStroke(this.path);
				var stroke2D = new Module.FlatPath();
				stroke2D.setStroke(stroke);

				stroke2D.draw(this.ctx2d);

				break;
			default:
				throw new Error("Invalid input phase:", this.inputPhase);
		}
	},

	refresh: function() {
		if (this.inputPhase == Module.InputPhase.Move)
			this.strokeRenderer.drawPreliminary(this.preliminaryPathPart);

		this.canvas.clear(this.strokeRenderer.updatedArea);
		this.strokeRenderer.blendUpdatedArea();

		if (this.inputPhase == Module.InputPhase.End)
			this.canvas.clear(this.strokeRenderer.strokeBounds);
	},

	clear: function() {
		this.ctx2d.clearCanvas();
		this.canvas.clear();
	}
};

Module.addPostScript(function() {
	WILL.init(1600, 600);
});