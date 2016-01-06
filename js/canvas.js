function Canvas(element, width, height) {
	// Private:
	var _ = this;
	var canvas = element;
	var ctx;
	var tau = 2*Math.PI;

	(function init() {
		ctx = element.getContext('2d');
		canvas.width = width;
		canvas.height = height;
	})();

	// Public:
	this.rectangle = function(x, y, w, h, color) {
		ctx.beginPath();
		ctx.rect(x, y, w, h);
		ctx.fillStyle = color;
		ctx.fill();
	}

	this.circle = function(x, y, radius, color) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, tau, false);
		ctx.fillStyle = color;
		ctx.fill();
	}

	this.line = function(x1, y1, x2, y2, color) {
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.strokeStyle = color;
		ctx.stroke();
	}

	this.clear = function() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	this.cut = function(x, y, w, h) {
		ctx.clearRect(x, y, w, h);
	}

	this.fill = function(color) {
		_.rectangle(0, 0, canvas.width, canvas.height, color);
	}
}