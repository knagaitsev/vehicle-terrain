/**
 * Helps quickly generate and draw terrain at the bottom of the world
 * within given bounds
 * The drawTerrain method requires curve.js, which can be found here:
 * https://github.com/pkorac/cardinal-spline-js/blob/master/src/curve.js
 *
 * @param  {Phaser.Game} game The game instance
 * @param  {Integer} x1   First x-value bound
 * @param  {Integer} x2   Second x-value bound
 * @param  {Integer} y1   First y-value bound
 * @param  {Integer} y2   Second y-value bound
 */
TerrainController = function(game, x1, x2, y1, y2) {
    this.game = game;
    if (x1 < x2) {
        this.leftBound = x1;
        this.rightBound = x2;
    }
    else {
        this.leftBound = x2;
        this.rightBound = x1;
    }

    if (y1 < y2) {
        this.topBound = y1;
        this.bottomBound = y2;
    }
    else {
        this.topBound = y2;
        this.bottomBound = y1;
    }
    //set this to true to see the polygons of the terrain physics body
    this.debug = false;
    this.cliffs = true;
    this.fissures = true;

    //create the container, add it to the vertices, then create the terrain
    //and also add it to the end of the vertices
    this.vertices = [];
    var container = this.createContainer();
    this.vertices = this.vertices.concat(container);

    var terrain = this.generateTerrain(this.leftBound, this.rightBound,
        this.topBound, this.bottomBound);
    terrain = this.flipTerrain(terrain, this.topBound, this.bottomBound);
    this.vertices = this.vertices.concat(terrain);

}

TerrainController.prototype = {
    /**
     * Adds terrain physics body to world with generated vertices
     * @return {P2.Body} The P2 physics body created
     */
    addToWorld: function() {
        var groundBody = new Phaser.Physics.P2.Body(this.game,null,0,0);
        var points = this.vertices.slice(0);
        //Convert vertices from pixels to meters for P2
        //in the proper orientation
        for (var i = 0 ; i < points.length ; i++) {
    		points[i][0] = this.game.physics.p2.pxmi(points[i][0]);
    		points[i][1] = this.game.physics.p2.pxmi(points[i][1]);
    	};
        //Add a group of convex polygons to the ground body from
        //our array which forms a concave polygon
    	groundBody.data.fromPolygon(points);
    	groundBody.debug = this.debug;
    	groundBody.kinematic = true;
    	this.game.physics.p2.addBody(groundBody);

        return groundBody;
    },
    /**
     * Draw the outline of the terrain using bitmap data
     * This method uses curve.js which can be found at:
     * https://github.com/pkorac/cardinal-spline-js/blob/master/src/curve.js
     */
    drawOutline: function() {
        var points = this.vertices.flatten();
    	var bmd = this.game.add.bitmapData(this.game.world.width,
            this.game.world.height);
    	var ctx = bmd.context;
    	ctx.fillStyle = 'black';
    	ctx.lineWidth = 5;
    	ctx.beginPath();
    	ctx.moveTo(points[0],points[1]);
        //Create a spline curve through the vertices
    	ctx.curve(points, null, null, true);
    	ctx.stroke();

    	bmd.addToWorld();
    },
    /**
     * Create vertices for a container at the bottom of the world
     * @return {Array} Vertices of the container
     */
    createContainer: function() {
        var w = this.game.world.width;
        var startHeight = this.bottomBound;
    	var maxHeight = this.topBound;
    	var sideWidth = 50;
    	var lowerJut = 10;
    	var upperJut = 20;
        //create a bounding container so we can simply insert our terrain
    	var coreContainer = [
    		[lowerJut,startHeight],
    		[upperJut,maxHeight],
    		[-sideWidth,maxHeight],
    		[-sideWidth,startHeight+sideWidth],
    		[w+sideWidth,startHeight+sideWidth],
    		[w+sideWidth,maxHeight],
    		[w-upperJut,maxHeight],
    		[w-lowerJut,startHeight]
    	];
        //reverse the container such that the very last vertices before the
        //terrain are those on the far left of the world
    	coreContainer.reverse();
        return coreContainer;
    },
    /**
     * Generate terrain vertices within bounds
     * @param  {Integer} xMin Minimum x value
     * @param  {Integer} xMax Maximum x value
     * @param  {Integer} yMin Minimum y value
     * @param  {Integer} yMax Maximum y value
     * @return {Array}      Vertices of generated terrain
     */
    generateTerrain: function(xMin, xMax, yMin, yMax) {
        var points = [];
        //we move to the right with this step size as we generate y-values
        stepSize = 32;

        var dif = Math.abs(yMax-yMin);
        //The trend is the sign of the terrain's current slope
        //If the trend is 1, the terrain is increasing in height
        //If it is -1, the terrain is decreasing in height
        var trend = 1;
        var height = yMin;
        var fissureCount = 0;
    	for (var i = xMin ; i <= xMax - stepSize ; i += stepSize) {
            var lowChange = 0;
            var highChange = 0.08;
            //choose a random amount to change the height
            var randChange = this.randomInt(Math.round(dif*lowChange),
                Math.round(dif*highChange));
            var inc = trend*randChange;
            //there is a chance that it will randomly switch directions
            var switchDirec = this.randomInt(0,3);

            fissureCount++;
            //switch directions if max height is reached or
            //create a cliff/fissure
            if (height + inc > yMax ||
            (switchDirec == 0 && height+inc > yMin+dif*0.5)) {
                var rand = this.randomInt(0,8);
                if (rand == 0 && fissureCount > 5 && this.cliffs) {
                    //generate cliff
                    trend = 1;
                    points.push([i-10,height-dif*0.4]);
                    points.push([i,yMin+dif*0.02]);
                    i += stepSize;
                    points.push([i,yMin+dif*0.01]);
                    i += stepSize;
                    points.push([i,yMin]);
                    height = yMin;
                }
                else if (rand == 1 && fissureCount > 5 && this.fissures) {
                    //generate fissure
                    fissureCount = 0;
                    trend = -1;
                    points.push([i-10,height-dif*0.4]);
                    for (var j = 0 ; j < 5 ; j++) {
                        var randVariance = this.randomInt(
                            Math.round(dif*lowChange),Math.round(dif*highChange)
                        );
                        points.push([i,yMin+randVariance]);
                        i+= stepSize;
                    }
                    points.push([i,yMin]);
                    points.push([i+10,height-dif*0.4]);
                    points.push([i,height-dif*highChange]);
                    height = height-dif*highChange;
                }
                else {
                    //normal
                    trend = -1;
                    inc = trend*randChange;
                    height += inc;
                    points.push([i,height]);
                }
            }
            //switch directions if min height is reached
            else if (height + inc < yMin ||
            (switchDirec == 0 && height+inc < yMax-dif*0.5)) {
                trend = 1;
                inc = trend*randChange;
                height += inc;
                points.push([i,height]);
            }
            //continue with the current trend
            else {
                height += inc;
                points.push([i,height]);
            }
    	}

        return points;
    },
    /**
     * Flip y-values of terrain while maintaining the same range
     * @param  {Array} points Points in the form [[x1,y1],[x2,y2],...]
     * @param  {Integer} yMin   Smaller bounding y-value of the vertices
     * @param  {Integer} yMax   Larger bounding y-value of the vertices
     * @return {Array}        Flipped terrain vertices
     */
    flipTerrain: function(points, yMin, yMax) {
        points.forEach(function(point,index) {
            points[index][1] = yMax - (point[1] - yMin);
        });
        return points;
    },
    /**
     * Generate a random integer, inclusive with both bounds
     * @param  {Integer} min minimum value
     * @param  {Integer} max maximum value
     * @return {Integer}     Random integer within bounds
     */
    randomInt: function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

Array.prototype.flatten = function() {
    var clone = this.slice(0);
	return clone.reduce(function(a, b) {
	    return a.concat(b);
	}, []);
}
