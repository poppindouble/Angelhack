var WILL = {
	backgroundColor: Module.Color.WHITE,
	color: Module.Color.BLACK,
	mousePosX: 0,
	mousePosY: 0,
	strokes: new Array(),

	init: function(width, height) {
		this.initInkEngine(width, height);
		this.initEvents();
	},

	initInkEngine: function(width, height) {
		this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);
		this.canvas.clear(this.backgroundColor);
		this.strokesLayer = this.canvas.createLayer();

		if (MODE === 'DRAW') {
			this.brush = new Module.DirectBrush();
		} else if (MODE === 'ERASE') {
			this.brush = new Module.SolidColorBrush();
		}
		
		this.pathBuilder = new Module.SpeedPathBuilder();
		this.pathBuilder.setNormalizationConfig(182, 3547);
		this.pathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

		this.smoothener = new Module.MultiChannelSmoothener(this.pathBuilder.stride);
		// this.intersector = new Module.Intersector();

		this.strokeRenderer = new Module.StrokeRenderer(this.canvas, this.canvas);
		this.strokeRenderer.configure({brush: this.brush, color: this.color});
	},

	initEvents: function() {
		var self = this;
		$(Module.canvas).on("mousedown", function(e) {self.beginStroke(e);});
		$(Module.canvas).on("mousemove", function(e) {self.moveStroke(e);});
		$(document).on("mouseup", function(e) {self.endStroke(e);});
	},

	setMousePos: function(evt) {
		var canvas = document.getElementById('canvas');
		var rect = canvas.getBoundingClientRect();
	 	this.mousePosX = evt.clientX - rect.left;
	 	this.mousePosY = evt.clientY - rect.top;
	},

	beginStroke: function(e) {
		if (e.button != 0) return;
		console.log('MODE: ' + MODE);
		this.inputPhase = Module.InputPhase.Begin;

		this.setMousePos(e);
		
		this.buildPath({x: this.mousePosX, y: this.mousePosY});
		this.drawPath();
	},

	moveStroke: function(e) {
		if (!this.inputPhase) return;
		
		this.inputPhase = Module.InputPhase.Move;

		this.setMousePos(e);
		
		this.pointerPos = {x: this.mousePosX, y: this.mousePosY};

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

		this.setMousePos(e);
		
		this.buildPath({x: this.mousePosX, y: this.mousePosY});
		this.drawPath();

		var stroke = new Module.Stroke(this.brush, this.path, NaN, this.color, 0, 1);
	    this.strokes.push(stroke);	
		
		delete this.inputPhase;
	},

	buildPath: function(pos) {
		if (MODE === 'DRAW') {
			this.strokeRenderer.configure({brush: this.brush, color: this.color});	
		} else if (MODE === 'ERASE') {
			this.strokeRenderer.configure({brush: this.brush, color: this.backgroundColor});
		}
		
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

	erase: function() {
		this.intersector.setTargetAsStroke(this.pathPart, NaN);

	    var dirtyArea = null;
	    var strokesToRemove = new Array();

	    this.strokes.forEach(function(stroke) {
	        if (this.intersector.isIntersectingTarget(stroke)) {
	            dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
	            strokesToRemove.push(stroke);
	        }
	    }, this);

	    strokesToRemove.forEach(function(stroke) {
	        this.strokes.remove(stroke);
	    }, this);

	    if (dirtyArea)
	        this.redraw(dirtyArea);
	},

	redraw: function(dirtyArea) {
		if (!dirtyArea) dirtyArea = this.canvas.bounds;
		dirtyArea = Module.RectTools.ceil(dirtyArea);

		this.strokesLayer.clear(dirtyArea);

		this.strokes.forEach(function(stroke) {
			var affectedArea = Module.RectTools.intersect(stroke.bounds, dirtyArea);

			if (affectedArea) {
				this.strokeRenderer.draw(stroke);
				this.strokeRenderer.blendStroke(this.strokesLayer, stroke.blendMode);
			}
		}, this);

		this.refresh(dirtyArea);
	},

	refresh: function(dirtyArea) {
		this.canvas.blend(this.strokesLayer, {mode: Module.BlendMode.NONE, rect: Module.RectTools.ceil(dirtyArea)});
	},

	clear: function() {
		this.strokes = new Array();

		this.strokesLayer.clear(this.backgroundColor);
		this.canvas.clear(this.backgroundColor);
	},

	restore: function(fileBuffer) {
		var strokes = Module.InkDecoder.decode(new Uint8Array(fileBuffer));
		this.strokes.pushArray(strokes);
		this.redraw(strokes.bounds);
	},

	drawPath: function() {
		this.strokeRenderer.draw(this.pathPart, this.inputPhase == Module.InputPhase.End);
		// if (MODE === 'DRAW') {
		// 	this.strokeRenderer.draw(this.pathPart, this.inputPhase == Module.InputPhase.End);
		// } else if (MODE === 'ERASE') {
		// 	if (this.inputPhase == Module.InputPhase.Begin) {
		// 		this.strokeRenderer.draw(this.pathPart, false);
		// 		this.strokeRenderer.blendUpdatedArea();
		// 	}
		// 	else if (this.inputPhase == Module.InputPhase.Move) {
		// 		this.strokeRenderer.draw(this.pathPart, false);
		// 		this.strokeRenderer.drawPreliminary(this.preliminaryPathPart);

		// 		this.canvas.clear(this.strokeRenderer.updatedArea, this.backgroundColor);
		// 		this.canvas.blend(this.strokesLayer, {rect: this.strokeRenderer.updatedArea});

		// 		this.strokeRenderer.blendUpdatedArea();
		// 	}
		// 	else if (this.inputPhase == Module.InputPhase.End) {
		// 		this.strokeRenderer.draw(this.pathPart, true);
		// 		this.strokeRenderer.blendStroke(this.strokesLayer, Module.BlendMode.NORMAL);

		// 		this.canvas.clear(this.strokeRenderer.strokeBounds, this.backgroundColor);
		// 		this.canvas.blend(this.strokesLayer, {rect: this.strokeRenderer.strokeBounds});
		// 	}
		// }
	},

	clear: function() {
		this.canvas.clear(this.backgroundColor);
	}
};

Module.addPostScript(function() {
	WILL.init(1500, 600);
});