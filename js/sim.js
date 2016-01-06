(function(global, $){
	var simulation;
	var screen;
	var time = Date.now();
	var running = false;

	var delay = 1000 / 60;
	var width = 1000;
	var height = 600;

	var camera = new Vec2(0, 0);

	/**
	 * Color bank
	 */
	var Color = {
		WHITE: '#FFF',
		BLACK: '#000',
		RED: '#F00',
		GREEN: '#0F0',
		BLUE: '#00F',
		PURPLE: '#606'
	};

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
						var force = body2.forceAt(body.position);

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

				// After gravitational acceleration is calculated for each body, update their positions
				for (var b = 0, bodyCount = bodies.length ; b < bodyCount ; b++) {
					bodies[b].update(dt);
				}
			}
		}

		// Draw all bodies
		this.render = function() {
			for (var b = 0, bodyCount = bodies.length ; b < bodyCount ; b++) {
				var body = bodies[b];

				var pos = {
					x: body.position.x - camera.x,
					y: body.position.y - camera.y
				};

				// Only draw if body is within screen space
				if (pos.x + body.radius > 0 && pos.x - body.radius < width) {
					if (pos.y + body.radius > 0 && pos.y - body.radius < height) {
						screen.circle(pos.x, pos.y, body.radius, Color.WHITE);
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
	}

	/**
	 * Main loop
	 */
	function main() {
		if (running) {
			var dt = ((Date.now() - time) / 1000);

			// Update and re-draw simulation
			simulation.tick(dt);
			simulation.render();

			// Update latest frame time
			time = Date.now();

			// Queue next frame
			setTimeout(main, delay);
		}
	}

	function resetSimulation() {
		simulation = new Simulation();
	}

	function resetScreen() {
		var canvas = $('#screen')[0];

		screen = new Canvas(canvas, width, height);
		screen.rectangle(0, 0, width, height, Color.BLACK);
	}

	function init() {
		running = true;

		resetSimulation();
		resetScreen();

		$('#screen').on('mousedown', grabCamera);

		for (var i = 0 ; i < 2000 ; i++) {
			var radius = Math.random() * 5;
			var mass = Math.random() * 1000;
			var position = new Vec2(Math.random()*width, Math.random()*height);
			var velocity = new Vec2(0, 0);
			simulation.addBody(radius, mass, position, velocity);
		}

		main();
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

		$('body').on('mousemove', function(e2){
			camera.x = initial.x + (mouse.x - e2.clientX);
			camera.y = initial.y + (mouse.y - e2.clientY);
		});

		$('body').on('mouseup', function(){
			$('body').off('mouseup mousemove');
		});
	}

	$(window).load(init);
})(window, jQuery);