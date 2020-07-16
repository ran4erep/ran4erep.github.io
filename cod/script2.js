//                                          ___                      \\
//    |     '       /  |                   /   |                     \\
//    /__      ___ (  /   _ __ __ _ _ __  / /| | ___ _ __ ___ _ __   \\
//    \\--`-'-|`---\\ |  | '__/ _` | '_ \/ /_| |/ _ \ '__/ _ \ '_ \  \\
//     |' _/   ` __/ /   | | | (_| | | | \___  |  __/ | |  __/ |_) | \\
//     '._  W    ,--'    |_|  \__,_|_| |_|   |_/\___|_|  \___| .__/  \\
//        |_:_._/                                            | |     \\
//                                                           |_|     \\

let maps = 
[
[
[12,18,12,18,12,18,12,18,32,32,32,32,32,32,32,32],
[12,12,12,12,12,12,12,12,32,34,32,32,32,33,32,32],
[12,18,12,18,12,18,12,18,32,32,32,32,32,32,32,32],
[12,12,12,12,12,12,12,12,32,32,32,32,32,32,32,32],
[12,18,12,18,12,18,12,18,12,18,12,18,12,18,12,18],
[12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12],
[12,18,12,18,12,18,12,18,12,18,12,18,12,18,12,18],
[11,11,11,11,11,11,14,11,11,11,15,11,11,11,11,11],
[19,19,30,24,31,2,2,2,2,2,2,2,2,2,2,2],
[19,19,28,22,29,2,2,2,2,2,2,2,2,2,2,2],
[19,19,26,24,27,2,2,2,2,2,2,2,2,2,2,2],
[7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
[16,16,16,16,16,16,16,16,16,16,16,3,3,16,16,16],
[17,17,17,17,17,17,17,17,17,17,17,3,3,17,17,17],
[6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
[6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6]
],
													]

//загрузчик графики в двух функциях
let load = array => {
	for(let i = 0; i < array.length; i++) {
		graphics[i] = new Image();
		graphics[i].src = root + array[i];
		graphics[i].addEventListener("load", (e) => {
			graphicsSumCounter++;
			graphicsLoadingProgress = percentOf(graphicsSumCounter, array.length);
			drawBar(graphicsLoadingProgress, (canvas.width/2)-50,(canvas.height/2)-10,100,10);
		});
	}
}
let graphicsIsLoaded = (array, counter) => {
	let graphicsAmmount = array.length;
	if (graphicsAmmount === counter)
		return true;
	else
		return false;
}

//функция для подсчёта процентов
let percentOf = (number, totalNumber) => (number / totalNumber * 100);

//функция рандома
let random = (min, max) => Math.floor(min + Math.random() * (max + 1 - min));

//функция рисующая прогрессбары
let drawBar = (progress, x, y, width, height) => {
	//переменная прогресса должна входить в процентах
	if (progress <= 100) {
		ctx.strokeRect(x,y,width,height);
		ctx.fillRect(x,y,progress,height);
	} 
	if (progress >= 100) {
		//update();
	}
}

//функция преобразования шрифта
let drawText = (text, x, y, fontFile) => {
	let textFontRaw = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", " ", ".", ",", "!", "?", "A", "B", "X", "Y", "L", "R", "U", "D", "Q", "E", "T", "Y", "Z", "S", "C"];
	let textFont = [];
	for (let i=0; i < textFontRaw.length; i++) {
		textFont[i] = {
			char : textFontRaw[i],
			place : i * spriteSize,
		}
	}

	 if (fontFile === undefined) fontFile = graphics[2];

	let textSize = text.length;
	let outputText = [];

	for (let i=0; i < textSize; i++) {
		for (let j=0; j < textFont.length; j++) {
			if (text[i] === textFont[j].char) {
				outputText.push(textFont[j].place);
			}
		}
	}

	for (let i=0; i < textSize; i++) {
		let characterToDraw = outputText[i];
		ctx.drawImage(fontFile,characterToDraw,0,spriteSize, spriteSize, (x*tileSize)+(i*tileSize), y*tileSize, tileSize, tileSize);
	}
}

//функция отрисовки тайлов
let drawTile = (tileNumber, x, y, tileset, opacity) => {
	if (tileset === undefined) tileset = graphics[4];
	if (opacity === undefined) opacity = 1;
	ctx.save();
	ctx.globalAlpha = opacity;
	ctx.drawImage(
		tileset,tileNumber*spriteSize,0,spriteSize,spriteSize,x*tileSize, y*tileSize, tileSize, tileSize
		);
	ctx.restore();
}

//функция отрисовки тайлов
let drawSprite = (tileNumber, x, y, tileset, opacity) => {
	if (tileset === undefined) tileset = graphics[4];
	if (opacity === undefined) opacity = 1;
	ctx.save();
	ctx.globalAlpha = opacity;
	ctx.drawImage(
		tileset,tileNumber*spriteSize,0,spriteSize,spriteSize,x, y, tileSize, tileSize
		);
	ctx.restore();
}

//функция рисования текстбоксов
let drawBox = (text,x,y) => {
	let columns = 2;
	let output = text.split("/");
	let longest = 0;
	
for (let i=0; i < output.length; i++) {
	if (output[i].length > longest) {
		longest = output[i].length;
	}
}

	for (let i=0; i < text.length; i++) {
		if (text[i] === "/") columns++;
	}

	for (let i=0; i < longest; i++) {
			if (i===0)
			drawTile(10,x+i,y,graphics[6],0.7)
		else if (i===longest-1)
			drawTile(12,x+i,y,graphics[6],0.7)
		else
			drawTile(11,x+i,y,graphics[6],0.7)
	}

	for (let j=1; j < columns; j++) {
	for (let i=0; i < longest; i++) {
			if (i===0)
				drawTile(16,x+i,y+j,graphics[6],0.7)
			else if (i===longest-1)
				drawTile(17,x+i,y+j,graphics[6],0.7)
			else drawTile(18,x+i,y+j,graphics[6],0.7)
	}
}

	for (let i=0; i < longest; i++) {
		if (i===0)
			drawTile(13,x+i,y+(columns),graphics[6],0.7)
		else if (i===longest-1)
			drawTile(15,x+i,y+(columns),graphics[6],0.7)
		else drawTile(14,x+i,y+(columns),graphics[6],0.7)
	}

	for (let i=0; i < output.length; i++) {
		drawText(output[i],x,(y+1)+i);
	}
}

let clearTile = (x, y) => {
	ctx.clearRect(x*tileSize,y*tileSize,tileSize,tileSize);
}

//функция обновления экрана
let update = () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//функция логики игры
let logic = () => {
	
}

// функция рендеринга изображения
let render = () => {
	for (let i = 0; i < levelWidth; i++) {
		for (let j = 0; j < levelHeight; j++) {
			drawTile(maps[0][i][j],j,i);
			drawSprite(10,player.x, player.y, graphics[0]);
			if (torch.isNight) {
				//torch.updateLight();
				//torch.placeLight(player.x+0.6,player.y+0.6,30);
			}
		}
	}
	if (drawMeTheBox) drawBox("just/testing/textbox",4,4);
	//рисуем титры
	 if (endTitles.creditsY>-endTitles.credits.length && showCredits) endTitles.scroll(0.2,1);
}
let part;
let array = [];
let isDead = false;

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
    this.blood = new Blood();
    this.directionX = 0;
    this.directionY = 0;
    this.vx;
    this.vy;

    this.bleeding = () => {
        this.blood.make(this.x,this.y,50);
        this.blood.show(this.x,this.y);
    }

    this.currentFrame = 0;
    this.tilesetMoveRight = {firstFrame:10,lastFrame:13};
    this.move = () => {
        this.x+=this.vx;
        this.y+=this.vy;
        torch.placeLight(player.x+0.6,player.y+0.6,30);
        torch.updateLight();
    }

}


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

let player = new Character();
let torch = new LightSystem();
torch.createNight();
//Инициализация--------------------------------
let engineIsWorking = true;
buttonStopEngine.addEventListener("click", (e) => {
	engineIsWorking = false;
	buttonStopEngine.style.display = "none";
});
buttonNight.addEventListener("click", (e) => {
	torch.switchNight();
	torch.placeLight(player.x+0.6,player.y+0.6,30);
	torch.updateLight();
});
drawMeTheBox = false;
buttonBox.addEventListener("click", (e) => {
	drawMeTheBox = !drawMeTheBox;
});
let showCredits = false;
buttonCredits.addEventListener("click", (e) => {
	showCredits = true;
});
let bloodShow = false;
buttonBlood.addEventListener("click", (e) => {
	player.blood.burst();
	bloodShow = !bloodShow;
});
let testLoading = 0;
let showLoading = false;
buttonLoading.addEventListener("click", (e) => {
	showLoading = true;
});

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
canvas.width = 128;
canvas.height = 128;
let levelWidth = 16;
let levelHeight = 16;
let spriteSize = 8;
let tileSize = canvas.width / levelWidth;
let root = "data/";
let graphicsFiles = ["alex.png", "zombie_female.png", "font.png", "heart.png", "tileset.png", "font_inverted.png", "hud.png"];
let graphics = [];
let graphicsSumCounter = 0, allGraphicsLoaded = false, graphicsLoadingProgress = 0;
let times = [];
let fps;


document.onkeydown = (e) => {
	if (e.keyCode === 68) player.vx = 1; //move right
	if (e.keyCode === 65) player.vx = -1; //move left
	if (e.keyCode === 87) player.vy = -1; //move up
	if (e.keyCode === 83) player.vy = 1; //move down
}

buttonRight.addEventListener("click", (e) => {
	player.move(1,0);
});
buttonLeft.addEventListener("click", (e) => {
	player.move(-1,0);
});
buttonUp.addEventListener("click", (e) => {
	player.move(0,-1);
});
buttonDown.addEventListener("click", (e) => {
	player.move(0,1);
});


//Основной блок игры-----------------------

load(graphicsFiles);

let timeStart = 0;
function gameLoop(timestamp) {
	//if (timestamp - timeStart >= 0) {
		//начало игрового цикла-----
		//если графика загрузилась, то можно начинать работу
		if (graphicsIsLoaded(graphics,graphicsSumCounter)) {
			if (engineIsWorking) {
				logic();
				update();
				render();
				if (showLoading) {
					ctx.fillStyle = "white";
					ctx.strokeStyle = "white"
					if (testLoading < 100) testLoading++;
					drawBar(percentOf(testLoading,100),2*8,8*8,100,10);
					drawText(`loading ${testLoading}%...`,2,10)
				}
				
					player.bleeding();
					player.move();

			}
		}
		const NOW = performance.now();
		while(times.length > 0 && times[0] <= NOW - 1000) {
			times.shift();
		}
		times.push(NOW)
		fps = times.length;
		drawText(`fps ${fps}`,levelWidth-6,levelHeight-1,graphics[5]);
	//конец игрового цикла-----
	//timeStart = timestamp;
//}

requestAnimationFrame(gameLoop);
}

gameLoop();
