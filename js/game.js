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
    // hint that we shouldn't change them by making them all caps. And these
    // are all pretty self explanatory as to what they are.
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

        // Here we're saying that we're going make the shape a black circle
        // with a radius of PLAYER_RADIUS at position 0. Objects in createjs
        // all have their own local coordinate system that's separate from the
        // global coordinate system. Drawings should usually center around the 
        // origin in the local coordinate system to make it easier to find 
        // relative positions later.
        player.graphics.beginFill("black").drawCircle(0, 0, PLAYER_RADIUS);

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
        // visually!g
        stage.update();
    }

    // =======================================================================
    // GAME FUNCTIONS
    // =======================================================================

    /**
     * This function will create a new bullet, position it appropriately,
     * and get it moving towards the mouse cursor.
     */
    function shoot(x, y) {
        // So, the general strategy here is that we first have to find the angle
        // created between the mouse and the player. Once we know this angle,
        // we can use the desired speed we want the bullet to travel to break down
        // the bullet's movement into its respective x and y components. This is all
        // just basic trigonometry. 

        // To find the angle, we want to find each leg of the triangle (the x and 
        // y differences) and then find the arctan of their ratio. If you draw the
        // triangle out on paper, this will make a lot more sense.
        // Note: Make sure your subtraction order is <target> - <source>. Otherwise,
        // you'll get the opposite angle you want!
        var dx = x - player.x;
        var dy = y - player.y;
        var theta = Math.atan2(dy, dx);

        // Now that we have our angle, we want to find what the legs of the triangle
        // would be if we had a hypotenuse whose length is the speed of the bullet.
        // This is how much we want the bullet to move in the x and y direction 
        // each frame.
        var vx = Math.cos(theta) * BULLET_SPEED;
        var vy = Math.sin(theta) * BULLET_SPEED;

        // Now we just make a bullet and position it (not forgetting to add it
        // to the stage).
        var b = new Bullet(vx, vy);
        b.sprite.x = player.x + Math.cos(theta) * PLAYER_RADIUS;
        b.sprite.y = player.y + Math.sin(theta) * PLAYER_RADIUS;
        stage.addChild(b.sprite);

        // Finally, we store it in an array so we can reference it later.
        bullets.push(b);
    }



    /**
     * This function will put an enemy at a random location off-screen and start
     * him moving towards the player.
     */
    function spawnEnemy() {
        // We're going to use the same techniques we used with shooting with the enemy. 
        // However, instead of calculating theta, we're going to generate a random one to
        // set the starting position of the enemy.
        var theta = Math.random() * Math.PI * 2;

        // We want it to be outside of the stage, so we add the horizontal and vertical
        // 'radius' of the stage to be sure we'll be outside of it at any angle.
        var radius = STAGE_WIDTH/2 + STAGE_HEIGHT/2;

        // Then we just do what we did before to calculate the enemy's position
        var enemyX = player.x + Math.cos(theta) * radius;
        var enemyY = player.y + Math.sin(theta) * radius;

        // We grab our angle used for the enemy's velocity. Remember, it's
        // <target> - <source>. Then we grab velocity just like we did for the bullet.
        var moveTheta = Math.atan2(player.y - enemyY, player.x - enemyX);
        var vx = Math.cos(moveTheta) * ENEMY_SPEED;
        var vy = Math.sin(moveTheta) * ENEMY_SPEED;

        // Now we can create and position our enemy, making sure to add it to the stage.
        var e = new Enemy(vx, vy);
        e.sprite.x = enemyX;
        e.sprite.y = enemyY;
        stage.addChild(e.sprite);

        // And just like the bullets, we keep track of the enemies using an array.
        enemies.push(e);
    }

    /**
     * We need to check to see if any bullets are colliding with any enemies. If they are,
     * we should delete both the bullet and enemy, and then remove them from their respective
     * arrays.
     */
    function checkBulletEnemyCollision() {
        // We're taking the simplest approach here by checking if each bullet is colliding
        // with any of the enemies. There are better techniques to do this, but this is fine
        // four our purposes. Notice that the loops go in reverse. This is because we are
        // removing elements from the array as we go along. As an exercise, you can see what
        // problems would arise if you looped forward.
        for (var i = bullets.length - 1; i >= 0; i--) {
            var b = bullets[i];
            for (var j = enemies.length - 1; j >= 0; j--) {
                var e = enemies[j];

                // If they're colliding, remove them. Pretty simple stuff here. The
                // neat part is in the circleCollision function.
                if (circleCollision(b.sprite, BULLET_RADIUS, e.sprite, ENEMY_RADIUS)) {
                    stage.removeChild(e.sprite);
                    enemies.splice(j, 1);

                    stage.removeChild(b.sprite);
                    bullets.splice(i, 1);
                }              
            }
        }
    }

    /** 
     * We need to check if the enemies are touching the hero. If you were going for efficiency,
     * you could run this in tandem with the bullet collision detection, but breaking it apart
     * is more readable and won't be much more performance intensive (as our enemy list never
     * gets particularly long).
     */
    function checkEnemyHeroCollision() {
        // This is even simpler than the checkBulletEnemyCollision because there's only one
        // player. Just one loop here.
        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i];
            if (circleCollision(player, PLAYER_RADIUS, e.sprite, ENEMY_RADIUS)) {
                // We set this flag to true so we don't get infinite alerts.
                gameOver = true;
                alert("Game Over!");
            }
        }
    }

    /**
     * The reason we're using all circles in this game is because collision detection is
     * very simple. To tell if two circles are touching, all you need to know is the 
     * distance between them. If the distance is less than or equal to the sum of the
     * two circles' radii, then you know they must be colliding.
     */
    function circleCollision(sprite1, r1, sprite2, r2) {
        // You never thought you'd use the distance formula, did you? If you forget what it is, it's:
        //      d = sqrt( (x2 - x1)^2 + (y2 - y1)^2 )
        // Knowing that, it's pretty easy to implement here.
        var dx = sprite1.x - sprite2.x;
        var dy = sprite1.y - sprite2.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= r1 + r2;
    }

    // =======================================================================
    // CLASSES
    // =======================================================================
    /**
     * We're going to create some basic classes here to keep track of our objects. There are multiple
     * techniques to make classes in javascript (as there is no set 'class' notation), but this one is
     * pretty popular and easy to read. The function name is the class name, and the signature itself is
     * the constructor. Any variables attached to 'this' become the public fields of the class. 
     *
     * Now, if we wanted to be real cool kids, we could subclass the existing Shape class in createjs.
     * In fact, they have a guide to do it here: http://createjs.com/tutorials/Inheritance/
     * However, if you read that guide, you can hopefully appreciate why we're going to keep it simple here.
     * The method involves using prototypes, which could take a while to explain. Heck, you can see that the
     * two classes we've written here are pretty darn similar and would benefit from inheritance, but once 
     * again, we're just going to keep things simple.
     *
     * Instead, we'll just create a Shape object that each class holds. The benefit to making a class is that
     * we can give each object it's own tick method, so it can move itself if we give it a velocity. The tricky
     * part to remember is that when we add the Bullet or Enemy to the stage, we need to add it's sprite, not
     * the object itself.
     *
     * As an exercise, I recommend following that createjs inheritance guide and refactoring this. It'll
     * come out a lot cleaner!
     */
    
    function Bullet(vx, vy) {
        this.vx = vx;
        this.vy = vy;

        this.sprite = new createjs.Shape();
        this.sprite.graphics.beginFill("blue").drawCircle(0, 0, BULLET_RADIUS);

        /**
         * Every tick, we'll just add our x and y velocities to our current position.
         */
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

        /**
         * Every tick, we'll just add our x and y velocities to our current position.
         */
        this.tick = function(e) {
            this.sprite.x += vx;
            this.sprite.y += vy;
        }
    }
})(game);

/**
 * This is the function that will be called when the page is done loading. We're just going to 
 * call the init function on our game module to kick everything off. Remember that by passing
 * 'game' into that anonymous function just above this, we have attached methods to it. One of
 * those was 'init'.
 */
window.onload = function() {
    game.init();
}