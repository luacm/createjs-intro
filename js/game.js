var game = this.game || {};

(function(module) {
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

    module.init = function() {
        canvas = document.getElementById("js-canvas");
        stage = new createjs.Stage(canvas);
        STAGE_WIDTH = canvas.width;
        STAGE_HEIGHT = canvas.height;

        initPlayer();
        initEvents();
    }

    function initPlayer() {
        player = new createjs.Shape();
        player.graphics.beginFill("white").drawCircle(0, 0, PLAYER_RADIUS);
        player.x = STAGE_WIDTH / 2;
        player.y = STAGE_HEIGHT / 2;
        stage.addChild(player);
    }

    function initEvents() {
        window.onkeydown = keyDown;
        window.onkeyup = keyUp;
        stage.addEventListener("stagemousedown", mouseDown);
        canvas.onmouseup = mouseUp;
        createjs.Ticker.setFPS(FRAME_RATE);
        createjs.Ticker.useRAF = true;
        createjs.Ticker.addEventListener("tick", tick);

        setInterval(spawnEnemy, 2000);
    }

    function keyDown(e) {

    }

    function keyUp(e) {

    }

    function mouseDown(e) {
        shoot(stage.mouseX, stage.mouseY);
    }

    function mouseUp(e) {
        
    }

    function tick(e) {
        if (gameOver) {
            stage.update();
            return;
        }

        // Move all of the bullets
        for (var i = 0; i < bullets.length; i++) {
            bullets[i].tick(e);
        }

        // Move all of the enemies
        for (var i = 0; i < enemies.length; i++) {
            enemies[i].tick(e);
        }

        checkBulletEnemyCollision();
        checkEnemyHeroCollision();

        stage.update();
    }

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