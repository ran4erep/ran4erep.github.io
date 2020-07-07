//                                          ___                      \\
//    |     '       /  |                   /   |                     \\
//    /__      ___ (  /   _ __ __ _ _ __  / /| | ___ _ __ ___ _ __   \\
//    \\--`-'-|`---\\ |  | '__/ _` | '_ \/ /_| |/ _ \ '__/ _ \ '_ \  \\
//     |' _/   ` __/ /   | | | (_| | | | \___  |  __/ | |  __/ |_) | \\
//     '._  W    ,--'    |_|  \__,_|_| |_|   |_/\___|_|  \___| .__/  \\
//        |_:_._/                                            | |     \\
//                                                           |_|     \\

//класс персонажа
let Character = function() {
	this.x = 7;
	this.y = 9;
	this.vx = 1;
	this.vy = 1;
	this.currentFrame = 0;
	this.tilesetMoveRight = {firstFrame:10,lastFrame:13};
	this.moveRight = () => {
		this.x = this.x+=1;
		torch.placeLight(player.x+0.6,player.y+0.6,30);
		torch.updateLight();
	}
	this.moveLeft = () => {
		this.x = this.x-=1;
	}
	this.moveUp = () => {
		this.y = this.y-=1;
	}
	this.moveDown = () => {
		this.y = this.y+=1;
	}
}
let player = new Character();

//клвсс частицы
let Particle = function(cx,cy) {
		//кровь
		this.blood = {
			x : cx*spriteSize+random(0,8),
        	y : cy*spriteSize+4,
        	w : 1,
        	h : 1,
        	vx : random(-0.2,0.2),
        	vy : random(1,3),
        	gravity : 0.2,
        	deathAt : 0,
        	color : "#c00000",
        	alpha : 1,
        	isDone : false,
        	isDead : false,
        	timeBeforeDisappear : 100
		};
        
        this.updateBlood = (cx,cy) => {
        	if (!this.blood.isDone) {
        		this.blood.y -= this.blood.vy-=this.blood.gravity;
            	this.blood.x += this.blood.vx;
            	this.blood.alpha -= 0.01;
        	}
            if (this.blood.y+this.blood.h < 0 || this.blood.y > cy*spriteSize+spriteSize) {
                this.blood.x = this.blood.x;
                this.blood.isDone = true;
                this.blood.vy = 0;
                this.blood.y = this.blood.y;
                this.blood.alpha = 1;
                this.blood.isDead = true;
            }
            if (this.blood.isDead) {
            	this.blood.timeBeforeDisappear--;
            	if (this.blood.timeBeforeDisappear === 0) {
            		this.blood.x = -1;
            		this.blood.y = -1;
            	}
            }
        }
        this.drawBlood = () => {
            ctx.fillStyle = `rgba(150,0,0,${this.blood.alpha})`;
            ctx.fillRect(this.blood.x, this.blood.y, this.blood.w, this.blood.h);
        }
}

    let particle;
    let particles = [];
    let particlesAmount = 100;

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
		this.ctx.fillStyle = "rgba(0,0,0,0.8)";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.globalCompositeOperation = "destination-out";
		this.canvas.style.display = "none";
	}
	this.placeLight = (x,y,radius) => {
		this.gradient = this.ctx.createRadialGradient(x*spriteSize, y*spriteSize, 0, x*spriteSize, y*spriteSize, radius);
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
		this.ctx.fillStyle = 'rgb(0,0,0)';
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
			drawText(this.credits[i], this.getCenter(this.credits[i].length), this.creditsY+i, graphics[5]);
		}
		this.creditsClock++;
		if (this.creditsClock > speed) {
			this.creditsClock = 0;
			this.creditsY-=step;
		}
	}
}

endTitlesText = [
"cradle of death",
" ",
"game developed",
"by",
"ran4erep",
" ",
"catCstudio, 2020",
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