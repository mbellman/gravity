function Vec2(x, y) {
	this.x = x;
	this.y = y;
}

function Body(radius, mass) {
	// Private:
	var _ = this;

	// Public:
	this.position = new Vec2(0, 0);
	this.velocity = new Vec2(0, 0);
	this.radius = radius;
	this.mass = mass;

	this.setPosition = function(position) {
		this.position.x = position.x;
		this.position.y = position.y;
		return _;
	}

	this.setVelocity = function(velocity) {
		this.velocity.x = velocity.x;
		this.velocity.y = velocity.y;
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
		}
	}

	this.accelerate = function(acceleration) {
		_.velocity.x += acceleration.x;
		_.velocity.y += acceleration.y;
	}

	this.update = function(steps, dt) {
		var delta = steps * dt;
		_.position.x += (_.velocity.x * delta);
		_.position.y += (_.velocity.y * delta);
	}

	return _;
}