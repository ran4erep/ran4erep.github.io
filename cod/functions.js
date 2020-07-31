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


let clearTile = (x, y) => {
	ctx.clearRect(x*tileSize,y*tileSize,tileSize,tileSize);
}

//функция обновления экрана
let update = () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//функция логики игры
let logic = () => {
	if (smokingTimer >= 200 && !isSmoking && !player.isWalking) {
		player.setCurrentAnimation("smoking",5);
		isSmoking = true;
		smokingTimer = 0;
	}
	if (!isSmoking && !player.isWalking) smokingTimer++;
	if (player.isWalking) smokingTimer = 0
		else isSmoking = false;
}

// функция рендеринга изображения
let render = () => {
	for (let i = 0; i < levelWidth; i++) {
		for (let j = 0; j < levelHeight; j++) {
			drawTile(maps[0][i+mapOffsetY][j+mapOffsetX],j,i); // i for Y and j for X
			
			//drawSprite(10,player.x, player.y, graphics[0]);
			if (torch.isNight) {
				//torch.updateLight();
				//torch.placeLight(player.x+0.6,player.y+0.6,30);
			}
		}
	}

	player.animate();
	if (drawMeTheBox) drawBox("just/testing/textbox",4,4);
	//рисуем титры
	 if (endTitles.creditsY>-endTitles.credits.length && showCredits) endTitles.scroll(0.2,1);
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

let drawHud = (hp,panic,weapon,ammo) => {
	let x = 1;
	let y = canvas.height-11;
	let hudGraphics = graphics[6];
	let weaponGraphics = graphics[12];
	let portraitGraphics = graphics[7];

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
}