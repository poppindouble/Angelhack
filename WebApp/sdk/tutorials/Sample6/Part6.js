var WILL = {
	backgroundColor: Module.Color.WHITE,
	activeWriters: new Array(),
	strokes: new Array(),

	init: function(width, height) {
		this.initInkEngine(width, height);
		this.initEvents();
	},

	initInkEngine: function(width, height) {
		this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);
		this.strokesLayer = this.canvas.createLayer();

		this.brush = new Module.SolidColorBrush();

		this.pathBuilder = new Module.SpeedPathBuilder();
		this.pathBuilder.setNormalizationConfig(182, 3547);
		this.pathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

		this.smoothener = new Module.MultiChannelSmoothener(this.pathBuilder.stride);

		this.viewArea = this.strokesLayer.bounds;

		client.init();

		this.writer = new Writer(client.id);
		client.writers[client.id] = this.writer;

		this.clearCanvas();
	},

	initEvents: function() {
		var self = this;
		$(Module.canvas).on("mousedown", function(e) {self.beginStroke(e);});
		$(Module.canvas).on("mousemove", function(e) {self.moveStroke(e);});
		$(document).on("mouseup", function(e) {self.endStroke(e);});
		$(Module.canvas).on("mouseout", function(e) {if (self.writer.inputPhase) self.writer.abort();});
	},

	beginStroke: function(e) {
		if (["mousedown", "mouseup"].contains(e.type) && e.button != 0) return;

		this.writer.inputPhase = Module.InputPhase.Begin;

		client.encoder.encodeComposeStyle(this.writer.strokeRenderer);
		client.send();

		this.activeWriters.add(this.writer);

		this.buildPath({x: e.clientX, y: e.clientY});
		this.drawPath();
	},

	moveStroke: function(e) {
		if (!this.writer.inputPhase) return;

		this.writer.inputPhase = Module.InputPhase.Move;
		this.pointerPos = {x: e.clientX, y: e.clientY};

		if (WILL.frameID != WILL.canvas.frameID) {
			var self = this;

			WILL.frameID = WILL.canvas.requestAnimationFrame(function() {
				if (self.writer.inputPhase && self.writer.inputPhase == Module.InputPhase.Move) {
					self.buildPath(self.pointerPos);
					self.drawPath();
				}
			}, true);
		}
	},

	endStroke: function(e) {
		if (!this.writer.inputPhase) return;

		this.writer.inputPhase = Module.InputPhase.End;

		this.buildPath({x: e.clientX, y: e.clientY});
		this.drawPath();

		client.encoder.encodeAdd([{
			brush: this.brush,
			path: this.path,
			width: this.writer.strokeRenderer.width,
			color: this.writer.strokeRenderer.color,
			ts: 0, tf: 1, randomSeed: 0,
			blendMode: this.writer.strokeRenderer.blendMode
		}]);
		client.send();
	},

	buildPath: function(pos) {
		if (this.writer.inputPhase == Module.InputPhase.Begin)
			this.smoothener.reset();

		var pathPart = this.pathBuilder.addPoint(this.writer.inputPhase, pos, Date.now()/1000);
		var smoothedPathPart = this.smoothener.smooth(pathPart, this.writer.inputPhase == Module.InputPhase.End);
		var pathContext = this.pathBuilder.addPathPart(smoothedPathPart);

		this.pathPart = pathContext.getPathPart();
		this.path = pathContext.getPath();

		if (this.writer.inputPhase == Module.InputPhase.Move) {
			var preliminaryPathPart = this.pathBuilder.createPreliminaryPath();
			var preliminarySmoothedPathPart = this.smoothener.smooth(preliminaryPathPart, true);

			this.preliminaryPathPart = this.pathBuilder.finishPreliminaryPath(preliminarySmoothedPathPart);
		}
	},

	drawPath: function() {
		this.writer.compose(this.pathPart, this.writer.inputPhase == Module.InputPhase.End);
	},

	redraw: function(dirtyArea) {
		if (!dirtyArea) dirtyArea = this.canvas.bounds;
		dirtyArea = Module.RectTools.ceil(dirtyArea);

		this.strokesLayer.clear(dirtyArea);

		this.strokes.forEach(function(stroke) {
			var affectedArea = Module.RectTools.intersect(stroke.bounds, dirtyArea);

			if (affectedArea) {
				this.writer.strokeRenderer.draw(stroke);
				this.writer.strokeRenderer.blendStroke(this.strokesLayer, stroke.blendMode);
			}
		}, this);

		this.refresh(dirtyArea);
	},

	refresh: function (dirtyArea, redraw) {
		if (this.activeWriters.length == 0) {
			if (redraw)
				this.redraw(dirtyArea);
			else
				this.refreshCanvas(dirtyArea);

			return;
		}

		if (this.activeArea)
			this.activeArea = Module.RectTools.union(this.activeArea, dirtyArea);
		else
			this.activeArea = dirtyArea || this.viewArea;

		if (redraw)
			this.activeArea.redraw = true;

		if (!this.refreshTimeoutID) {
			this.refreshTimeoutID = setTimeout(function() {
				var activeArea = WILL.activeArea;
				delete WILL.activeArea;

				if (activeArea.redraw)
					WILL.redraw(activeArea);
				else
					WILL.refreshCanvas(activeArea);

				delete WILL.refreshTimeoutID;
				if (WILL.activeArea) WILL.refresh(WILL.activeArea);
			}, 16);
		}
	},

	refreshCanvas: function(dirtyArea) {
		if (!dirtyArea) dirtyArea = this.canvas.bounds;
		dirtyArea = Module.RectTools.ceil(dirtyArea);

		if (this.activeWriters.length > 0) {
			if (this.writer.inputPhase && this.writer.inputPhase == Module.InputPhase.Move)
				this.writer.strokeRenderer.drawPreliminary(this.preliminaryPathPart);

			this.canvas.clear(dirtyArea, this.backgroundColor);
			this.canvas.blend(this.strokesLayer, {rect: dirtyArea});

			this.activeWriters.forEach(function(writer) {
				writer.strokeRenderer.updatedArea = dirtyArea;
				writer.strokeRenderer.blendUpdatedArea();

				writer.unconfirmedStrokesData.forEach(function(data) {
					if (data.layer.isDeleted()) console.log("deleted layer")
					this.canvas.blend(data.layer, {mode: data.blendMode, rect: dirtyArea});
				}, this);
			}, this);
		}
		else {
			this.canvas.clear(dirtyArea, this.backgroundColor);
			this.canvas.blend(this.strokesLayer, {rect: dirtyArea});
		}
	},

	clear: function() {
		parent.server.clear();
	},

	clearCanvas: function() {
		this.strokes = new Array();

		this.strokesLayer.clear(this.backgroundColor);
		this.canvas.clear(this.backgroundColor);
	}
};

function Writer(id) {
	this.id = id;

	this.unconfirmedStrokesData = new Array();

	this.strokeRenderer = new Module.StrokeRenderer(WILL.canvas);
	this.strokeRenderer.configure({brush: WILL.brush, color: ((id == 0)?Module.Color.BLUE:Module.Color.GREEN)});
}

Writer.prototype.compose = function(path, endStroke) {
	if (path.points.length == 0)
		return;

	this.strokeRenderer.draw(path, endStroke, this.id != client.id);

	if (endStroke) {
		this.unconfirmedStrokesData.push({layer: this.strokeRenderer.layer, strokeBounds: this.strokeRenderer.strokeBounds, blendMode: this.strokeRenderer.blendMode});
		this.strokeRenderer.layer = WILL.canvas.createLayer();

		delete this.inputPhase;
	}

	if (this.strokeRenderer.updatedArea)
		WILL.refresh(this.strokeRenderer.updatedArea);

	if (this.id == client.id) {
		client.encoder.encodeComposePathPart(path, this.strokeRenderer.color, true, false, endStroke);
		client.send(true);
	}
}

Writer.prototype.abort = function() {
	var dirtyArea = Module.RectTools.union(this.strokeRenderer.strokeBounds, this.strokeRenderer.preliminaryDirtyArea);

	this.strokeRenderer.abort();
	delete this.inputPhase;

	WILL.activeWriters.remove(this);
	WILL.refresh(dirtyArea);

	if (this.id == client.id) {
		client.encoder.encodeComposeAbort();
		client.send();
	}
}

var client = {
	name: window.name,
	writers: [],

	init: function() {
		this.id = parent.server.getSessionID(this.name);

		this.encoder = new Module.PathOperationEncoder();
		this.decoder = new Module.PathOperationDecoder(Module.PathOperationDecoder.getPathOperationDecoderCallbacksHandler(this.callbacksHandlerImplementation));
	},

	send: function(compose) {
		parent.server.receive(this.id, Module.readBytes(this.encoder.getBytes()), compose);
		this.encoder.reset();
	},

	receive: function(sender, data) {
		var writer = this.writers[sender];

		if (!writer) {
			writer = new Writer(sender);
			this.writers[sender] = writer;
		}

		Module.writeBytes(data, function(int64Ptr) {
			this.decoder.decode(writer, int64Ptr);
		}, this);
	},

	callbacksHandlerImplementation: {
		onComposeStyle: function(writer, style) {
			if (writer.id == client.id) return;
			writer.strokeRenderer.configure(style);
		},

		onComposePathPart: function(writer, path, endStroke) {
			if (writer.id == client.id) return;

			WILL.activeWriters.add(writer);
			writer.compose(path, endStroke);
		},

		onComposeAbort: function(writer) {
			if (writer.id == client.id) return;
			writer.abort();
		},

		onAdd: function(writer, strokes) {
			strokes.forEach(function(stroke) {
				WILL.strokes.push(stroke);

				var data = writer.unconfirmedStrokesData.shift();
				WILL.strokesLayer.blend(data.layer, {mode: data.blendMode, rect: data.strokeBounds});

				if (writer.unconfirmedStrokesData.length == 0 && !writer.inputPhase)
					WILL.activeWriters.remove(writer);

				data.layer.delete();

				WILL.refresh(data.strokeBounds, false);
			}, this);
		},

		onRemove: function(writer, group) {},

		onUpdateColor: function(writer, group, color) {},

		onUpdateBlendMode: function(writer, group, blendMode) {},

		onSplit: function(writer, splits) {},

		onTransform: function(writer, group, mat) {}
	}
};

var env = {
	width: top.document.getElementById(window.name).scrollWidth,
	height: top.document.getElementById(window.name).scrollHeight
};

Module.addPostScript(function() {
	Module.InkDecoder.getStrokeBrush = function(paint, writer) {
		return WILL.brush;
	}

	WILL.init(env.width, env.height);
});