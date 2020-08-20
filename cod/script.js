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
buttonMinimap.addEventListener("click", (e) => {
	minimapToggle = !minimapToggle;
});
buttonDeath.addEventListener("click", (e) => {
	if(gameMode === game) {
		player.setCurrentAnimation("death",10,"once");
		player.isDead = true;
	}
});
buttonNight.addEventListener("click", (e) => {
	torch.switchNight();
	torch.placeLight(player.x+0.6,player.y+0.6,30);
	torch.updateLight();
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


//KEYBOARD CONTROLS//////////////////////
document.onkeydown = (e) => {
	if (document.activeElement.tagName !== "INPUT") {
		if (e.keyCode === 68) {
			e.preventDefault();
			if(gameMode === game) player.facing = "e";
			player.setVelocity(1,0);
			torch.placeLight(player.x+0.6,player.y+0.6,30);
    		torch.updateLight();
    		if(keyboardKeyAnimationFix === 0)
    			player.setCurrentAnimation("walkingRight",5);
    		keyboardKeyAnimationFix++;
    	}
		if (e.keyCode === 65) {
			e.preventDefault();
			if(gameMode === game) player.facing = "w";
			player.setVelocity(-1,0);
			torch.placeLight(player.x+0.6,player.y+0.6,30);
    		torch.updateLight();
    		if(keyboardKeyAnimationFix === 0)
    			player.setCurrentAnimation("walkingLeft",5);
    		keyboardKeyAnimationFix++;
		}
		if (e.keyCode === 87) {
			e.preventDefault();
			if(gameMode === game) player.facing = "n";
			player.setVelocity(0,-1);
			torch.placeLight(player.x+0.6,player.y+0.6,30);
    		torch.updateLight();
    		if(keyboardKeyAnimationFix === 0)
    			player.setCurrentAnimation("walkingUp",5);
    		keyboardKeyAnimationFix++;

    		if (gameMode === mainMenu) {
    			cursor.move(-2);
    		}
		}
		if (e.keyCode === 83) {
			e.preventDefault();
		 	if(gameMode === game) player.facing = "s";
			player.setVelocity(0,1);
			torch.placeLight(player.x+0.6,player.y+0.6,30);
    		torch.updateLight();
    		if(keyboardKeyAnimationFix === 0)
    			player.setCurrentAnimation("walkingDown",5);
    		keyboardKeyAnimationFix++;

    		if (gameMode === mainMenu) {
    			cursor.move(2);
    		}
		}

		if (e.keyCode === 13) {
			e.preventDefault();
			windowTest.mode = windowTest.close;

		if (gameMode === mainMenu && cursor.y === 8) {
			gameMode = game;
		}
		if (gameMode === mainMenu && cursor.y === 10) {
			show = 3;
		}
		if (gameMode === mainMenu && cursor.y === 12) {
			window.opener = self;
			window.close();
		}
	}

	}
}
document.onkeyup = (e) => {
	keyboardKeyAnimationFix = 0;
	player.setVelocity(0,0);
	if (player.facing === "w")
		player.setCurrentAnimation("breathingLeft",10);
	if (player.facing === "e")
		player.setCurrentAnimation("breathingRight",10);
	if (player.facing === "n")
		player.setCurrentAnimation("breathingUp",10);
	if (player.facing === "s")
		player.setCurrentAnimation("breathingDown",10);
}

//TOUCH CONTROLS////////////////
buttonRight.addEventListener("touchstart", (e) => {
	e.preventDefault();
	if(gameMode === game) player.facing = "e";
	player.setVelocity(1,0);
	torch.placeLight(player.x+0.6,player.y+0.6,30);
    torch.updateLight();
    player.setCurrentAnimation("walkingRight",5);
    pressedButton = "r";
});
buttonLeft.addEventListener("touchstart", (e) => {
	e.preventDefault();
	if(gameMode === game) player.facing = "w";
	player.setVelocity(-1,0);
	torch.placeLight(player.x+0.6,player.y+0.6,30);
    torch.updateLight();
    player.setCurrentAnimation("walkingLeft",5);
    pressedButton = "l";
});
buttonUp.addEventListener("touchstart", (e) => {
	e.preventDefault();
	if(gameMode === game) player.facing = "n";
	player.setVelocity(0,-1);
	torch.placeLight(player.x+0.6,player.y+0.6,30);
    torch.updateLight();
    player.setCurrentAnimation("walkingUp",5)

    if (gameMode === mainMenu) {
    	cursor.move(-2);
    }
    pressedButton = "u";
});
buttonDown.addEventListener("touchstart", (e) => {
	e.preventDefault();
	if(gameMode === game) player.facing = "s";
	player.setVelocity(0,1);
	torch.placeLight(player.x+0.6,player.y+0.6,30);
    torch.updateLight();
    player.setCurrentAnimation("walkingDown",5);

    if (gameMode === mainMenu) {
    	cursor.move(2);
    }
    pressedButton = "d";
});

buttonA.addEventListener("touchstart", (e) => {
	//e.preventDefault();
	windowTest.mode = windowTest.close;

	if (gameMode === mainMenu && cursor.y === 8) {
		gameMode = game;
	}
	if (gameMode === mainMenu && cursor.y === 10) {
		show = 3;
	}
	if (gameMode === mainMenu && cursor.y === 12) {
		window.opener = self;
		window.close();
	}
	pressedButton = "a";
});

buttonB.addEventListener("touchstart", (e) => {
	//e.preventDefault();
	windowTest.mode = windowTest.open;
	pressedButton = "b";
});

buttonX.addEventListener("touchstart", (e) => {
	//e.preventDefault();
	pressedButton = "x";
});

buttonY.addEventListener("touchstart", (e) => {
	//e.preventDefault();
	pressedButton = "y";
});

document.body.addEventListener("touchend", (e) => {
	player.setVelocity(0,0);
	if (player.facing === "w")
		player.setCurrentAnimation("breathingLeft",10);
	if (player.facing === "e")
		player.setCurrentAnimation("breathingRight",10);
	if (player.facing === "n")
		player.setCurrentAnimation("breathingUp",10);
	if (player.facing === "s")
		player.setCurrentAnimation("breathingDown",10);
});
////////////////////////////

consoleDo.addEventListener("click", (e) => {
	eval(document.getElementById("consoleInput").value);
	document.getElementById("consoleHistory").innerHTML = document.getElementById("consoleHistory").innerHTML += (document.getElementById("consoleInput").value + "<br>");
	document.getElementById("consoleInput").value = "";
});

let game = () => {
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

	player.move();
	player.bleeding();
	//drawMinimapSector()
	//windowTest.open();
	windowTest.mode();
	//switchColor(player.x,player.y,spriteSize,spriteSize,15,4);
}

let show = 0;
let fadeAlpha = 0;
setTimeout(()=> {
	show=1;
},3000);
setTimeout(()=> {
	show=2;
},5000);


let mainMenu = () => {
	fullscreen();
	//update();
	if (show === 0) {
		ctx.drawImage(graphics[10],0,0,canvas.width,canvas.height);
	}
	if (show === 1) {
		ctx.fillStyle = "rgba(" + palette[0].rgb + "," + fadeAlpha +")";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		if (fadeAlpha<1) fadeAlpha+=0.01;
	}
	if (show === 2) {
		ctx.drawImage(graphics[14],0,0,canvas.width,canvas.height);
		ctx.fillRect(0,0,canvas.width,canvas.height);
		drawText("cradle",logoX,logoY,graphics[13]);
		drawText("of",logoX+2,logoY+1,graphics[13]);
		drawText("death",logoX+0.5,logoY+2,graphics[13]);
		buttons[0].draw(logoX-0.5,logoY+4,"new game");
		buttons[1].draw(logoX,logoY+6,"credits");
		buttons[2].draw(logoX+0.5,logoY+8,"exit");
		cursor.draw();

		//--fading
		ctx.fillStyle = "rgba(" + palette[0].rgb + "," + fadeAlpha +")";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		if (fadeAlpha>0) fadeAlpha-=0.01;
	}
	
	if (show === 3) {
		ctx.drawImage(graphics[14],0,0,canvas.width,canvas.height);
		if (endTitles.scroll()) {endTitles.scroll(0.2,5)}
			else {
				show = 2;
				cursor.y = 8;
			}
		//if (endTitles.creditsY>-endTitles.credits.length && showCredits) endTitles.scroll(0.2,1);
	}
	//if (fade.in) fade.in();
}

let gameMode = mainMenu;//mainMenu or game;

//Основной блок игры-----------------------

load(graphicsFiles);

let timeStart = 0;
function gameLoop(timestamp) {
	//if (timestamp - timeStart >= 0) {
		//начало игрового цикла-----
		//если графика загрузилась, то можно начинать работу
		if (graphicsIsLoaded(graphics,graphicsSumCounter)) {
				gameMode();
		}
		const NOW = performance.now();
		while(times.length > 0 && times[0] <= NOW - 1000) {
			times.shift();
		}
		times.push(NOW)
		fps = times.length;
		drawText(`fps ${fps}`,levelWidth-6,0,graphics[5]);
	//конец игрового цикла-----
	//timeStart = timestamp;
//}
if (engineIsWorking) {
	requestAnimationFrame(gameLoop);
}
}

gameLoop();
