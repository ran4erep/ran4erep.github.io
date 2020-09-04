//                                          ___                      \\
//    |     '       /  |                   /   |                     \\
//    /__      ___ (  /   _ __ __ _ _ __  / /| | ___ _ __ ___ _ __   \\
//    \\--`-'-|`---\\ |  | '__/ _` | '_ \/ /_| |/ _ \ '__/ _ \ '_ \  \\
//     |' _/   ` __/ /   | | | (_| | | | \___  |  __/ | |  __/ |_) | \\
//     '._  W    ,--'    |_|  \__,_|_| |_|   |_/\___|_|  \___| .__/  \\
//        |_:_._/                                            | |     \\
//                                                           |_|     \\

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
let drawText = (text, x, y, fontFile, c) => {
	(c) ? c = c : c = "tile";
	let textFontRaw = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", " ", ".", ",", "!", "?", "A", "B", "X", "Y", "L", "R", "U", "D", "Q", "E", "T", "Y", "Z", "S", "C", "/"];
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

	if (c === "tile") {
		for (let i=0; i < textSize; i++) {
			let characterToDraw = outputText[i];
			ctx.drawImage(fontFile,characterToDraw,0,spriteSize, spriteSize, (x*tileSize)+(i*tileSize), y*tileSize, tileSize, tileSize);
		}
	}
	if (c === "pixel") {
		for (let i=0; i < textSize; i++) {
			let characterToDraw = outputText[i];
			ctx.drawImage(fontFile,characterToDraw,0,spriteSize, spriteSize, x+i*tileSize, y, tileSize, tileSize);
		}
	}
}

//функция отрисовки тайлов
let drawTile = (tileNumber, x, y, tileset, opacity) => {
	if (tileset === undefined) tileset = graphics[4];
	if (opacity === undefined) opacity = 1;
	//ctx.save();
	//ctx.globalAlpha = opacity;
	ctx.drawImage(
		tileset,tileNumber*spriteSize,0,spriteSize,spriteSize,x*tileSize, y*tileSize, tileSize, tileSize
		);
	//ctx.restore();
}

//функция отрисовки тайлов
let drawSprite = (tileNumber, x, y, tileset, opacity) => {
	if (tileset === undefined) tileset = graphics[4];
	if (opacity === undefined) opacity = 1;
	//ctx.save();
	//ctx.globalAlpha = opacity;
	ctx.drawImage(
		tileset,tileNumber*spriteSize,0,spriteSize,spriteSize,x, y, tileSize, tileSize
		);
	//ctx.restore();
}


let clearTile = (x, y) => {
	ctx.clearRect(x*tileSize,y*tileSize,tileSize,tileSize);
}

//функция обновления экрана
let update = () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

let fullscreen = () => {
	if(screen.orientation.type === "landscape-primary" || screen.orientation.type === "landscape-secondary") {
		canvas.style.left = `${(window.innerWidth/2)-(parseInt(canvas.style.width.replace("px",""))/2)}px`;
		canvas.style.width =  `${window.innerHeight}px`;
		canvas.style.height = `${window.innerHeight}px`;
	}
	if(screen.orientation.type === "portrait-primary" || screen.orientation.type === "portrait-secondary") {
		canvas.style.width =  `${window.innerWidth}px`;
		canvas.style.height = `${window.innerWidth}px`;
	}
}

//функция логики игры
let logic = () => {
	
	//fullscreen();
	//large maps optimization
	mapSize = maps[currentMap].length;
	(player.atTileX - viewDistance < 0)  ?
	viewport.x.min = 0    
	: viewport.x.min = player.atTileX - viewDistance;

	(player.atTileX + viewDistance > mapSize) ?
	viewport.x.max = mapSize 
	: viewport.x.max = player.atTileX + viewDistance;

	(player.atTileY - viewDistance < 0)  ? 
	viewport.y.min = 0    
	: viewport.y.min = player.atTileY - viewDistance;

	(player.atTileY + viewDistance > mapSize) ?
	viewport.y.max = mapSize
	: viewport.y.max = player.atTileY + viewDistance;

	//smoking
	if (smokingTimer >= 200 && !isSmoking && !player.isWalking && !player.isDead) {
		player.setCurrentAnimation("smoking",5);
		isSmoking = true;
		smokingTimer = 0;
	}
	if (!isSmoking && !player.isWalking) smokingTimer++;
	if (player.isWalking) smokingTimer = 0
		else isSmoking = false;
	//--------
	//zombie.AI();

	for (let x = viewport.x.min; x < viewport.x.max; x++) {
		for (let y = viewport.y.min; y < viewport.y.max; y++) {
			if (player.facing === "n" && 
				collisionMap[y][player.atTileX].y+collisionMap[y][player.atTileX].height === player.y+player.collisionBox.y) {
				player.y += 1;
				camera.y -= 1;
				camera.ty -= 1;
			}

			if (player.facing === "s" &&
				collisionMap[y][player.atTileX].y === ((player.y+player.collisionBox.y)+player.collisionBox.height)+1 ) {
				player.y -= 1;
				camera.y += 1;
				camera.ty += 1;
			}
			if (player.facing === "w" && collisionMap[player.atTileY][x].x+collisionMap[player.atTileY][x].width === (player.x+player.collisionBox.x) ) {
				player.x += 1;
				camera.x -= 1;
				camera.tx -= 1;
			}
			if (player.facing === "e" && collisionMap[player.atTileY][x].x === (player.x+player.collisionBox.x)+player.collisionBox.width ) {
				player.x -= 1;
				camera.x += 1;
				camera.tx += 1;
			}

		}
	}

}


// функция рендеринга изображения
let render = () => {
	ctx.fillStyle = "black";
	ctx.fillRect(0,0,canvas.width,canvas.height);
	for (let x = viewport.x.min; x < viewport.x.max; x++) {
		for (let y = viewport.y.min; y < viewport.y.max; y++) {
			
			drawSprite(maps[currentMap][y][x],(x*spriteSize)+camera.x,(y*spriteSize)+camera.y);
			ctx.strokeStyle = "blue";
			ctx.strokeRect(
				collisionMap[y][x].x + camera.x,
				collisionMap[y][x].y + camera.y,
				collisionMap[y][x].width,
				collisionMap[y][x].height);

			if (torch.isNight) {
				//torch.updateLight();
				//torch.placeLight(player.x+0.6,player.y+0.6,30);
			}
		}
	}

	zombie.render();
	sveta.render();

	for (let x = viewport.x.min; x < viewport.x.max; x++) {
		for (let y = viewport.y.min; y < viewport.y.max; y++) {
			//drawing the light from lightmap
			//ctx.save();
			//ctx.globalCompositeOperation = "multiply";
			if (lightMap[y][x] > 0) {
				//ctx.fillStyle = `rgba(${r},${g},${b},0.5)`;
				ctx.fillStyle = `rgba(${lightMap[y][x]*20+r},${lightMap[y][x]*20+g},${lightMap[y][x]*20+b},0.2)`;
				ctx.fillRect( (x*spriteSize)+camera.x, (y*spriteSize)+camera.y, 8,8 );
			}
			//ctx.restore();
			if (lightMap[y][x] === 0) {
				ctx.fillStyle = "rgb(50,50,50)";
				ctx.fillRect( (x*spriteSize)+camera.x, (y*spriteSize)+camera.y, 8,8 );
			}
		}
	}

	//рисуем титры
	 if (endTitles.creditsY>-endTitles.credits.length && showCredits) endTitles.scroll(0.2,1);
	 
	 if (minimapToggle) minimap();

	 //тайловые координаты игрока с учётом камеры и спауна:
	 //player.atTileX*8-camera.tx, player.atTileY*8+camera.ty

	 //players's tile position visualization
	 ctx.strokeStyle = palette[3].hex;
	 ctx.strokeRect( (player.x+camera.x)+player.collisionBox.x,
	 				 (player.y+camera.y)+player.collisionBox.y,
	 				  player.collisionBox.width,
	 				  player.collisionBox.height);
	 player.render();
	 
	 lightMap = newMap(maps[currentMap].length, 0)
	 for(let i=0; i<16; i++) {
	 	raycast(player.atTileX,player.atTileY,(player.atTileX-7)+i,player.atTileY-7);
	 }
	 for(let i=0; i<16; i++) {
	 	raycast(player.atTileX,player.atTileY,player.atTileX-7,(player.atTileY-7)+i);
	 }
	 for(let i=0; i<16; i++) {
	 	raycast(player.atTileX,player.atTileY,(player.atTileX-7)+15,(player.atTileY-7)+i);
	 }
	 for(let i=0; i<16; i++) {
	 	raycast(player.atTileX,player.atTileY,(player.atTileX-7)+i,(player.atTileY-7)+15);
	 }
	 
	 //castLine(zombie.x+4,zombie.y+4, player.x+4,player.y+4);


	 drawHud(100,100,12*3,20);

}
let part;
let array = [];
let isDead = false;

let switchColor = (x,y,w,h,fromColor,toColor,alpha) => {
	(!alpha) ? alpha = 255 : alpha = alpha;
	let r1, g1, b1, fromRGB = palette[fromColor].rgb.split(",");
	r1 = parseInt(fromRGB[0]), g1 = parseInt(fromRGB[1]), b1 = parseInt(fromRGB[2]);

	let r2, g2, b2, toRGB = palette[toColor].rgb.split(",");
	r2 = parseInt(toRGB[0]), g2 = parseInt(toRGB[1]), b2 = parseInt(toRGB[2]);

	let colorData = ctx.getImageData(x,y,w,h);
	
	for(let i=0; i<colorData.data.length; i+=4) {
		if (colorData.data[i] === r1 && colorData.data[i+1] === g1 && colorData.data[i+2] === b1) {
			colorData.data[i]   = r2;
			colorData.data[i+1] = g2;
			colorData.data[i+2] = b2;
			colorData.data[i+3] = alpha;
		}
	}
	ctx.putImageData(colorData,x,y);
}

let te = (x,y) => {
	let data = ctx.getImageData(x,y,tileSize,tileSize);
	let arr = [];
	for(let i=0; i<data.data.length; i+=4) {
		let obj = {
			r:data.data[i],
			g:data.data[i+1],
			b:data.data[i+2],
			a:data.data[i+3]
		};
		arr.push(obj);
	}
	return arr;
}

let getMinimapColor = (tile) => {
	if (!tile) return false;
	let sheet = [
		{
			tiles: [14,32],
			color: palette[0].rgb
		},
		{
			tiles: [],
			color: palette[1].rgb
		},
		{
			tiles: [11,12],
			color: palette[2].rgb
		},
		{
			tiles: [2],
			color: palette[3].rgb
		},
		{
			tiles: [15,30,24,31,28,29,26,27],
			color: palette[4].rgb
		},
		{
			tiles: [6,7],
			color: palette[5].rgb
		},
		{
			tiles: [34],
			color: palette[6].rgb
		},
		{
			tiles: [],
			color: palette[7].rgb
		},
		{
			tiles: [],
			color: palette[8].rgb
		},
		{
			tiles: [],
			color: palette[9].rgb
		},
		{
			tiles: [],
			color: palette[10].rgb
		},
		{
			tiles: [19,22],
			color: palette[11].rgb
		},
		{
			tiles: [],
			color: palette[12].rgb
		},
		{
			tiles: [3,16,17,18],
			color: palette[13].rgb
		},
		{
			tiles: [],
			color: palette[14].rgb
		},
		{
			tiles: [],
			color: palette[15].rgb
		},
	];
	for (let color=0; color < sheet.length; color++) {
		for (let _tile=0; _tile<sheet[color].tiles.length; _tile++) {
			if (tile === sheet[color].tiles[_tile]) return `rgba(${sheet[color].color},0.8)`;
		}
	}
	return sheet[7].color;
};

let drawMinimapSector = () => {
	for(let i=0; i<levelWidth; i++) {
		for(let j=0; j<levelHeight; j++) {
			ctx.fillStyle = getMinimapColor(maps[0][j][i]);
			ctx.fillRect(i,j,1,1);
		}
	}
	ctx.fillStyle = palette[8].hex;
	ctx.fillRect(Math.floor(player.x/tileSize),Math.floor(player.y/tileSize),1,1);

}


let Fade = function() {
	this.fia = 1;
	this.foa = 0;

	this.in = () => {
		ctx.fillStyle = "rgba(" + palette[0].rgb + "," + this.fia +")";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		return (this.fia>0) ? this.fia-=0.01 : false;
	}

	this.out = () => {
		ctx.fillStyle = "rgba(" + palette[0].rgb + "," + this.foa +")";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		return (this.foa<1) ? this.foa+=0.01 : false;
	}
}
let fade = new Fade();

let globalTimer = 0;
let wait = (time) => {
	globalTimer++;
	return (globalTimer >= time) ? true : false;
}

let makeScreenshot = () => {
	let bufferCanvas = document.createElement("canvas");
	let buffer = bufferCanvas.getContext("2d");
	bufferCanvas.width = canvas.width*4;
	bufferCanvas.height = canvas.height*4;
	buffer.imageSmoothingEnabled = false;
	buffer.drawImage(canvas,0,0, bufferCanvas.width, bufferCanvas.height);
	let a = document.createElement("a");
	a.setAttribute("download", "CoD_screenshot.png");
	a.setAttribute("href", bufferCanvas.toDataURL("image.png").replace("image/png", "image/octet-stream"));
	a.click();
}

let minimap = () => {
	let bufferCanvas = document.createElement("canvas");
	let buffer = bufferCanvas.getContext("2d");
	bufferCanvas.width = canvas.width;
	bufferCanvas.height = canvas.height;
	buffer.imageSmoothingEnabled = false;
	for(let x=0; x<32; x++) {
		for(let y=0; y<32; y++) {
			buffer.globalAlpha = 0.7;
			buffer.drawImage(graphics[4],maps[1][y][x]*spriteSize,0,spriteSize,spriteSize,x*4, y*4, 4,4);
		}
	}
	let x = player.x/2, y = player.y/2;
	let rectX = x-32, rectY = y-32;
	buffer.drawImage(graphics[0],0,0,8,8,x,y,8,8);
	buffer.strokeStyle = palette[11].hex;
	buffer.strokeRect(rectX,rectY,64,64);
	buffer.strokeStyle = palette[8].hex;
	buffer.strokeRect(0,0,128,128);
	ctx.drawImage(bufferCanvas,0,0,64,64);
}

let drawHud = (hp,panic,weapon,ammo) => {
	let x = 1;
	let y = canvas.height-11;
	let hudGraphics = graphics[6];
	let weaponGraphics = graphics[12];
	let portraitGraphics = graphics[7]; //7

	ctx.fillStyle = palette[13].hex;
	ctx.fillRect(x,y, canvas.width-2,10);
	ctx.strokeStyle = palette[1].hex;
	ctx.strokeRect(0,canvas.height-12, canvas.width,11);

	if (player.facing === "w") drawSprite(0,x,y+1,portraitGraphics);
	if (player.facing === "e") drawSprite(4,x,y+1,portraitGraphics);
	if (player.facing === "n") drawSprite(8,x,y+1,portraitGraphics);
	if (player.facing === "s") drawSprite(9,x,y+1,portraitGraphics);
	drawSprite(0,x+16,y+1,hudGraphics);
	drawText(`${hp.toString()}/${panic.toString()}`,24,y+1,graphics[2],"pixel");
	drawSprite(weapon,80,y+1,weaponGraphics);
	drawSprite(weapon+1,88,y+1,weaponGraphics);
	drawSprite(weapon+2,96,y+1,weaponGraphics);
	drawText(ammo.toString(),104,y+1,graphics[2],"pixel");
};

let dist = (x1,y1, x2,y2) => Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));

let plot = (x,y) => {
	ctx.fillStyle = `rgba(255,0,0,0.5)`;
	ctx.fillRect(x,y,1,1);
}

let castLine = (x0,y0, x1,y1) => {
			let dx = Math.abs(x1-x0);
			let dy = Math.abs(y1-y0);
			let sx = (x0 < x1) ? 1 : -1;
			let sy = (y0 < y1) ? 1 : -1;
			let err = dx - dy;

			while(true) {
				(x0 < 0) ? 0 : x0 = x0;
				(y0 < 0) ? 0 : y0 = y0;
				(x1 < 0) ? 0 : x1 = x1;
				(y1 < 0) ? 0 : y1 = y1;
				if( maps[currentMap][Math.floor(y0/8)][Math.floor(x0/8)] === 41) {
					cantSee = true;
					break;
				};
				plot(x0+camera.x,y0+camera.y);
				cantSee = false;

				if((x0===x1) && (y0===y1)) break;
				let e2 = 2*err;
				if(e2 > -dy) {err -= dy; x0 += sx;}
				if(e2 < dx) {err += dx; y0 += sy;}
			}
};

//tilesetProperties.tiles[maps[currentMap][x][y]].properties[0].value
let hitTheWall = (x,y) => (tilesetProperties.tiles[maps[currentMap][x][y]].properties[0].value === true) ? true : false;

let raycast = (x0,y0, x1,y1) => {
	(x1 < 0) ? x1 = 0 : x1 = x1;
	(y1 < 0) ? y1 = 0 : y1 = y1;
	(x1 > maps[currentMap].length-1) ? x1 = maps[currentMap].length-1 : x1 = x1;
	(y1 > maps[currentMap].length-1) ? y1 = maps[currentMap].length-1 : y1 = y1;
	let dx = Math.abs(x1-x0);
	let dy = Math.abs(y1-y0);
	let sx = (x0 < x1) ? 1 : -1;
	let sy = (y0 < y1) ? 1 : -1;
	let err = dx - dy;
	let alpha = 1.0;

	while(true) {
		let light = Math.floor(dist( player.atTileX,player.atTileY, x0,y0) );
		//if (maps[currentMap][y0][x0] === 41) break;
		if ( hitTheWall(y0, x0) ) {
			lightMap[y0][x0] = 11-light;
			break;
		}
		//limited field of view
		//if ( Math.floor(dist(player.atTileX,player.atTileY,x0,y0)) > LOSFOV ) break;

		//plot(x0, y0,1);
		alpha -= 0.01;
		lightMap[y0][x0] = 11-light;
		lightMap[player.atTileY][player.atTileX] = 7;
		//lightMap[y0][x0] = 0.6-(Math.floor(dist( player.atTileX,player.atTileY, x0,y0) )/8);

		if((x0===x1) && (y0===y1)) break;
		let e2 = 2*err;
		if(e2 > -dy) {err -= dy; x0 += sx;}
		if(e2 < dx) {err += dx; y0 += sy;}
	}
};

let onKonamiCode = (callback) => {
	const konamiCode = "uuddlrlrba";
	document.addEventListener("touchstart", function(e) {
		konamiInput += ("" + pressedButton);
		if (konamiInput === konamiCode) return callback();
		if (!konamiCode.indexOf(konamiInput)) return;
		konamiInput = ("" + pressedButton);
	});
};

onKonamiCode(() => {
	document.getElementById("consoleWrapper").classList.toggle("hide");
})