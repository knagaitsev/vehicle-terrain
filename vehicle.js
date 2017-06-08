/**
 * Creates a Phaser P2 vehicle which can have wheels
 * @param  {Phaser.Sprite} frameSprite The sprite of the truck's main frame
 */
Vehicle = function(frameSprite) {
    this.frame = frameSprite;
    this.game = this.frame.game;
    this.wheels = this.game.add.group();
    this.debug = false;

    this.game.physics.p2.enable(this.frame, this.debug);

    this.cursors = this.game.input.keyboard.createCursorKeys();

    this.maxWheelForce = 1000;
    this.rotationSpeed = 400;
}

Vehicle.prototype = {
    /**
     * Constrains a wheel to the frame at a given offset position
     * @param  {String} wheelSpriteKey    Preloaded sprite key of the wheel
     * @param  {Array} offsetFromVehicle Relative position on vehicle frame to
     *                                   constrain the wheel in the form [x,y]
     * @return {Phaser.Sprite}           The created wheel
     */
    addWheel: function(wheelSpriteKey, offsetFromVehicle) {
        var vehicleX = this.frame.position.x;
    	var vehicleY = this.frame.position.y;
    	var wheel = this.game.add.sprite(vehicleX + offsetFromVehicle[0],
    						vehicleY + offsetFromVehicle[1], wheelSpriteKey);

    	this.game.physics.p2.enable(wheel, this.debug);

        wheel.body.clearShapes();
    	wheel.body.addCircle(wheel.width * 0.5);

        //constrain the wheels to the vehicle frame so that they can rotate
        //about a fixed point
    	var rev = this.game.physics.p2.createRevoluteConstraint(
            this.frame.body, offsetFromVehicle,
            wheel.body, [0,0], this.maxWheelForce
        );

    	this.wheels.add(wheel);

        return wheel;
    },
    /**
     * Update method for the vehicle's wheels to be controlled
     */
    update: function() {
        var rotationSpeed = this.rotationSpeed;
    	if (this.cursors.left.isDown) {
    		this.wheels.children.forEach(function(wheel,index) {
    			wheel.body.rotateLeft(rotationSpeed);
    		});
    	}
    	else if (this.cursors.right.isDown) {
    		this.wheels.children.forEach(function(wheel,index) {
    			wheel.body.rotateRight(rotationSpeed);
    		});
    	}
    	else {
    		this.wheels.children.forEach(function(wheel,index) {
    			wheel.body.setZeroRotation();
    		});
    	}
    }
};
