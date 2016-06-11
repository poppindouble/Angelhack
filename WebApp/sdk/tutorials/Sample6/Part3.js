var WILL = {
	backgroundColor: Module.Color.WHITE,
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
	},

	beginStroke: function(e) {
		if (["mousedown", "mouseup"].contains(e.type) && e.button != 0) return;

		this.inputPhase = Module.InputPhase.Begin;

		this.buildPath({x: e.clientX, y: e.clientY});
		this.erase();
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
					self.erase();
				}
			}, true);
		}
	},

	endStroke: function(e) {
		if (!this.inputPhase) return;

		this.inputPhase = Module.InputPhase.End;

		this.buildPath({x: e.clientX, y: e.clientY});
		this.erase();

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

	erase: function() {
		var result = new Array;

		this.writer.intersector.setTargetAsStroke(this.pathPart, NaN);

		this.strokes.forEach(function(stroke) {
			var intervals = this.writer.intersector.intersectWithTarget(stroke);
			var split = stroke.split(intervals, this.writer.intersector.targetType);

			if (split.intersect) {
				split.id = this.strokes.indexOf(stroke);
				result.push(split);
			}
		}, this);

		if (result.length > 0) {
			client.encoder.encodeSplit(result);
			client.send();
		}
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

	refresh: function(dirtyArea) {
		if (!dirtyArea) dirtyArea = this.canvas.bounds;
		dirtyArea = Module.RectTools.ceil(dirtyArea);

		if (this.inputPhase && this.inputPhase == Module.InputPhase.Move) {
			this.writer.strokeRenderer.drawPreliminary(this.preliminaryPathPart);

			this.canvas.clear(dirtyArea, this.backgroundColor);
			this.canvas.blend(this.strokesLayer, {rect: dirtyArea});
		}

		this.canvas.clear(dirtyArea, this.backgroundColor);
		this.canvas.blend(this.strokesLayer, {rect: dirtyArea});
	},

	clear: function() {
		parent.server.clear();
	},

	clearCanvas: function() {
		this.strokes = new Array();

		this.strokesLayer.clear(this.backgroundColor);
		this.canvas.clear(this.backgroundColor);
	},

	restore: function(fileBuffer) {
		var strokes = Module.InkDecoder.decode(new Uint8Array(fileBuffer));

		client.encoder.encodeAdd(strokes);
		client.send();
	}
};

function Writer(id) {
	this.id = id;

	this.strokeRenderer = new Module.StrokeRenderer(WILL.canvas);
	this.strokeRenderer.configure({brush: WILL.brush, color: Module.Color.BLACK});

	this.intersector = new Module.Intersector();
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
		onComposeStyle: function(writer, style) {},

		onComposePathPart: function(writer, path, endStroke) {},

		onComposeAbort: function(writer) {},

		onAdd: function(writer, strokes) {
			WILL.strokes.pushArray(strokes);
			WILL.redraw(strokes.bounds);
		},

		onRemove: function(writer, group) {},

		onUpdateColor: function(writer, group, color) {},

		onUpdateBlendMode: function(writer, group, blendMode) {},

		onSplit: function(writer, splits) {
			var strokesToRemove = new Array();

			splits.forEach(function(split) {
				var stroke = WILL.strokes[split.id];
				var replaceWith = new Array();

				split.intervals.forEach(function(interval) {
					var subStroke = stroke.subStroke(interval.fromIndex, interval.toIndex, interval.fromTValue, interval.toTValue);
					replaceWith.push(subStroke);
				}, this);

				strokesToRemove.push({stroke: stroke, replaceWith: replaceWith});
			}, this);

			strokesToRemove.forEach(function(strokeToRemove) {
				WILL.strokes.replace(strokeToRemove.stroke, strokeToRemove.replaceWith);
			}, this);

			if (strokesToRemove.length > 0)
				WILL.redraw(splits.affectedArea);
		},

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

	if (client.id == 0) {
		var url = location.toString();
		url = url.substring(0, url.lastIndexOf("/")) + "/ship.data";

		var request = new XMLHttpRequest();

		request.onreadystatechange = function() {
			 if (this.readyState == this.DONE)
				WILL.restore(this.response);
		};

		request.open("GET", url, true);
		request.responseType = "arraybuffer";
		request.send();
	}
});