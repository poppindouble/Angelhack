var WILL = {
	MIN_SCALE_FACTOR: 1,
	MAX_SCALE_FACTOR: 3,

	backgroundColor: Module.Color.WHITE,
	color: Module.Color.from(204, 204, 204),

	strokes: new Array(),

	init: function(width, height) {
		this.VIEW_AREA = Module.RectTools.create(0, 0, width, height);

		this.initInkEngine(width, height);
		this.initEvents();
	},

	initInkEngine: function(width, height) {
		this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);
		this.strokesLayer = this.canvas.createLayer();
		this.strokesAndCurrentStrokeLayer = this.canvas.createLayer();

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

		var zoomNode = document.getElementById("zoom");
		var panNode = document.getElementById("pan");
		var lastPoint;

		document.addEventListener("wheel", function(e) {
			WILL.zoom(e);

			zoomNode.innerHTML = Math.floor(WILL.transform.a * 100);
			panNode.innerHTML = "x: " + Math.floor(WILL.transform.tx) + ", y: " + Math.floor(WILL.transform.ty);
		});

		Module.canvas.addEventListener("mousedown", function(e) {
			if (e.button == 2) lastPoint = {x: e.clientX, y: e.clientY};
		});

		Module.canvas.addEventListener("mousemove", function(e) {
			if (e.button != 2) return;

			var delta = {x: e.clientX - lastPoint.x, y: e.clientY - lastPoint.y};
			lastPoint = {x: e.clientX, y: e.clientY};

			WILL.pan(delta);
			panNode.innerHTML = "x: " + Math.floor(WILL.transform.tx) + ", y: " + Math.floor(WILL.transform.ty);
		});

		document.getElementById("reset").addEventListener("click", function(e) {
			zoomNode.innerHTML = "100";
			panNode.innerHTML = "x: 0, y: 0";

			WILL.resetTransforms();
		});
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
		this.path = pathContext.getPath();

		if (this.inputPhase == Module.InputPhase.Move) {
			var preliminaryPathPart = this.pathBuilder.createPreliminaryPath();
			var preliminarySmoothedPathPart = this.smoothener.smooth(preliminaryPathPart, true);

			this.preliminaryPathPart = this.pathBuilder.finishPreliminaryPath(preliminarySmoothedPathPart);
		}
	},

	drawPath: function() {
		switch (this.inputPhase) {
			case Module.InputPhase.Begin:
				if (this.pathPart.points.length > 0) {
					this.strokeRenderer.draw(this.pathPart, false);
					this.refresh(this.strokeRenderer.updatedArea);
				}

				break;
			case Module.InputPhase.Move:
				this.strokeRenderer.draw(this.pathPart, false);
				this.refresh(this.strokeRenderer.updatedArea);

				break;
			case Module.InputPhase.End:
				var stroke = this.strokeRenderer.toStroke(this.path);
				this.strokes.push(stroke);

				this.strokeRenderer.draw(this.pathPart, true);
				this.refresh(this.strokeRenderer.updatedArea);

				this.strokeRenderer.blendStroke(this.strokesLayer);

				break;
			default:
				throw new Error("Invalid input phase:", this.inputPhase);
		}
	},

	refresh: function(dirtyArea) {
		if (!dirtyArea) return;

		var strokesLayer = this.strokesLayer;
		var transformArea = Module.MatTools.transformRect(dirtyArea, this.transform);

		if (this.inputPhase) {
			strokesLayer = this.strokesAndCurrentStrokeLayer;

			this.strokesAndCurrentStrokeLayer.blend(this.strokesLayer, {mode: Module.BlendMode.NONE, rect: dirtyArea});

			if (this.inputPhase == Module.InputPhase.Move)
				this.strokeRenderer.drawPreliminary(this.preliminaryPathPart);

			this.strokeRenderer.blendUpdatedArea(this.strokesAndCurrentStrokeLayer);
		}

		this.canvas.clear(transformArea, this.backgroundColor);
		this.canvas.blend(strokesLayer, {sourceRect: dirtyArea, destinationRect: transformArea});
	},

	clear: function() {
		this.strokes = new Array();

		this.strokesLayer.clear();
		this.refresh(WILL.VIEW_AREA);
	},

	zoom: function(e) {
		var pos = {x: e.clientX, y: e.clientY};
		var scale = (e.deltaY > 0)?0.97:1.03;
		var transform = Module.MatTools.makeScaleAtPoint(scale, pos);
		transform = Module.MatTools.multiply(transform, this.transform);

		if ((this.transform.a == WILL.MIN_SCALE_FACTOR && transform.a < WILL.MIN_SCALE_FACTOR) || (this.transform.a == WILL.MAX_SCALE_FACTOR && transform.a > WILL.MAX_SCALE_FACTOR))
			return;

		if (transform.a < WILL.MIN_SCALE_FACTOR) {
			transform.a = WILL.MIN_SCALE_FACTOR;
			transform.d = WILL.MIN_SCALE_FACTOR;
		}
		else if (transform.a > WILL.MAX_SCALE_FACTOR) {
			transform.a = WILL.MAX_SCALE_FACTOR;
			transform.d = WILL.MAX_SCALE_FACTOR;
		}

		var transformArea = Module.MatTools.transformRect(WILL.VIEW_AREA, transform);

		if (transform.tx > 0) transform.tx = 0;
		if (transform.ty > 0) transform.ty = 0;
		if (transform.tx < WILL.VIEW_AREA.width - transformArea.width) transform.tx = WILL.VIEW_AREA.width - transformArea.width;
		if (transform.ty < WILL.VIEW_AREA.height - transformArea.height) transform.ty = WILL.VIEW_AREA.height - transformArea.height;

		this.transform = transform;

		this.canvas.clear();
		this.refresh(WILL.VIEW_AREA);
	},

	pan: function(delta) {
		var transformArea = Module.MatTools.transformRect(WILL.VIEW_AREA, this.transform);

		var transform = Module.MatTools.makeTranslate(delta);
		transform = Module.MatTools.multiply(transform, this.transform);

		if (transform.tx > 0) transform.tx = 0;
		if (transform.ty > 0) transform.ty = 0;
		if (transform.tx < WILL.VIEW_AREA.width - transformArea.width) transform.tx = WILL.VIEW_AREA.width - transformArea.width;
		if (transform.ty < WILL.VIEW_AREA.height - transformArea.height) transform.ty = WILL.VIEW_AREA.height - transformArea.height;

		this.transform = transform;

		this.canvas.clear();
		this.refresh(WILL.VIEW_AREA);
	},

	resetTransforms: function() {
		this.transform = Module.MatTools.create();
		this.refresh(WILL.VIEW_AREA);
	}
};

Module.addPostScript(function() {
	WILL.init(1600, 600);
});