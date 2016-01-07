(function(global, $){
	var simulation;
	var screen;
	var time = Date.now();
	var running = false;

	var delay = 1000 / 60;

	var width = 1000;
	var height = 600;

	var halfWidth = width/2;
	var halfHeight = height/2;

	// Color bank
	var Color = {
		WHITE: '#FFF',
		BLACK: '#000',
		RED: '#F00',
		GREEN: '#0F0',
		BLUE: '#00F',
		PURPLE: '#606'
	};

	// Rendering/simulation parameters
	var camera = new Vec2(halfWidth, halfHeight);
	var zoom = 1;
	var speed = 1;
	var reverse = false;
	var distanceScalar = 5;

	function setZoom(value) {
		zoom = value;
		$('#zoom').text( Math.round(value * 100) / 100 );
	}

	function setSpeed(value) {
		speed = value;
		$('#speed').text( Math.round(value * 100) / 100 );
	}

	function setCamera(x, y) {
		camera.set(x, y);
		$('#coordinates').text(Math.round(x) + ', ' + Math.round(y));
	}

	function grabCamera(e) {
		var mouse = {
			x: e.clientX,
			y: e.clientY
		};

		var initial = {
			x: camera.x,
			y: camera.y
		};

		$(document).on('mousemove', function(e2){
			var newX = initial.x + (mouse.x - e2.clientX) / zoom;
			var newY = initial.y + (mouse.y - e2.clientY) / zoom;

			setCamera(newX, newY);
		});

		$(document).on('mouseup', function(){
			$(document).off('mouseup mousemove');
		});
	}

	/**
	 * Simulation logic
	 */
	function Simulation() {
		// Private:
		var _ = this;
		var G = 66.7;
		var maxForce = 500;
		var distanceThreshold = 10;

		var bodies = [];

		// Public:
		// Update by a certain number of steps, each integrated over dt
		this.tick = function(dt, steps) {
			// Clear screen
			screen.fill(Color.BLACK);

			steps = steps || 1;

			// For however many steps specified...
			for (var s = 0 ; s < steps ; s++) {
				// ...run updates on celestial bodies
				var b = 0;

				while (bodies[b]) {
					var body = bodies[b];
					var acceleration = new Vec2(0, 0);
					var c = 0;
					var collision = false;

					// Iterate over other bodies to calculate gravity effects
					while (bodies[c]) {
						if (c === b) {
							// Ignore self
							c++;
							continue;
						}

						var body2 = bodies[c];
						var distance = body2.distanceFrom(body);

						// Check for collisions
						if (distance < body.radius + body2.radius) {
							collision = true;

							var merged = body.mergeWith(body2);

							bodies.splice(b, 1);
							bodies.splice( (b < c ? c - 1 : c), 1);

							_.addBody(merged.radius, merged.mass, merged.position, merged.velocity);

							break;
						}

						// Determine gravitational force of secondary body on primary body
						var force = body2.forceAt(body.position, distanceScalar);

						acceleration.x -= G*force.x;
						acceleration.y -= G*force.y;

						c++;
					}

					if (collision) {
						// The body previously occupying this slot was merged in a collision
						b++;
						continue;
					}

					if (acceleration.magnitude() > maxForce) {
						// Normalize excessively high acceleration values
						acceleration.normalize(maxForce);
					}

					body.accelerate(acceleration);
					b++;
				}

				// After acceleration is calculated for each body, update their positions
				for (var b = 0, bodyCount = bodies.length ; b < bodyCount ; b++) {
					bodies[b].update(dt, reverse);
				}
			}
		}

		// Draw all bodies
		this.render = function() {
			for (var b = 0, bodyCount = bodies.length ; b < bodyCount ; b++) {
				var body = bodies[b];

				var object = {
					x: halfWidth + (body.position.x - camera.x) * zoom,
					y: halfHeight + (body.position.y - camera.y) * zoom,
					radius: body.radius * zoom
				};

				// Only draw if body is within screen space
				if (object.x + object.radius > 0 && object.x - object.radius < width) {
					if (object.y + object.radius > 0 && object.y - object.radius < height) {
						screen.circle(object.x, object.y, object.radius, Color.WHITE);
					}
				}
			}
		}

		// Add a new celestial body to the simulation
		this.addBody = function(radius, mass, position, velocity, rigid) {
			position = position || new Vec2(0, 0);
			velocity = velocity || new Vec2(0, 0);
			rigid = !!rigid || false;

			bodies.push(new Body(radius, mass, rigid).setPosition(position).setVelocity(velocity));
		}

		this.addAccretionDisk = function(options) {
			$.extend({
				x: halfWidth,
				y: halfHeight,
				radius: 200,
				bodies: 100,
				masses: [1, 50]
			}, options);

			var tau = 2 * Math.PI;

			for (var i = 0 ; i < options.bodies ; i++) {
				// Distribute positions randomly around a pseudo-origin at [options.x, options.y]
				var angle = Math.random() * tau;
				var magnitude = Math.random() * options.radius;
				var position = new Vec2(options.x + Math.cos(angle) * magnitude, options.y + Math.sin(angle) * magnitude);

				// Set mass/size (heavier bodies nearer to center)
				var mass = options.masses[0] + options.masses[1] * ((options.radius - magnitude) / options.radius);
				var radius = 1 + Math.log(Math.max(1, mass)) / 10;

				// Determine a semi-stable disk center orbital velocity vector for this body
				var velocity = new Vec2(5000*Math.sin(angle) / (magnitude / distanceScalar), -5000*Math.cos(angle) / (magnitude / distanceScalar));

				if (velocity.magnitude() > 10) {
					velocity.normalize(10);
				}

				_.addBody(radius, mass, position, velocity);
			}
		}
	}

	/**
	 * Main loop
	 */
	function main() {
		if (running) {
			var dt = ((Date.now() - time) / 1000);

			// Update and re-draw simulation
			simulation.tick(dt * speed);
			simulation.render();

			// Update latest frame time
			time = Date.now();

			// Queue next frame
			setTimeout(main, delay);
		}
	}

	function resetScreen() {
		var canvas = $('#screen')[0];

		screen = new Canvas(canvas, width, height);
		screen.rectangle(0, 0, width, height, Color.BLACK);
	}

	function init() {
		// Permit main loop
		running = true;

		// Restart simulation + refresh screen
		simulation = new Simulation();
		resetScreen();

		// Initialize camera at origin
		setCamera(halfWidth, halfHeight);

		// Customize initial state
		simulation.addAccretionDisk({
			x: 500,
			y: 300,
			radius: 300,
			bodies: 500,
			masses: [0, 1000]
		});

		main();
	}

	$(window).load(function(){
		// Camera drag
		$('#screen').on('mousedown', grabCamera);

		// Zooming
		$(document).on('mousewheel', function(e){
			if (e.deltaY < 0) {
				// Zoom out
				setZoom(zoom * Math.pow(0.99, Math.abs(e.deltaY)));
			}

			if (e.deltaY > 0) {
				// Zoom in
				setZoom(zoom * Math.pow(1.01, Math.abs(e.deltaY)));
			}
		});

		// Adjusting simulation speed/direction
		$(document).on('keydown', function(e){
			if (e.keyCode === 37) {
				// Slow down simulation
				setSpeed(speed * 0.9);
			}

			if (e.keyCode === 39) {
				// Speed up simulation
				setSpeed(speed * 1.1);
			}

			if (e.keyCode === 32) {
				// Time reversal
				reverse = !reverse;
			}
		});

		init();
	});
})(window, jQuery);