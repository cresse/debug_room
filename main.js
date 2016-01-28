/* 
Ian Cresse
For muh blog
Seth Ladd, Chris Marriott and Kyle Doan all helped oodles and noodles with this code.
todo:
COMPLETE transition between standing and jumping frames when appropriate
COMPLETE standing turn around
COMPLETED jump with sprite facing other way
COMPLETE implement run animation
COMPLETE make jump resolve independent of button pressing
implement attack
make sure you can't move during an attack
find apex of jump and have the fall frame replace the jump frame
snapping to pixels? lots of math.floor? would solve 'smooth' movement issue in a pixel world
*/

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("img/knight atk.png");
ASSET_MANAGER.queueDownload("img/knight jump temp.png");
ASSET_MANAGER.queueDownload("img/knight run.png");
ASSET_MANAGER.queueDownload("img/knight standing.png");
ASSET_MANAGER.queueDownload("img/knight atk flipped.png");
ASSET_MANAGER.queueDownload("img/knight jump flipped temp.png");
ASSET_MANAGER.queueDownload("img/knight run flipped.png");
ASSET_MANAGER.queueDownload("img/knight standing flipped.png");
ASSET_MANAGER.queueDownload("img/testrun.png");
ASSET_MANAGER.queueDownload("img/knight attack skeleton.png");

/*
Download all the elements and add entities to the game.
*/
ASSET_MANAGER.downloadAll(function () {
    console.log("Initializing world");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var gameEngine = new GameEngine();
    var bg = new Background(gameEngine);
    var knight = new Knight(gameEngine);

    gameEngine.addEntity(bg);
    gameEngine.addEntity(knight);

    gameEngine.init(ctx);
    console.log("Starting game");
    gameEngine.start();
});

/*
Establish the fields for animating a figure.
Future: Make this more robust. Downloading 1 sprite sheet is better than 8 of them.
*/
function Animation(sheet, startX, startY, sheetFlipped, startXFlipped, startYFlipped,
    frameWidth, frameHeight, numFrames, frameDuration, flipped, loop) {
    this.sheet = sheet;
    this.startX = startX;
    this.startY = startY;
    this.sheetFlipped = sheetFlipped;
    this.startXFlipped = startXFlipped;
    this.startYFlipped = startYFlipped;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.numFrames = numFrames;
    this.frameDuration = frameDuration;
    this.totalTime = frameDuration * numFrames;
    this.flipped = flipped;
    this.loop = loop;
    this.elapsedTime = 0;
}

/*
Functions of the animation object.
drawFrame
currentFrame
isDone
*/
Animation.prototype = {
    //Draws the current frame of the animation.
    //Handles flipped images.
    drawFrame: function (ctx, x, y) {
        if (this.loop) {
            if (this.isDone()) {
                this.elapsedTime = 0;
            }
        } else if (this.isDone()) {
            return;
        }

        var curFrame = this.currentFrame();
        if (!this.flipped) {
            ctx.drawImage(this.sheet, this.startX + (curFrame * this.frameWidth), this.startY,
                this.frameWidth, this.frameHeight,
                x, y,
                this.frameWidth * 2, this.frameHeight * 2);
        } else {
            ctx.drawImage(this.sheetFlipped, this.startX + (curFrame * this.frameWidth), this.startY,
                this.frameWidth, this.frameHeight,
                x, y,
                this.frameWidth * 2, this.frameHeight * 2);
        }
    },

    //returns the current frame of the animation.
    currentFrame: function () {
        return Math.floor(this.elapsedTime / this.frameDuration);
    },

    //returns whether the animation is complete or not.
    isDone: function () {
        return (this.elapsedTime >= this.totalTime);
    }
}

/*
Initialize the fields the background has.
*/
function Background(game) {
    this.game = game;
    //Entity.call(this, game, 0, 400);
    //this.radius = 200;
}

/*
Draw a green box on the top and bottom of the screen.
The bottom box is used as the floor.
*/
Background.prototype = {
    update: function () { },
    draw: function () {
        this.game.ctx.fillStyle = "Green";
        this.game.ctx.fillRect(0, 0, 800, 110);
        this.game.ctx.fillRect(0, 600, 800, 215);
    }
}

/* 
Initializes the Knight and loads his assets.
*/
function Knight(game) {
    this.game = game;
    //y pos of the ground
    this.ground = 600 - (59 * 2);
    //y pos of the ceiling
    //this.ceiling = 110;

    //the Knight's starting position
    this.currentX = 0;
    this.currentY = 600 - (59 * 2);

    //setting up gamestate bools
    this.removeFromWorld = false;
    this.isStanding = true;
    this.isRunning = false;
    this.isJumping = false;
    this.isAttacking = false;

    //store animations from sheets
    this.standing = new Animation(ASSET_MANAGER.getAsset("img/knight standing.png"),
        0, 0, ASSET_MANAGER.getAsset("img/knight standing flipped.png"),
        0, 0, 48, 54, 1, 1, false, true);
    this.jumping = new Animation(ASSET_MANAGER.getAsset("img/knight jump temp.png"),
        0, 0, ASSET_MANAGER.getAsset("img/knight jump flipped temp.png"),
        0, 0, 52, 61, 1, 1, false, false);
    this.running = new Animation(ASSET_MANAGER.getAsset("img/testrun.png"),
        0, 0, ASSET_MANAGER.getAsset("img/testrun.png"),
        0, 0, 54, 59, 8, 0.1, false, true);
    this.attacking = new Animation(ASSET_MANAGER.getAsset("img/knight attack skeleton.png"),
        0, 0, ASSET_MANAGER.getAsset("img/knight attack skeleton.png"),
        0, 0, 101, 72, 12, 0.1, false, true);
}

/*
Functions of the Knight.
update
draw
*/
Knight.prototype = {
    /* 
    Updates the Knight depending on keyboard state.
    Handles flipping the knight around.
    Handles different states of the knight.
    Implements fake gravity for a nice jump arc.
    */
    update: function () {
        if (this.game.keysDown) {
            //this.standing.elapsedTime += this.game.clockTick;
            this.running.elapsedTime += this.game.clockTick;
            this.attacking.elapsedTime += this.game.clockTick;
        } else {
            if (this.isAttacking) {
                this.attacking.elapsedTime += this.game.clockTick;
            }
            if (!this.isJumping) {
                this.isStanding = true;
            }
        }

        //since 'd' comes first, if both keys are held down, d comes first.
        //interestingly, if a is the last key, the animation doesn't play.
        //doesn't matter if standing is one frame but if it is...
        if (this.game.keyStatus['d']) {
            this.standing.flipped = false;
            this.jumping.flipped = false;
            this.running.flipped = false;
            this.attacking.flipped = false;
            this.isRunning = true;
            this.isStanding = false;
            this.isAttacking = false;
            this.currentX += 7;
        } else if (this.game.keyStatus['a']) {
            this.standing.flipped = true;
            this.jumping.flipped = true;
            this.running.flipped = true;
            this.attacking.flipped = false;
            this.isRunning = true;
            this.isStanding = false;
            this.isAttacking = false;
            this.currentX -= 7;
        }

        if (this.game.keyStatus['w']) {
            //console.log("w hit");
            this.isJumping = true;
            this.isAttacking = false;
            this.isStanding = false;
        }

        if (this.game.keyStatus['s']) {
            this.isAttacking = true;
            this.isStanding = false;
            this.isJumping = false;
            this.isRunning = false;
        }

        //establish jump arc
        if (this.isJumping) {
            this.jumping.elapsedTime += this.game.clockTick;
            if (this.jumping.isDone()) {
                this.jumping.elapsedTime = 0;
                this.isJumping = false;
                this.isRunning = false;
                this.isStanding = true;
            }
            var jumpDistance = this.jumping.elapsedTime / this.jumping.totalTime;
            var totalHeight = 200;

            if (jumpDistance > 0.5) {
                jumpDistance = 1 - jumpDistance;
            }

            var height = totalHeight * (-4) * (jumpDistance * jumpDistance - jumpDistance);
            //console.log("elapsed " + jumping.elapsedTime);
            //console.log("total " + jumping.totalTime);
            //console.log("jump distance : " + jumpDistance);
            //console.log("height: " + height);
            this.currentY = this.ground - height;
        }
    },

    //Draws the knight based on gamestate.
    //Eventually attacking will also be here.
    draw: function () {
        if (this.isStanding) {
            this.standing.drawFrame(this.game.ctx, this.currentX, this.currentY);
        } else if (this.isAttacking) {
            this.attacking.drawFrame(this.game.ctx, this.currentX, this.currentY);
        } else if (this.isJumping) {
            this.jumping.drawFrame(this.game.ctx, this.currentX, this.currentY);
        } else if (this.isRunning) {
            this.running.drawFrame(this.game.ctx, this.currentX, this.currentY);
        }
    }
}
