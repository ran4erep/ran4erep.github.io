//                                          ___                      \\
//    |     '       /  |                   /   |                     \\
//    /__      ___ (  /   _ __ __ _ _ __  / /| | ___ _ __ ___ _ __   \\
//    \\--`-'-|`---\\ |  | '__/ _` | '_ \/ /_| |/ _ \ '__/ _ \ '_ \  \\
//     |' _/   ` __/ /   | | | (_| | | | \___  |  __/ | |  __/ |_) | \\
//     '._  W    ,--'    |_|  \__,_|_| |_|   |_/\___|_|  \___| .__/  \\
//        |_:_._/                                            | |     \\
//                                                           |_|     \\

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

buttonRight.addEventListener("click", (e) => {
	player.moveRight();
});
buttonLeft.addEventListener("click", (e) => {
	player.moveLeft();
});
buttonUp.addEventListener("click", (e) => {
	player.moveUp();
});
buttonDown.addEventListener("click", (e) => {
	player.moveDown();
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
				
				if (bloodShow) {
					makeBlood(player.x,player.y,particle,particles,particlesAmount);
					/*
					if (particles.length < particlesAmount) {
						particle = new Particle(player.x,player.y);
						particles.push(particle);
					}
					for(let i=0; i<particles.length; i++) {
						particles[i].updateBlood(player.x,player.y);
						particles[i].drawBlood();
					}
					*/
				}

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
