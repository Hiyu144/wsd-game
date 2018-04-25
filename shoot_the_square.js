//Set key code
var LEFT_KEY = 37;
var UP_KEY = 38;
var RIGHT_KEY = 39;
var DOWN_KEY = 40;
var SPACE_KEY = 32;

//Set how much player would move
var PLAYER_MOVEMENT = 7;

var lastLoopRun = 0;
var score = 0;
var iterations = 0;

var controller = new Object();
var enemies = new Array();

//Spawn an element on screen
function createSprite(element, x, y, w, h) {
    var result = new Object();
    result.element = element;
    result.x = x;
    result.y = y;
    result.w = w;
    result.h = h;
    return result;
}

//Detect button pressed
function toggleKey(keyCode, isPressed) {
    if (keyCode == LEFT_KEY) {
        controller.left = isPressed;
    }
    if (keyCode == RIGHT_KEY) {
        controller.right = isPressed;
    }
    if (keyCode == UP_KEY) {
        controller.up = isPressed;
    }
    if (keyCode == DOWN_KEY) {
        controller.down = isPressed;
    }
    if (keyCode == SPACE_KEY) {
        controller.space = isPressed;
    }  
}

//Check if two elements intersect
function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

//Restrict movement within the frame
function ensureBounds(sprite, ignoreY) {
    if (sprite.x < 20) {
        sprite.x = 20;
    }
    if (!ignoreY && sprite.y < 20) {
        sprite.y = 20;
    }
    if (sprite.x + sprite.w > 480) {
        sprite.x = 480 - sprite.w;
    }
    if (!ignoreY && sprite.y + sprite.h > 480) {
        sprite.y = 480 - sprite.h;
    }
}

//Set spawn position
function setPosition(sprite) {
    var e = document.getElementById(sprite.element);
    e.style.left = sprite.x + 'px';
    e.style.top = sprite.y + 'px';
}

//Handle input response
function handleControls() {
    if (controller.up) {
        player.y -= PLAYER_MOVEMENT;
    }
    if (controller.down) {
        player.y += PLAYER_MOVEMENT;
    }
    if (controller.left) {
        player.x -= PLAYER_MOVEMENT;
    }
    if (controller.right) {
        player.x += PLAYER_MOVEMENT;
    }
    if (controller.space) {
        var laser = getFireableLaser();
        if (laser) {
			laser.x = player.x + 9;
			laser.y = player.y - laser.h;
		}
    }
    ensureBounds(player);
}

//Spawn player and init laser pool
var player = createSprite('player', 250, 460, 20, 20);
var lasers = new Array();
for (var i = 0; i < 3; i++) {
    lasers[i] = createSprite('laser' + i, 0, -120, 2, 10);
}

//Laser pool = 3
//Restock pool 
function getFireableLaser() {
    var result = null;
    for (var i = 0; i < lasers.length; i++) {
        if (lasers[i].y <= -120) {
            result = lasers[i];
        }
    }
    return result;
}

//Check for intersection between laser and enemy
//Restock laser pool if hit
function getIntersectingLaser(enemy) {
    var result = null;
    for (var i = 0; i < lasers.length; i++) {
        if (intersects(lasers[i], enemy)) {
            result = lasers[i];
            break;
        }
    }
    return result;
}

//Check for collision between elements (laser-enemy, player-enemy)
function checkCollisions() {
    for (var i = 0; i < enemies.length; i++) {
        var laser = getIntersectingLaser(enemies[i]);
        if (laser) {
	        var playerElem = document.getElementById(player.element);
	        if (playerElem.style.visibility != 'hidden'){
		        var element = document.getElementById(enemies[i].element);
				var enemyWidth = parseFloat(window.getComputedStyle(element).width);
                element.style.visibility = 'hidden';
                element.parentNode.removeChild(element);
                enemies.splice(i, 1);
                i--;
                laser.y = -laser.h;
				//Determine score increase by enemy width
				if (enemyWidth <= 20) {
					score += 200;
				}else{
					score += 100;
				}
	        }
        }
        else if (intersects(player, enemies[i])) {
            gameOver();
        }
        //De-spawn enemy when out-of-bound
        else if (enemies[i].y + enemies[i].h >= 500) {
            var element = document.getElementById(enemies[i].element);
            element.style.visibility = 'hidden';
            element.parentNode.removeChild(element);
            enemies.splice(i, 1);
            i--;
        }
    }
}

//Game over check
function gameOver() {
    var element = document.getElementById(player.element);
    element.style.visibility = 'hidden';
    element = document.getElementById('gameover');
    element.style.visibility = 'visible';

    var elementScore = document.getElementById('highscore');
    elementScore.style.visibility = 'visible';
    elementScore.onclick = function() { sendScore() };

    var elementReset = document.getElementById('reset');
    elementReset.style.visibility = 'visible';
    elementReset.onclick = function() { resetGame() };
}

//Save the score
var savedScore = 0;
function save(){
	savedScore = score;
    var msg = {
        "messageType": "SAVE",
        "gameState": {
			"score": score
		}
	};
    window.parent.postMessage(msg, "*");
}

//Load the score
function load(){
	document.getElementById("score").innerHTML = 'SCORE: ' + savedScore;
	score = savedScore;
}

//Send the score after game over
function sendScore(){
    var msg = {
        "messageType": "SCORE",
        "score": score,
    };
    window.parent.postMessage(msg, "*");
}

//Reset current game session
function resetGame(){
	location.reload();
}

//Show elements on screen
function showSprites() {
    setPosition(player);
    for (var i = 0; i < lasers.length; i++) {
        setPosition(lasers[i]);
    }
    for (var i = 0; i < enemies.length; i++) {
        setPosition(enemies[i]);
    }

    var scoreElement = document.getElementById('score');
    scoreElement.innerHTML = 'SCORE: ' + score;
}

//Update position of enemy and laserbeam
function updatePositions() {
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].y += 4;
        enemies[i].x += getRandom(7) - 3;
        ensureBounds(enemies[i], true);
    }
    for (var i = 0; i < lasers.length; i++) {
        lasers[i].y -= 12;
    }
}

//Spawn enemy
function addEnemy() {
    var interval = 50;
    if (iterations > 1500) {
        interval = 5;
    } else if (iterations > 1000) {
        interval = 20;
    } else if (iterations > 500) {
        interval = 35;
    }
  
    if (getRandom(interval) == 0) {
        var elementName = 'enemy' + getRandom(10000000);
        var enemySizeX = getRandom(40) + 15;
        var enemySizeY = getRandom(40) + 10;
        var enemy = createSprite(elementName, getRandom(450), -40, enemySizeX, enemySizeY);
        
        var element = document.createElement('div');
        element.id = enemy.element;
        element.className = 'enemy'; 
        element.style.width = enemySizeX;
        element.style.height = enemySizeY;
        document.children[0].appendChild(element);
        
        enemies[enemies.length] = enemy;
    }
}

//Get random function
function getRandom(maxSize) {
    return parseInt(Math.random() * maxSize);
}

//Send windows height and width
function setting(){
    var msg = {
        "messageType": "SETTING",
        "options": {
            "height": 504,
			"width": 504,
        }
    };

    window.parent.postMessage(msg, "*");
}

//Main function loop
function loop() {
    if (new Date().getTime() - lastLoopRun > 40) {
        updatePositions();
        handleControls();
        checkCollisions();
        
        addEnemy();
        
        showSprites();
        
        lastLoopRun = new Date().getTime();
        iterations++;
		
    }
    setTimeout('loop();', 2);
}

//Toggle key up/down to enable continuous movement
document.onkeydown = function(evt) {
    toggleKey(evt.keyCode, true);
};

document.onkeyup = function(evt) {
    toggleKey(evt.keyCode, false);
};

document.getElementById('save').onclick = function() { save() };
document.getElementById('load').onclick = function() { load() };

//Check for load request
//document.addEventListener("message", function(evt){
//    if (evt.data.messageType == "LOAD"){
//        var savedScore = evt.data.gameState.score;
//        document.getElementById("score").innerHTML = 'SCORE: ' + savedScore;
//        score = savedScore;
//    }
//});

setting();
loop();

