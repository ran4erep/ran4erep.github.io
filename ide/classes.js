//                                          ___                      \\
//    |     '       /  |                   /   |                     \\
//    /__      ___ (  /   _ __ __ _ _ __  / /| | ___ _ __ ___ _ __   \\
//    \\--`-'-|`---\\ |  | '__/ _` | '_ \/ /_| |/ _ \ '__/ _ \ '_ \  \\
//     |' _/   ` __/ /   | | | (_| | | | \___  |  __/ | |  __/ |_) | \\
//     '._  W    ,--'    |_|  \__,_|_| |_|   |_/\___|_|  \___| .__/  \\
//        |_:_._/                                            | |     \\
//                                                           |_|     \\

//клвсс частицы
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

    this.draw = () => {
    	ctx.fillStyle = `rgba(150,0,0,${this.alpha})`;
        ctx.fillRect(this.x, this.y, this.w, this.h);
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
        	if (this.particles[i].y+this.particles[i].h < 0 || this.particles[i].y > cy+spriteSize) {
        		this.particles[i].x = this.particles[i].x;
            	this.particles[i].vy = 0;
            	this.particles[i].y = this.particles[i].y;
            	this.particles[i].alpha = 1;
            	this.particles[i].isDead = true;
        	}
        	if (this.particles[i].isDead) {
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
let Character = function() {
	this.x = 7*8;
	this.y = 9*8;
	this.vx = 1;
	this.vy = 1;
	this.blood = new Blood();
	this.directionX = 0;
	this.directionY = 0;
	this.vx = 1;
	this.vy = 1;

	this.bleeding = () => {
		this.blood.make(this.x,this.y,50);
		this.blood.show(this.x,this.y);
	}

	this.currentFrame = 0;
	this.tilesetMoveRight = {firstFrame:10,lastFrame:13};
	this.move = (vx,vy) => {
		this.x+=vx;
		this.y+=vy;
		torch.placeLight(player.x+0.6,player.y+0.6,30);
		torch.updateLight();
	}

}
let player = new Character();

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