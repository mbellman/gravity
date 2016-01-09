(function(global, $){
	var simulation;
	var screen;
	var time = Date.now();
	var running = false;
	var delay = 1000 / 60;
	var DT = delay / 1000;

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
	var refresh = true;
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

	function updateBodyCount(number) {
		$('#bodies').text(number);
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
		var distanceThreshold = 10;

		var bodies = [];

		// Public:
		// Update by a certain number of steps, each integrated over dt
		this.tick = function(dt, steps) {
			// Clear screen
			if (refresh) {
				screen.fill(Color.BLACK);
			}

			steps = steps || 1;

			// For however many steps specified...
			for (var s = 0 ; s < steps ; s++) {
				// ...run updates on celestial bodies
				var b = 0;

				while (bodies[b]) {
					var body = bodies[b];
					var acceleration = {x: 0, y: 0};
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
							bodies.splice((b < c ? c - 1 : c), 1);
							bodies.push(merged);

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

					body.accelerate(acceleration);
					b++;
				}

				// After acceleration is calculated for each body, update their positions
				for (var b = 0, bodyCount = bodies.length ; b < bodyCount ; b++) {
					bodies[b].update(dt, reverse);
				}
			}

			updateBodyCount(bodies.length);
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

		// Add an accretion disk, with customizable parameters
		this.addAccretionDisk = function(options) {
			options = $.extend({
				position: new Vec2(halfWidth, halfHeight),
				velocity: new Vec2(0, 0),
				radius: 200,
				bodies: 100,
				masses: [1, 50],
				rigid: false,
				spin: 'counter-clockwise'
			}, options);

			var tau = 2 * Math.PI;
			var spin = (options.spin === 'counter-clockwise' ? 1 : -1);

			// Place central mass
			var centerMass = options.masses[1] * 1000000;
			_.addBody(Calculate.radius(centerMass), centerMass, new Vec2(options.position.x, options.position.y), new Vec2(options.velocity.x, options.velocity.y), options.rigid);

			// Estimate total disk mass
			var totalMass = centerMass + (options.bodies * (options.masses[1] / 2));

			for (var i = 0 ; i < options.bodies ; i++) {
				// Distribute positions randomly around a pseudo-origin at [options.x, options.y]
				var angle = Math.random() * tau;
				var magnitude = (Math.random()*Math.random()) * options.radius;
				var position = new Vec2(options.position.x + Math.cos(angle) * magnitude, options.position.y + Math.sin(angle) * magnitude);

				// Set mass/size (heavier bodies nearer to center)
				var mass = options.masses[0] + options.masses[1] * ((options.radius - magnitude) / options.radius);
				var radius = Calculate.radius(mass);

				// Determine a stable orbital velocity vector for this body
				var orbitalVelocity = Calculate.orbitalVelocity((G/70) * (totalMass - mass), magnitude * distanceScalar);
				var velocityVector = new Vec2(spin*Math.sin(angle), -spin*Math.cos(angle)).normalize(orbitalVelocity).translate(options.velocity.x, options.velocity.y);

				_.addBody(radius, mass, position, velocityVector);
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
			simulation.tick(DT * speed);
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
		/*
		simulation.addAccretionDisk({
			position: new Vec2(500, 300),
			radius: 300,
			bodies: 500,
			masses: [0, 10],
			spin: 'clockwise'
		});
		*/

		simulation.addAccretionDisk({
			position: new Vec2(500, 300),
			radius: 500,
			bodies: 2000,
			masses: [0, 10],
			spin: 'clockwise'
		});

		/*
		simulation.addAccretionDisk({
			position: new Vec2(350, 500),
			velocity: new Vec2(20, 0),
			radius: 200,
			bodies: 500,
			masses: [0, 1],
			spin: 'clockwise'
		});
		*/

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

			e.preventDefault();
			return false;
		});

		// Adjusting simulation speed/direction
		$(document).on('keydown', function(e){
			if (e.keyCode === 82) {
				refresh = !refresh;
			}

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