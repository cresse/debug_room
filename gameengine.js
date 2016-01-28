// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

KEY_CODES = {
    65: 'a',
    68: 'd',
    83: 's',
    87: 'w'
}

function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.keyStatus = {};
    this.keysDown = false;
    //this.showOutlines = false;
    
    //this.click = null;
    //this.mouse = null;
    //this.wheel = null;
    //this.surfaceWidth = null;
    //this.surfaceHeight = null;
}

//GameEngine functions
GameEngine.prototype = {
    //Initialize the engine. Set all keys to unpressed.
    init: function (ctx) {
        this.ctx = ctx;
        for (code in KEY_CODES) {
            this.keyStatus[KEY_CODES[code]] = false;;
        }
        this.startInput();
        this.timer = new Timer();
    },

    start : function () {
        var that = this;
        (function gameLoop() {
            that.loop()
            requestAnimationFrame(gameLoop, that.ctx.canvas);
        })();
    },

    startInput: function () {
        var that = this;
        this.ctx.canvas.addEventListener("keydown", function (event) {
            if (KEY_CODES[event.keyCode]) {
                that.keyStatus[KEY_CODES[event.keyCode]] = true;
                that.keysDown = true;
                event.preventDefault();
            }
        }, false);

        this.ctx.canvas.addEventListener("keyup", function (event) {
            if (KEY_CODES[event.keyCode]) {
                that.keyStatus[KEY_CODES[event.keyCode]] = false;
                that.keysDown = false;
                for (code in KEY_CODES) {
                    if (that.keyStatus[KEY_CODES[code]]) {
                        that.keysDown = true;
                    }
                }
                //console.log("multiple keys down? " + that.keysDown);
                event.preventDefault();
            }
        }, false);
    },

    addEntity : function(entity) {
        this.entities.push(entity);
    },

    draw: function () {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.save();
        for (var i = 0; i < this.entities.length; i++) {
            this.entities[i].draw(this.ctx);
        }
        this.ctx.restore();
    },

    update: function () {
        var entitiesCount = this.entities.length;

        for (var i = 0; i < entitiesCount; i++) {
            var entity = this.entities[i];

            if (!entity.removeFromWorld) {
                entity.update();
            }
        }

        for (var i = this.entities.length - 1; i >= 0; i--) {
            if (this.entities[i].removeFromWorld) {
                this.entities.splice(i, 1);
            }
        }
    },

    loop: function () {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    }
}
