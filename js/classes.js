function Vec2(x, y) {
	var _ = this;
	this.x = x;
	this.y = y;

	this.set = function(x, y) {
		_.x = x;
		_.y = y;
	}

	this.magnitude = function() {
		return Math.sqrt(_.x*_.x + _.y*_.y);
	}

	this.normalize = function(maximum) {
		var normalizer = maximum / _.magnitude();

		_.x *= normalizer;
		_.y *= normalizer;
	}
}

function Body(radius, mass, rigid) {
	// Private:
	var _ = this;
	var acceleration = new Vec2(0, 0);

	// Public:
	this.rigid = rigid;
	this.position = new Vec2(0, 0);
	this.velocity = new Vec2(0, 0);
	this.radius = radius;
	this.mass = mass;

	this.setPosition = function(position) {
		_.position.set(position.x, position.y);
		return _;
	}

	this.setVelocity = function(velocity) {
		_.velocity.set(velocity.x, velocity.y);
		return _;
	}

	this.calculateForceAt = function(position) {
		var dx = position.x - _.position.x;
		var dy = position.y - _.position.y;
		var r = Math.sqrt(dx*dx + dy*dy);
		var force = _.mass / (r*r);

		return {
			x: (dx / r) * force,
			y: (dy / r) * force
		};
	}

	this.update = function(dt) {
		if (!_.rigid) {
			var halfstep = dt/2;

			_.position.x += (_.velocity.x * dt) + acceleration.x * dt * halfstep;
			_.position.y += (_.velocity.y * dt) + acceleration.y * dt * halfstep;
		}
	}

	this.verlet = function(_acceleration, dt) {
		var halfstep = dt/2;

		_.velocity.x += (acceleration.x + _acceleration.x) * 0.5 * halfstep;
		_.velocity.y += (acceleration.y + _acceleration.y) * 0.5 * halfstep;

		acceleration.set(_acceleration.x, _acceleration.y);

		//_.velocity.x += acceleration.x * 0.5 * halfstep;
		//_.velocity.y += acceleration.y * 0.5 * halfstep;
	}
}