/*
* Example by Loonride - https://loonride.com/learn/phaser/terrain-for-vehicles
*/

var width = 800;
var height = 500;
var game = new Phaser.Game(width, height, Phaser.AUTO, null,
	{preload: preload, create: create, update: update});

var truck;
var wheelMaterial;
var worldMaterial;
var allowTruckBounce = true;

function preload() {
	game.stage.backgroundColor = '#eee';
	game.load.image('truck', 'asset/truck.png');
	game.load.image('wheel', 'asset/wheel.png');
	game.load.physics("physics", "asset/physics.json");
}
function create() {
	//set world boundaries with a large world width
	game.world.setBounds(0,-height,width*10,height*2);
	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.gravity.y = 600;

	wheelMaterial = game.physics.p2.createMaterial("wheelMaterial");
	worldMaterial = game.physics.p2.createMaterial("worldMaterial");
	game.physics.p2.setWorldMaterial(worldMaterial, true, true, true, true);

	//create contact material to increase friction between
	//the wheels and the ground
	var contactMaterial = game.physics.p2.createContactMaterial(
		wheelMaterial, worldMaterial
	);
	contactMaterial.friction = 1e3;
	contactMaterial.restitution = .3;

	//call onSpaceKeyDown when space key is first pressed
	var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	spaceKey.onDown.add(onSpaceKeyDown, game);

	initTruck();
	initTerrain();
}
function update() {
	truck.update();
}
function initTruck() {
	//initialize the truck and add the proper physics body
	var truckFrame = game.add.sprite(width*0.25, height*0.4, "truck");
	truck = new Vehicle(truckFrame);
	truck.frame.body.clearShapes();
	truck.frame.body.loadPolygon("physics", "truck");
	game.camera.follow(truck.frame);

	var distBelowTruck = 24;
	initWheel([55, distBelowTruck]);
	initWheel([-52, distBelowTruck]);
}
function initTerrain() {
	//initialize the terrain with bounds
	var terrain = new TerrainController(game, 50, game.world.width - 50,
		100, height - 50);
	//draw the terrain
	terrain.drawOutline();
	//add the physics body
	var groundBody = terrain.addToWorld();
	groundBody.setMaterial(worldMaterial);
	groundBody.name = "terrain";
}
function initWheel(offsetFromTruck) {
	var wheel = truck.addWheel("wheel", offsetFromTruck);
	wheel.body.setMaterial(wheelMaterial);
	wheel.body.onBeginContact.add(onWheelContact, game);
	return wheel;
}
function onSpaceKeyDown() {
	if (allowTruckBounce) {
		//make the truck bounce
		truck.frame.body.moveUp(850);
		allowTruckBounce = false;
	}
}
function onWheelContact(phaserBody, p2Body) {
	//allow another bounce if the wheels touched the ground
	if ((phaserBody === null && p2Body.id == 4)
		|| (phaserBody && phaserBody.name == "terrain")) {
		allowTruckBounce = true;
	}
}
