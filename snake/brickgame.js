function SHOW(node) {
    var mountNodeId = 'snake';
    document.getElementById(mountNodeId).appendChild(node);
}
//функция святого рандомчика
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//функция очистки для ROT
function cls() {
	for (var i=0; i<=width; i++) {
		for (var j=0; j<=height; j++) {
			display.draw(i, j, " ", "#000000");
		}
	}
}
//функция русского склонения слов для цифр
function trueWordForm (num, word1, word2, word5) {
	num = Math.abs(num) % 100;
	numX = num % 10;
	if (num > 10 && num <20)
		return word5;
	if (numX > 1 && numX < 5)
		return word2;
	if (numX === 1)
		return word1;
	return word5;
}



//управление игрой
function input() {
	//управление с клавиатуры
	document.addEventListener('keydown', function(e) {
		switch (e.keyCode) {
			case 68 :
			case 39 :
			direction = 1;
			break;

			case 65 :
			case 37 :
			direction = 2;
			break;

			case 87 :
			case 38 :
			direction = 3;
			break;

			case 83 :
			case 40 :
			direction = 4;
			break;

		}
	})
	//управление при помощи тачскрина/мыши
buttonRight.addEventListener('click', function(e) {
	direction=1;
});
buttonLeft.addEventListener('click', function(e) {
	direction=2;
});
buttonUp.addEventListener('click', function(e) {
	direction=3;
});
buttonDown.addEventListener('click', function(e) {
	direction=4;
});
}

//логика
function logic() {
//логика создания хвоста
	var prevX = tailX[0];
	var prevY = tailY[0];
	var prev2X, prev2Y;
	tailX[0]=x;
	tailY[0]=y;
	for (var i=1; i<tail; i++) {
		prev2X=tailX[i];
		prev2Y=tailY[i];
		tailX[i]=prevX;
		tailY[i]=prevY;
		prevX=prev2X;
		prevY=prev2Y;
	}
//что делать при движении в выбранном направлении
if (!gameOver) {

	switch (direction) {
	case 1 :
	if (moveState !== "left") {
	x++;
	moveState = "right";
	
}
	break;

	case 2 :
	if (moveState !== "right") {
	x--;
	moveState = "left";
	
}
	break;

	case 3 :
	if (moveState !== "down") {
	y--;
	moveState = "up";
	
}
	break;

	case 4 :
	if (moveState !== "up") {
	y++;
	moveState = "down";
	
}
	break;

}
//не даём змейке двигаться в обратном направлении
if (direction === 4 && moveState === "up")
	y--;
if (direction === 3 && moveState === "down")
	y++;
if (direction === 1 && moveState === "left")
	x--;
if (direction === 2 && moveState === "right")
	y++;
}

//змейка выходит с другого конца карты
if (optionsWall === 0) {
	if (y>19)
		y=0;
	if (y<0)
		y=19;
	if (x>19)
		x=0;
	if (x<0)
		x=19;
}
//если включены стены, то уже не выходит, вместо этого игра окончена
else {
	if (y>18)
		gameOver = true;
	if (y<1)
		gameOver = true;
	if (x>18)
		gameOver = true;
	if (x<1)
		gameOver = true;
}

//что делать когда игра закончилась (змея укусила свой хвост)
for (var i=0; i<tail; i++) {
		if (tailX[i] == x && tailY[i] == y) {
			gameOver = true;
			}
	}


//сбор фруктов
if (x === fruitX && y === fruitY) {
	if (optionsWall === 1) {
		fruitX = rand(1, 18);
		fruitY = rand(1, 18);
		score++;
		tail++;
		ecWgZYOY4hZb++;
	} else {
	fruitX = rand(0, 19);
	fruitY = rand(0, 19);
	score++;
	tail++;
	ecWgZYOY4hZb++;
}
}

//запрещаем еде спавниться на теле змейки
for (var i=0; i<tail; i++) {
	while (fruitX === tailX[i] && fruitY === tailY[i]) {
			if (optionsWall === 1) {
				fruitX = rand(1, 18);
				fruitY = rand(1, 18);
				if (tail === (width*height)- 76)
				break;
			} else {
	fruitX = rand(0, 19);
	fruitY = rand(0, 19);
	if (tail === width*height)
		break;
}
	}
}
//запрещаем еде спавниться на голове змейки
while (fruitX === x && fruitY === y) {
	if (optionsWall === 1) {
		fruitX = rand(1, 18)
		fruitY = rand(1, 18)
		if (tail === (width*height)-76)
		break;
	} else {
	fruitX = rand(0, 19);
	fruitY = rand(0, 19);
	if (tail === width*height)
		break;
}
}
			//установка скорости игры
	switch (optionsSpeed) {
		case "slow" :
		gameSpeed = 300;
		break;

		case "medium" :
		gameSpeed = 200;
		break;

		case "fast" :
		gameSpeed = 100;
		break;

		case "veryFast" :
		gameSpeed = 0;
		break;
	}


	//if (score > 400 || tail > 400)
		//document.location.href = "/na";
}



//инициализация
var display;
var optionsWall = document.getElementById("chooseWall");
var optionsSpeed = document.getElementById("chooseSpeed");
var gameOver;
var moveState = null;
var gameSpeed;
var width = 20, height =20;
var x, y, fruitX, fruitY, score, tail;
var direction = 0;
var timeStart = 0;
var tail = 0;
var tailX = [], tailY = [];
var tailDraw;
var R, G, B;
var colors = ["#FF0000", "#FFA500", "#FFFF00", "#00FF00", "#00BFFF", "#0000FF", "#9400D3"];
var isSent;
var ecWgZYOY4hZb = 0;
var optionsStyle = "brickGame";

//рендеринг консоли
if (optionsStyle === "ASCII") {
	display = new ROT.Display({width:width, height:height, spacing: 0.8, forceSquareRatio:true, bg:"#D8D8D3"});
}
if (optionsStyle === "brickGame") {
	var tileSet = document.createElement("img");
	tileSet.src = "brickgame.png";
	var options = {
		layout: "tile",
		bg: "transparent",
		tileWidth: 16,
		tileHeight: 16,
		tileSet: tileSet,
		tileMap: {
			"@": [0, 0],
			"#": [0, 0],
			" ": [16, 0],
			".": [16, 0],
			"O": [0, 0],
			"o": [0, 0]
		},
		width: width,
		height: height,
	}
	display = new ROT.Display(options);
}
SHOW(display.getContainer());
//первоначальная настройка
gameOver = false;
gameSpeed = 300;
x = width/2;
y = height/2;
fruitX = rand(1, 18);
fruitY = rand(1, 18);
score = 0;
optionsWall = 0;
optionsSpeed = "slow";
isSent = false;
//главная функция
function update(timestamp){
	//игровой таймер, который регулирует скорость игры
	if (timestamp - timeStart >= gameSpeed) {
		logic();
for (var i=0; i<height; i++) {
	for(var j=0; j<width; j++) {
		//опциональные стены
		if (optionsWall === 1) {
		display.draw(0, i, "#", "#000000");
		display.draw(j, 0, "#", "#000000");
	}
		//рендеринг головы змеи и фруктов
		if (i==y && j==x) {
				display.draw(j, i, "O", "#177245");
		}
		else if (i==fruitY && j==fruitX) {
			display.draw(j, i, "@", "#DE3163");
		}
		//рендеринг хвоста
		else {
			tailDraw = false;
			for (var k=0; k<tail; k++) {
				if (tailX[k]==j && tailY[k]==i) {
					tailDraw=true;
						display.draw(j, i, "o");
					
				}
			}
			if (!tailDraw) {
				display.draw(j, i, " ", "#000000");
			//опциональные стены
			if (optionsWall === 1) {
		display.draw(width-1, i, "#", "#000000");
		display.draw(j, height-1, "#", "#000000");
	}
			}
		}
		//вывод дебаговой информации
		//display.drawText(0, 0, `%c{red}${fruitX}`, "#000000");
		//display.drawText(0, 1, `%c{red}${fruitY}`, "#000000");
	}
}



//вывод очков в HTML документ
if (score > 0)
	document.getElementById("score").innerHTML = "Ваш результат: " + score + " " + trueWordForm(score, "очко", "очка", "очков");
else
	document.getElementById("score").innerHTML = "Пока не набрано ни одного очка";


//добавляем события, которые берут значения у раскрывающихся списков в HTML документе

	chooseWall.addEventListener("change", function(e) {
	optionsWall = parseInt(e.target.value);
});

	chooseSpeed.addEventListener('change', function(e) {
		optionsSpeed = e.target.value;
});



	
	//что делать при проигрыше

	if (gameOver === true) {
	cls();
	display.drawText(rand(0, 11), rand(0,19), "%b{red}%c{white}GAME OVER");
	direction = 0;
	gameSpeed = 1000;
	document.getElementById("score").innerHTML = "Вы закончили игру с результатом в " + score + " " + trueWordForm(score, "очко", "очка", "очков");
	if (isSent === false) {
		$.post("scoring.php", {score: score}, function(data) {
			console.log("variable was sent");
			isSent = true;
	});
	}
			//cancelAmimationRequest(update);
}

//что делать при сборе 400 фруктов (на экране нет свободного места)
if (optionsWall === 0) {
if (tail === width*height && score === width*height) {
	cls();
	display.drawText(rand(0, 13), rand(0,19), "%b{green}%c{white}YOU WIN");
	direction = 0;
	gameOver = true;
	gameSpeed = 1000;
	document.getElementById("score").innerHTML = "Вы закончили игру с результатом в " + score + " " + trueWordForm(score, "очко", "очка", "очков");
	if (isSent === false) {
		$.post("scoring.php", {score: score}, function(data) {
			console.log("variable was sent");
			isSent = true;
		});
	}
}
}

//собрано 324 фруктов (когда включена стена, места становится меньше на 76 точек)
if (optionsWall === 1 ) {
	if (tail === (width*height)- 76 && score === (width*height)- 76) {
	cls();
	display.drawText(rand(0, 13), rand(0,19), "%b{green}%c{white}YOU WIN");
	direction = 0;
	gameOver = true;
	gameSpeed = 1000;
	document.getElementById("score").innerHTML = "Вы закончили игру с результатом в " + score + " " + trueWordForm(score, "очко", "очка", "очков");
	if (isSent === false) {
		$.post("scoring.php", {score: score}, function(data) {
			console.log("variable was sent");
			isSent = true;
		});
	}
}
}

		timeStart = timestamp;
	}

requestAnimationFrame(update);
}

	input();
	update();