/**
 * Handy formulas
 */
var Calculate = {
	radius: function(mass) {
		return 1 + Math.log(Math.max(1, mass)) / 5;
	},
	distance: function(vec2a, vec2b) {
		var dx = vec2a.x - vec2b.x;
		var dy = vec2a.y - vec2b.y;
		return Math.sqrt(dx*dx + dy*dy);
	},
	orbitalVelocity: function(mass, radius) {
		return Math.sqrt(mass / radius);
	}
};

/**
 * 2D vector object
 */
function Vec2(x, y) {
	var _ = this;
	this.x = x;
	this.y = y;

	this.set = function(x, y) {
		_.x = x;
		_.y = y;

		return _;
	}

	this.translate = function(x, y) {
		_.x += x;
		_.y += y;

		return _;
	}

	this.normalize = function(maximum) {
		var normalizer = maximum / _.magnitude();

		_.x *= normalizer;
		_.y *= normalizer;

		return _;
	}

	this.averageWith = function(vec2) {
		return new Vec2((_.x + vec2.x) / 2, (_.y + vec2.y) / 2);
	}

	this.magnitude = function() {
		return Math.sqrt(_.x*_.x + _.y*_.y);
	}

	return _;
}

/**
 * Celestial body object
 */
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

	this.mergeWith = function(body) {
		var largerBody = (_.mass > body.mass ? _ : body);

		var mass = _.mass + body.mass;
		var radius = Calculate.radius(mass * 0.9);
		var position = new Vec2(largerBody.position.x, largerBody.position.y);
		var momentum = new Vec2((_.velocity.x * _.mass + body.velocity.x * body.mass), (_.velocity.y * _.mass + body.velocity.y * body.mass));

		if (mass > 0) {
			var velocity = new Vec2(momentum.x / mass, momentum.y / mass);
		} else {
			var velocity = _.velocity.averageWith(body.velocity);
		}

		return new Body(radius, mass * 0.9, largerBody.rigid).setPosition(position).setVelocity(velocity);
	}

	this.distanceFrom = function(body) {
		return Calculate.distance(_.position, body.position);
	}

	this.forceAt = function(position, scale) {
		if (_.mass === 0) {
			return {
				x: 0,
				y: 0
			};
		}

		var dx = position.x - _.position.x;
		var dy = position.y - _.position.y;
		var r = Math.sqrt(dx*dx + dy*dy) * (scale || 1);
		var force = _.mass / (r*r);

		return {
			x: (dx / r) * force,
			y: (dy / r) * force
		};
	}

	this.accelerate = function(_acceleration) {
		acceleration.set(_acceleration.x, _acceleration.y);
	}

	this.update = function(dt, reverse) {
		if (!_.rigid) {
			var direction = (reverse ? -1 : 1);

			_.velocity.x += acceleration.x * dt * direction;
			_.velocity.y += acceleration.y * dt * direction;

			_.position.x += _.velocity.x * dt * direction;
			_.position.y += _.velocity.y * dt * direction;
		}
	}
}