(function(global){
	var simulation, screen, running = false;

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
		var G = 0;
		var bodies = [];
		var time = Date.now();

		function spawn(radius, mass, position, velocity) {
			position = position || new Vec2(0, 0);
			velocity = velocity || new Vec2(0, 0);

			bodies.push(new Body(radius, mass).setPosition(position).setVelocity(velocity));
		}

		// Public:
		this.tick = function(steps) {
			var dt = Date.now() - time;
			steps = steps || 1;

			// Clear screen
			screen.fill(Color.BLACK);

			// Run updates on celestial bodies
			for (var b = 0, bodyCount = bodies.length ; b < bodyCount ; b++) {
				var body = bodies[b];

				var acceleration = new Vec2(0, 0);

				for (var c = 0 ; c < bodyCount ; c++) {
					if (c === b) {
						continue;
					}

					var force = bodies[c].calculateForceAt(new Vec2(body.x, body.y));

					acceleration.x += G*force.x;
					acceleration.y += G*force.y;
				}

				body.accelerate(acceleration);
				body.update(steps, dt);

				// Only redraw if body is within screen space
				if (body.position.x + body.radius > 0 && body.position.x - body.radius < width) {
					if (body.position.y + body.radius > 0 && body.position.y - body.radius < height) {
						screen.circle(body.position.x, body.position.y, body.radius, Color.WHITE);
					}
				}
			}

			if (Math.random() < 0.5) {
				var rad = 1 + Math.round(Math.random() * 10);
				var pos = new Vec2(Math.random() * width, Math.random() * height);
				var vel = new Vec2(Math.random() - 0.5, Math.random() - 0.5);
				spawn(rad, 1, pos, vel);
			}

			// Update latest frame time
			time = Date.now();
		}
	}

	/**
	 * Main loop
	 */
	function main() {
		if (running) {
			simulation.tick();
			requestAnimationFrame(main);
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
		main();
	}

	global.onload = init;
})(window);