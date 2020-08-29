//                                          ___                      \\
//    |     '       /  |                   /   |                     \\
//    /__      ___ (  /   _ __ __ _ _ __  / /| | ___ _ __ ___ _ __   \\
//    \\--`-'-|`---\\ |  | '__/ _` | '_ \/ /_| |/ _ \ '__/ _ \ '_ \  \\
//     |' _/   ` __/ /   | | | (_| | | | \___  |  __/ | |  __/ |_) | \\
//     '._  W    ,--'    |_|  \__,_|_| |_|   |_/\___|_|  \___| .__/  \\
//        |_:_._/                                            | |     \\
//                                                           |_|     \\

//класс частицы
let Particle = function(cx,cy) {
    this.x = 0;
    this.y = 0;
    this.w = 1;
    this.h = 1;
    this.vx = random(-0.2,0.2);
    this.vy = random(1,3);
    this.gravity = 0.2;
    this.deathAt = 0;
    this.color = "#c00000";
    this.alpha = 1;
    this.isDead = false;
    this.timeBeforeDisappear = 100;
    this.placeOfDeath = {
        x: 0,
        y: 0
    };

    this.draw = () => {
        ctx.fillStyle = `rgba(150,0,0,${this.alpha})`;
        ctx.fillRect(this.x+camera.x, this.y+camera.y, this.w, this.h);
    }
}

let Blood = function() {
    this.cx = 0;
    this.cy = 0;
    this.particle = null;
    this.particles = [];
    this.reset = true;

    this.make = (cx,cy,particlesAmount) => {
        if(!this.reset) {
            if (this.particles.length <= particlesAmount) {
                this.particle = new Particle(cx,cy);
                this.particle.x = cx+random(0,8);
                this.particle.y = cy+4;
                this.particles.push(this.particle);
            }
        }
    }

    this.burst = () => {
        if(!this.isBleeding()) this.reset = false;
    }

    this.update = (cx,cy) => {
        for(let i=0; i<this.particles.length; i++) {
            if (!this.particles[i].isDead) {
                this.particles[i].y -= this.particles[i].vy-=this.particles[i].gravity;
                this.particles[i].x += this.particles[i].vx;
                this.particles[i].alpha -= 0.01;
            }
            if (this.particles[i].y > cy+spriteSize) {
                this.particles[i].x = this.particles[i].x;
                this.particles[i].vy = 0;
                this.particles[i].y = this.particles[i].y;
                this.particles[i].alpha = 1;
                this.particles[i].isDead = true;
            }
            if (this.particles[i].isDead) {
                this.particles[i].placeOfDeath.x = this.particles[i].x;
                this.particles[i].placeOfDeath.y = this.particles[i].y;
                Object.freeze(this.particles[i].placeOfDeath);
                this.particles[i].timeBeforeDisappear--;
                if (this.particles[i].timeBeforeDisappear === 0) {
                    this.reset = true;
                    this.dying(i);
                }
            }
        }
    }

    this.dying = (particle) => {
        this.particles.splice(particle,1);
    }

    this.isBleeding = () => {
        if (this.particles.length === 0) return false;
        else return true;
    }

    this.draw = () => {
        for(let i=0; i<this.particles.length; i++) {
            this.particles[i].draw();
        }
    }

    this.show = (cx,cy) => {
        this.update(cx,cy);
        this.draw();
    }

}
let blood = new Blood();
let test = new Blood();


//класс персонажа
let Character = function(spritesheet,animations,x,y) {
	this.spritesheet = spritesheet;
	this.animations = animations;
    this.x = x;
    this.y = y;
    this.atTileX = Math.floor(this.x/spriteSize);
    this.atTileY = Math.floor(this.y/spriteSize);
    this.destinationTileX = 0;
    this.destinationTileY = 0;
    this.blood = new Blood();
    this.directionX = 0;
    this.directionY = 0;
    this.vx = 0;
    this.vy = 0;
    this.frictionX = 0, this.frictionY = 0;
    this.friction = 1;
    this.speed = 2;
    this.currentAnimation = [0,1];
    this.currentFrame = 0;
    this.animationSpeed= 0;
    this.facing = "w";
    this.frameSpeed = 10;
    this.isWalking = false;
    this.animationType = "endless";
    this.isDead = false;

    this.AI = () => {
        if(this.x < player.x && this.y < player.y) this.facing = "e";
        if(this.x > player.x && this.y < player.y) this.facing = "w";
        //if(this.y > player.y) this.facing = "n";
        //if(this.y < player.y) this.facing = "s";
        //if(this.facing === "e") this.setCurrentAnimation("walkingRight",5);
        //if(this.facing === "w") this.setCurrentAnimation("walkingLeft",5);
        //if(this.facing === "n") this.setCurrentAnimation("walkingUp",5);
        //if(this.facing === "s") this.setCurrentAnimation("walkingDown",5);
        let dirX = player.x - this.x;
        let dirY = player.y - this.y;
        let hyp = Math.sqrt(dirX*dirX + dirY*dirY);
        dirX /= hyp;
        dirY /= hyp;

        if (!cantSee) {
            this.x += Math.round(dirX) * 1;
            this.y += Math.round(dirY) * 1;
        }
        
    }

    //tilesetProperties.tiles[4].objectgroup.objects[0].x || y || width || height --- данные о коллизии тайла

    this.setCurrentAnimation = (animation,frameSpeed,type) => {
    	(type) ? this.animationType = type : this.animationType = "endless";
        (frameSpeed) ? this.frameSpeed = frameSpeed : this.frameSpeed = 5;
            this.currentFrame = 0;
            for (let i = 0; i < this.animations.length; i++) {
                if(animation === this.animations[i].name) {
                    this.currentAnimation = this.animations[i].frames;
                }
            }
    };

    this.render = () => {
    	if (this.animationSpeed>this.frameSpeed) { 
    		if(this.animationType === "endless") {
                if (this.currentFrame !== this.currentAnimation.length)
                    this.currentFrame++;
                if (this.currentFrame === this.currentAnimation.length)
                    this.currentFrame=0;
                this.animationSpeed=0;
            }
            if(this.animationType === "once") {
                if (this.currentFrame !== this.currentAnimation.length)
                    this.currentFrame++;
                if (this.currentFrame === this.currentAnimation.length)
                    this.currentFrame=this.currentAnimation.length-1;
                this.animationSpeed=0;
            }
    	}
        
        //rendering character
    	drawSprite(this.currentAnimation[this.currentFrame],
            this.x+camera.x,
            this.y+camera.y,
            graphics[this.spritesheet]
            );
    	this.animationSpeed++;
    }

    this.bleeding = () => {
        this.blood.make(this.x,this.y,50);
        this.blood.show(this.x,this.y);
    }

    this.setVelocity = (vx,vy) => {
    	this.vx = vx;
    	this.vy = vy;
    	(vx === 0) ? this.isMoving=false : this.isMoving=true;
    	(vy === 0) ? this.isMoving=false : this.isMoving=true;
    }

    this.getDestination = () => {
    	if (this.facing === "w") {
    		this.destinationTileX = this.atTileX-1;
    		this.destinationTileY = this.atTileY;
    	}
    	if (this.facing === "e") {
    		this.destinationTileX = this.atTileX+1;
    		this.destinationTileY = this.atTileY;
    	}
    	if (this.facing === "n") {
    		this.destinationTileX = this.atTileX;
    		this.destinationTileY = this.atTileY-1;
    	}
    	if (this.facing === "s") {
    		this.destinationTileX = this.atTileX;
    		this.destinationTileY = this.atTileY+1;
    	}
    }

    this.move = () => {
    	this.atTileX = Math.floor( (this.x+(spriteSize/2) )/spriteSize );
    	this.atTileY = Math.floor( (this.y+(spriteSize/2) )/spriteSize );
    	this.getDestination();
    	//this.vx *= this.friction;
        if (this.vx === 1 && !this.isDead) {
            this.x++;
            camera.move(camera.x--,0,camera.tx++,0);
        }
        if (this.vx === -1 && !this.isDead) {
            this.x--;
            camera.move(camera.x++,0,camera.tx--,0);
        }
        if (this.vy === -1 && !this.isDead) {
            this.y--;
            camera.move(0,camera.y++,0,camera.ty++);
        }
        if (this.vy === 1 && !this.isDead) {
            this.y++;
            camera.move(0,camera.y--,0,camera.ty--);
        }
        //this.vy *= this.friction;
        //this.y += this.vy;
        (this.vx > 0 || this.vy > 0 || this.vx < 0 || this.vy < 0) ? this.isWalking = true : this.isWalking = false;
        if (this.isWalking && this.facing === "e") {
        	//mapOffsetX +=8;
        	tileOffsetX +=1;
        	
        }
        if (this.isWalking && this.facing === "w") {
        	//mapOffsetX -=8;
        	tileOffsetX -=1;
        	
        }
        if (this.isWalking && this.facing === "n") {
        	//mapOffsetY -=8;
        	tileOffsetY -=1;
        	
        }
        if (this.isWalking && this.facing === "s") {
        	//mapOffsetY +=8;
        	tileOffsetY +=1;
        	
        }
    }

}

let player = new Character(0,alex_animations,7*spriteSize,7*spriteSize);
let zombie = new Character(1,zombie_animations,0*spriteSize,0*spriteSize);
zombie.setCurrentAnimation("walkingRight",5);

let camera = {
    x : (7 - player.atTileX) * tileSize,
    y : (7 - player.atTileY) * tileSize,
    tx: (player.atTileX - 7)*8, //тут должна быть разница между спаунХ и оффсетХ. Напимер, спаун по Х нв 8, а центр 7. Значит делаем tx=8
    ty: -(player.atTileY - 7)*8,

    move : (x,y,tx,ty) => {
        this.x = x;
        this.y = y;
        this.tx = tx/tileSize;
        this.ty = ty/tileSize;
    }
};

//класс системы света
    let LightSystem = function() {
    this.isNight = false;
    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.margin = "8px";
    this.ctx = null;
    this.gradient = null;
    this.createNight = () => {
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = 128;
        this.canvas.height =128;
        document.body.appendChild(this.canvas);
        this.ctx.fillStyle = "rgba(0,0,0,0.85)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = "destination-out";
        this.canvas.style.display = "none";
    }
    this.placeLight = (x,y,radius) => {
        this.gradient = this.ctx.createRadialGradient(x, y, 20, x, y, 180);
        this.gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        this.gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.8)");
        this.gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.6)");
        this.gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.4)");
        this.gradient.addColorStop(1, "rgba(255, 255, 255, .001)");
        this.ctx.fillStyle = this.gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.updateLight = () => {
        this.canvas.width+=0;
        this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.ctx.globalCompositeOperation = "destination-out";
        this.ctx.fillStyle = this.gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.switchNight = () => {
        if (!this.isNight) {
            this.isNight = true;
            this.canvas.style.display = "block";
        }
        else {
            this.isNight = false;
            this.canvas.style.display = "none";
        }
    }
}
let torch = new LightSystem();
torch.createNight();

//класс титров
let Credits = function (credits) {
    this.credits = credits;
    this.creditsY = 16;
    this.creditsClock = 0;
    this.getCenter = (textLength) => {
        return Math.floor((16 - textLength) / 2);
    }
    this.scroll = (step,speed) => {
        for (let i=0; i < this.credits.length; i++) {
            drawText(this.credits[i], this.getCenter(this.credits[i].length), this.creditsY+i, graphics[13]);
        }
        this.creditsClock++;
        if (this.creditsClock > speed) {
            this.creditsClock = 0;
            this.creditsY-=step;
        }
        if (this.creditsY>-this.credits.length) return true;
        else return false;
    }
}

endTitlesText = [
"cradle of death",
" ",
" ",
" ",
"game developed",
"by",
"ran4erep",
" ",
"music by",
"naked death",
" ",
"special thanks",
"to",
" ",
"remi",
" ",
"shang tsung",
"a.k.a. shong",
" ",
"reptile q",
" ",
"max tsvetkov",
" ",
"alyona",
"roslyakova",
"",
"////////////////",
" ",
"game made with",
" ",
"cat2dCengine",
" ",
"cat2d stands for",
" ",
"computer",
"arranged",
"tiles"
];
let endTitles = new Credits(endTitlesText);

let Window = function (x,y,text) {
	this.x = x;
	this.y = y;
	this.text = text.split("/");
	this.height = this.text.length;
	this.width = 0;
	this.slideY = 0;
	this.timer = 0;
	this.closing = false;

	for (let i=0; i < this.text.length; i++) {
		if (this.text[i].length > this.width) {
			this.width = this.text[i].length;
		}
	}

	this.animate = () => {
		if (this.slideY < this.y + this.height*spriteSize) {
			ctx.fillStyle = `rgba(${palette[1].rgb},0.8)`;
			ctx.fillRect(this.x*spriteSize,this.y*spriteSize,this.width*spriteSize,this.slideY);
			this.slideY+=6;
			ctx.strokeStyle = palette[6].hex;
			ctx.strokeRect(this.x*spriteSize-1,this.y*spriteSize-1,this.width*spriteSize+2,this.slideY);
		}
		else this.open();
	}

	this.open = () => {
		//opening animation
		if (this.slideY < this.y + this.height*spriteSize && !this.closing) {
			ctx.fillStyle = `rgba(${palette[1].rgb},0.8)`;
			ctx.fillRect(this.x*spriteSize,this.y*spriteSize,this.width*spriteSize,this.slideY);
			this.slideY+=6;
			ctx.strokeStyle = palette[6].hex;
			ctx.strokeRect(this.x*spriteSize-1,this.y*spriteSize-1,this.width*spriteSize+2,this.slideY);
		/////////////////
		} 
		else if(this.slideY > this.y + this.height*spriteSize && !this.closing) {
		ctx.fillStyle = `rgba(${palette[1].rgb},0.8)`;
		ctx.fillRect(this.x*spriteSize,this.y*spriteSize,this.width*spriteSize,this.height*spriteSize);

		ctx.strokeStyle = palette[6].hex;
		ctx.lineWidth = 1;
		ctx.strokeRect(this.x*spriteSize-1,this.y*spriteSize-1,this.width*spriteSize+2,this.height*spriteSize+2);
		for (let i=0; i < this.height; i++) {
			drawText(this.text[i],this.x,this.y+i);
		}
		switchColor(this.x*spriteSize,this.y*spriteSize,this.width*spriteSize,this.height*spriteSize,0,7)
	}
}
	this.close = () => {
		if (this.slideY > 0) {
			this.closing = true;
		} 
		if(this.slideY > 0 && this.closing) {
		ctx.fillStyle = `rgba(${palette[1].rgb},0.8)`;
		ctx.fillRect(this.x*spriteSize,this.y*spriteSize,this.width*spriteSize,this.slideY);
		ctx.strokeStyle = palette[6].hex;
		ctx.strokeRect(this.x*spriteSize-1,this.y*spriteSize-1,this.width*spriteSize+2,this.slideY);
		if (this.slideY>=0) this.slideY-=6;
		if (this.slideY===0) this.closing=false;
	}
		// else {
		// 	this.x = -128;
		// 	this.y = -128;
		// }

	}
this.mode = this.close;
}
let windowTest = new Window(1,3,"this is/just a/testing/new line/and more lines/yeeeeeeeah");

let Button = function() {

	this.draw = (x,y,text) => {
		ctx.fillStyle = "rgba(" + palette[6].rgb + ",0.8" + ")";
		ctx.fillRect(x*spriteSize,y*spriteSize,spriteSize*text.length,spriteSize);
		ctx.strokeStyle = palette[0].hex;
		ctx.strokeRect(x*spriteSize-1,y*spriteSize-1,spriteSize*text.length+2,8+2);
		drawText(text,x,y);
	}
}
let buttons = [];
for(let i=0; i<3; i++) {
	buttons[i] = new Button();
}

let Cursor = function() {
	this.x = 3;
	this.y = 8;

	this.draw = () => {
		drawSprite(10,this.x*spriteSize,this.y*spriteSize+6,graphics[6]);
	}
	this.move = (v) => {
		if(v>0 && this.y !==12)
			this.y+=v;
		if(v<0 && this.y !==8)
			this.y+=v;
	}
}
let cursor = new Cursor();
