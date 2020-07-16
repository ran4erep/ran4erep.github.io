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

