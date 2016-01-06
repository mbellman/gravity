(function(global){
	var simulation, screen, running = false;

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
		var time = Date.now();
		var maxForce = 500;
		var distanceThreshold = 10;

		var bodies = [];

		// Public:
		this.tick = function(steps) {
			var dt = ((Date.now() - time) / 1000) * (steps || 1);

			// Clear screen
			//screen.fill(Color.BLACK);

			// Run updates on celestial bodies
			for (var b = 0, bodyCount = bodies.length ; b < bodyCount ; b++) {
				var body = bodies[b];

				var acceleration = new Vec2(0, 0);

				body.update(dt);

				for (var c = 0 ; c < bodyCount ; c++) {
					if (c === b) {
						continue;
					}

					// Calculate force of gravity from each neighboring body
					var force = bodies[c].calculateForceAt(body.position);

					acceleration.x -= G*force.x;
					acceleration.y -= G*force.y;
				}

				if (acceleration.magnitude() > maxForce) {
					// Normalize excessively high acceleration values
					acceleration.normalize(maxForce);
				} 

				body.verlet(acceleration, dt);

				// Only redraw if body is within screen space
				if (body.position.x + body.radius > 0 && body.position.x - body.radius < width) {
					if (body.position.y + body.radius > 0 && body.position.y - body.radius < height) {
						screen.circle(body.position.x, body.position.y, body.radius, Color.WHITE);
					}
				}
			}

			// Update latest frame time
			time = Date.now();
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
			simulation.tick();
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

		simulation.addBody(1, 15, new Vec2(250, 250), new Vec2(2, 25));
		//simulation.addBody(1, 115, new Vec2(420, 200), new Vec2(-2, 15));
		simulation.addBody(2, 2005, new Vec2(350, 300), null, true);

		main();
	}

	global.onload = init;
})(window);