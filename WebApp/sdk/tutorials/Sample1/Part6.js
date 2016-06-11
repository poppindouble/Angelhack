var WILL = {
	backgroundColor: Module.Color.WHITE,
	color: Module.Color.from(204, 204, 204),

	init: function(width, height) {
		this.initInkEngine(width, height);
		this.initEvents();
	},

	initInkEngine: function(width, height) {
		this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);
		this.strokesLayer = this.canvas.createLayer();

		this.clear();

		this.brush = new Module.ParticleBrush(false);
		this.brush.configure(true, {x: 0, y: 0}, 0.15, 0.05, Module.RotationMode.RANDOM);
		this.brush.configureShape("shape.png");
		this.brush.configureFill("fill.png");

		this.pathBuilder = new Module.SpeedPathBuilder();
		this.pathBuilder.setNormalizationConfig(180, 1800);
		this.pathBuilder.setPropertyConfig(Module.PropertyName.Width, 8, 30, 5, NaN, Module.PropertyFunction.Power, 1, false);
		this.pathBuilder.setPropertyConfig(Module.PropertyName.Alpha, 0.2, 0.2, NaN, NaN, Module.PropertyFunction.Power, 1, false);

		this.smoothener = new Module.MultiChannelSmoothener(this.pathBuilder.stride);

		this.strokeRenderer = new Module.StrokeRenderer(this.canvas);
		this.strokeRenderer.configure({brush: this.brush, color: this.color});
	},

	initEvents: function() {
		var self = this;
		$(Module.canvas).on("mousedown", function(e) {self.beginStroke(e);});
		$(Module.canvas).on("mousemove", function(e) {self.moveStroke(e);});
		$(document).on("mouseup", function(e) {self.endStroke(e);});
	},

	beginStroke: function(e) {
		if (e.button != 0) return;

		this.inputPhase = Module.InputPhase.Begin;

		this.buildPath({x: e.clientX, y: e.clientY});
		this.drawPath();
	},

	moveStroke: function(e) {
		if (!this.inputPhase) return;

		this.inputPhase = Module.InputPhase.Move;
		this.pointerPos = {x: e.clientX, y: e.clientY};

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

		this.buildPath({x: e.clientX, y: e.clientY});
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

		if (this.inputPhase == Module.InputPhase.Move) {
			var preliminaryPathPart = this.pathBuilder.createPreliminaryPath();
			var preliminarySmoothedPathPart = this.smoothener.smooth(preliminaryPathPart, true);

			this.preliminaryPathPart = this.pathBuilder.finishPreliminaryPath(preliminarySmoothedPathPart);
		}
	},

	drawPath: function() {
		if (this.inputPhase == Module.InputPhase.Begin) {
			this.strokeRenderer.draw(this.pathPart, false);
			this.strokeRenderer.blendUpdatedArea();
		}
		else if (this.inputPhase == Module.InputPhase.Move) {
			this.strokeRenderer.draw(this.pathPart, false);
			this.strokeRenderer.drawPreliminary(this.preliminaryPathPart);

			this.canvas.clear(this.strokeRenderer.updatedArea, this.backgroundColor);
			this.canvas.blend(this.strokesLayer, {rect: this.strokeRenderer.updatedArea});

			this.strokeRenderer.blendUpdatedArea();
		}
		else if (this.inputPhase == Module.InputPhase.End) {
			this.strokeRenderer.draw(this.pathPart, true);

			this.strokeRenderer.blendStroke(this.strokesLayer, Module.BlendMode.NORMAL);

			this.canvas.clear(this.strokeRenderer.strokeBounds, this.backgroundColor);
			this.canvas.blend(this.strokesLayer, {rect: this.strokeRenderer.strokeBounds});
		}
	},

	clear: function() {
		this.strokesLayer.clear(this.backgroundColor);
		this.canvas.clear(this.backgroundColor);
	}
};

Module.addPostScript(function() {
	WILL.init(1600, 600);
});