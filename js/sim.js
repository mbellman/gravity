(function(global){
	var simulation;
	var screen;
	var time = Date.now();
	var running = false;

	var delay = 1000 / 60;
	var width = 1000;
	var height = 600;

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
	 * Simulation class
	 */
	function Simulation() {
		// Private:
		var _ = this;
		var G = 66.7;
		var maxForce = 500;
		var distanceThreshold = 10;

		var bodies = [];

		// Public:
		this.tick = function(dt, steps) {
			// Clear screen
			screen.fill(Color.BLACK);

			steps = steps || 1;

			// For however many steps specified...
			for (var s = 0 ; s < steps ; s++) {
				// ...run updates on celestial bodies
				for (var b = 0, bodyCount = bodies.length ; b < bodyCount ; b++) {
					var body = bodies[b];
					var acceleration = new Vec2(0, 0);

					// Calculate force of gravity from each neighboring body
					for (var c = 0 ; c < bodyCount ; c++) {
						if (c === b) {
							// Ignore self
							continue;
						}

						var force = bodies[c].calculateForceAt(body.position);

						acceleration.x -= G*force.x;
						acceleration.y -= G*force.y;
					}

					if (acceleration.magnitude() > maxForce) {
						// Normalize excessively high acceleration values
						acceleration.normalize(maxForce);
					} 

					body.accelerate(acceleration);
					body.update(dt);
				}
			}
		}

		this.render = function() {
			for (var b = 0, bodyCount = bodies.length ; b < bodyCount ; b++) {
				var body = bodies[b];

				// Only redraw if body is within screen space
				if (body.position.x + body.radius > 0 && body.position.x - body.radius < width) {
					if (body.position.y + body.radius > 0 && body.position.y - body.radius < height) {
						screen.circle(body.position.x, body.position.y, body.radius, Color.WHITE);
					}
				}
			}
		}

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

			simulation.tick(dt);
			simulation.render();

			// Update latest frame time
			time = Date.now();

			//requestAnimationFrame(main)
			setTimeout(main, delay);
		}
	}

	function resetSimulation() {
		simulation = new Simulation();
	}

	function resetScreen() {
		var canvas = document.querySelector('#screen');

		screen = new Canvas(canvas, width, height);
		screen.rectangle(0, 0, width, height, Color.BLACK);
	}

	function init() {
		running = true;

		resetSimulation();
		resetScreen();

		simulation.addBody(1, 100, new Vec2(250, 250), new Vec2(2, 30));
		simulation.addBody(1, 115, new Vec2(420, 200), new Vec2(-2, 15));
		simulation.addBody(2, 2005, new Vec2(350, 300), null, true);

		main();
	}

	global.onload = init;
})(window);