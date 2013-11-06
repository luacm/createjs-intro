// Here we're defining our game module. If our project was bigger and
// consisted of multiple files, then we could keep adding our code into
// this module, and the module may or may not exist by the time this file
// is read. That's why this line looks the way it does. We're saying that
// 'game' is equal to the pre-existing game module if it exists, and
// if it doesn't exist, then it's equal to a new empty object. The 
// javascript || operator is useful here to bundle this into one line. 
// It works because 'null' and 'undefined' and falsey values in javascript.
 
var game = this.game || {};

/**
 * We're wrapping our code in what's called an IFFE ("iffy"). It stands for
 * Immediately Invoked Function Expression. You'll notice that it's a
 * function wrapped in a pair of parentheses, and followed by '()'. That means
 * that this anonymous function will be called immediately after it is defined.
 * We pass our 'game' module in as an argument as a way to make methods public
 * on that module. An example is the 'init' function.
 */
(function(module) {
    // There are no constants in javascript but we can give ourselves a visual
    // hint that we shouldn't change them by making them all caps.
    var FRAME_RATE = 60;
    var STAGE_WIDTH;
    var STAGE_HEIGHT;
    var BULLET_SPEED = 7;
    var BULLET_RADIUS = 5;
    var PLAYER_RADIUS = 30;
    var ENEMY_RADIUS = 15;
    var ENEMY_SPEED = 1;

    var canvas;
    var stage;
    var player;
    var enemies = [];
    var bullets = [];

    var gameOver = false;

    // =======================================================================
    // INITIALIZATION
    // =======================================================================

    /**
     * This is what will be called to kick off our game.
     */
    module.init = function() {
        // This grabs our canvas element from our page.
        canvas = document.getElementById("js-canvas");

        // Here we create a new stage - it's what holds everything
        // visual in our game.
        stage = new createjs.Stage(canvas);

        // It'll be useful to know the dimensions of our stage late
        STAGE_WIDTH = canvas.width;
        STAGE_HEIGHT = canvas.height;

        // Here we call some subroutines to finish up initialization.
        // We could have written the code here, but it reads nicer this way.
        initPlayer();
        initEvents();
    }

    /**
     * We initialize the player here. He's just going to be a circle in the
     * middle of the stage.
     */
    function initPlayer() {
        // Shapes are vector images in createjs. That means that they scale 
        // without degredation.
        player = new createjs.Shape();

        // Here we're saying that we're going make the shape a white circle
        // with a radius of PLAYER_RADIUS at position 0. Objects in createjs
        // all have their own local coordinate system that's separate from the
        // global coordinate system. Drawings should usually center around the 
        // origin in the local coordinate system to make it easier to find 
        // relative positions later.
        player.graphics.beginFill("white").drawCircle(0, 0, PLAYER_RADIUS);

        // We're putting our player in the center of the stage. These coordiantes
        // are referencing the global coordinate system. You'll notice our y-value 
        // is positive here. That's because the origin in almost all game engines
        // is in the top-left corner, with y increasing as you go down. The reason
        // for this is that montiors draw out the lines that make up the screen from
        // top to bottom, left to right. It's confusing at first, but it becomes 
        // second nature as you do more game development. 
        player.x = STAGE_WIDTH / 2;
        player.y = STAGE_HEIGHT / 2;

        // Here's another important game concept - adding children. Currently, our player
        // isn't in the 'display list' - a list of objects that the stage will render
        // to the canvas. Only children of the stage (and their children) will be drawn.
        // Here, we're adding our player to the stage to be drawn.
        stage.addChild(player);
    }

    function initEvents() {
        // Here we're just listening for when the mouse button clicks down on the stage.
        // When it does, we'll call the mouseDown function we've defined.
        stage.addEventListener("stagemousedown", mouseDown);

        // FPS stands for "Frames Per Second" - it's how often the game screen refreshes.
        // Here, we're telling it to use a constant we've already defined. 
        createjs.Ticker.setFPS(FRAME_RATE);

        // RAF is a special browser property that makes games more efficient in modern 
        // browsers. Don't worry about it, just know that it's good to turn on.
        createjs.Ticker.useRAF = true;

        // This is adding the event for every time a new frame is rendered. We want to 
        // do all of our updating in this 'tock' function, as this is what will be called
        // 60 times per second (or whatever your framerate is).
        createjs.Ticker.addEventListener("tick", tick);

        // Finally, we're just setting a timer to spawn an enemy ever two seconds.
        setInterval(spawnEnemy, 2000);
    }

    // =======================================================================
    // EVENTS
    // =======================================================================

    /**
     * This function is called every time the mouse clicks down on the stage.
     */
    function mouseDown(e) {
        // We're just going to shoot towards the current mouse position. Always use 
        // mouseX and mouseY to get your mouse position, as createjs has already made
        // them relative to the top left corner of the canvas instead of absolutely
        // positioned in the window.
        shoot(stage.mouseX, stage.mouseY);
    }

    /**
     * This is our update function. It will be called every 1/60 of a second (or whatever
     * you chose your frameerate to be). It's where we decide what happenns for this next
     * frame.
     */
    function tick(e) {
        // If the game is over, do nothing.
        if (gameOver) {
            return;
        }

        // Run through our list of bullets and call each of their tick
        // functions so they can update themselves.
        for (var i = 0; i < bullets.length; i++) {
            bullets[i].tick(e);
        }

        // Run through our list of enemies and call each of their tick
        // functions so they can update themselves.
        for (var i = 0; i < enemies.length; i++) {
            enemies[i].tick(e);
        }

        // Check for collisions between all of our things.
        checkBulletEnemyCollision();
        checkEnemyHeroCollision();

        // This call is super-important. It tells the stage to update the
        // canvas to reflect the game state. Without it, nothing would happen
        // visually!
        stage.update();
    }

    // =======================================================================
    // GAME FUNCTIONS
    // =======================================================================

    function spawnEnemy() {
        var rad = Math.random() * Math.PI * 2;
        var radius = STAGE_WIDTH/2 + STAGE_HEIGHT/2;
        var x = player.x + Math.cos(rad) * radius;
        var y = player.y + Math.sin(rad) * radius;
        var moveRad = Math.atan2(y - player.y, x - player.x);
        var vx = -Math.cos(moveRad) * ENEMY_SPEED;
        var vy = -Math.sin(moveRad) * ENEMY_SPEED;
        var e = new Enemy(vx, vy);
        e.sprite.x = x;
        e.sprite.y = y;
        enemies.push(e);
        stage.addChild(e.sprite);
    }

    function shoot(x, y) {
        var dx = x - player.x;
        var dy = y - player.y;
        var rad = Math.atan2(dy, dx);

        var vx = Math.cos(rad) * BULLET_SPEED;
        var vy = Math.sin(rad) * BULLET_SPEED;

        var b = new Bullet(vx, vy);
        b.sprite.x = player.x + Math.cos(rad) * PLAYER_RADIUS;
        b.sprite.y = player.y + Math.sin(rad) * PLAYER_RADIUS;
        stage.addChild(b.sprite);
        bullets.push(b);
    }

    function checkBulletEnemyCollision() {
        for (var i = bullets.length - 1; i >= 0; i--) {
            var b = bullets[i];
            for (var j = enemies.length - 1; j >= 0; j--) {
                var e = enemies[j];
                if (circleCollision(b.sprite, BULLET_RADIUS, e.sprite, ENEMY_RADIUS)) {
                    stage.removeChild(e.sprite);
                    enemies.splice(j, 1);

                    stage.removeChild(b.sprite);
                    bullets.splice(i, 1);
                }              
            }
        }
    }

    function checkEnemyHeroCollision() {
        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i];
            if (circleCollision(player, PLAYER_RADIUS, e.sprite, ENEMY_RADIUS)) {
                gameOver = true;
                alert("Game Over!");
            }
        }
    }


    function circleCollision(sprite1, r1, sprite2, r2) {
        var dx = sprite1.x - sprite2.x;
        var dy = sprite1.y - sprite2.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= r1 + r2;
    }

    // =======================================================================
    // CLASSES
    // =======================================================================

    function Bullet(vx, vy) {
        this.vx = vx;
        this.vy = vy;

        this.sprite = new createjs.Shape();
        this.sprite.graphics.beginFill("blue").drawCircle(0, 0, BULLET_RADIUS);

        this.tick = function(e) {
            this.sprite.x += vx;
            this.sprite.y += vy;
        }
    }

    function Enemy(vx, vy) {
        this.vx = vx;
        this.vy = vy;

        this.sprite = new createjs.Shape();
        this.sprite.graphics.beginFill("red").drawCircle(0, 0, ENEMY_RADIUS);

        this.tick = function(e) {
            this.sprite.x += vx;
            this.sprite.y += vy;
            
        }
    }



})(game);

window.onload = function() {
    game.init();
}