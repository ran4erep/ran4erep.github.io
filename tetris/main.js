/*_____   _  _   
 |  __ \| || |     GOVNO
 | |__) | || |_       CODE
 |  _  /|__   _|        STUDIOS
 | | \ \   | |  
 |_|  \_\  |_|*/
 
 /*
	Список того что нужно сделать:
	   1). Рандомная генерация фигур ✅
	 	 2). Повороты фигур ✅
	   3). Управление свайпами  ✅
	   4). Функции для софтдропа  ✅
	 	 5). Функция для харддропа ✅
	   6). Коллизия по бокам фигуры ✅
		 7). Начисление очков ✅
		 8). Увеличение сложности по ходу игры ✅
		 9). Стирание нижних рядов при заполнении ✅
		 10). Доделать обесцвечивание закрепившихся блоков ✅
		 11). Сделать ghost pieces ❌
		 12). Сделать Game Over
 */
 
//Graphics
let block = new Image();
block.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAC1JREFUKFNjZGBg+M+ABzCCFMSH+2NVsnDlRga4AhAHGYA00VsBNlfC3YDPmwCq1SYB/MvrCgAAAABJRU5ErkJggg==";
let empty = new Image();
empty.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAACJJREFUKFNj/H9m1X8GPIARpCCheylWJQtKoxmGjgJ83gQA/twtqU9deHcAAAAASUVORK5CYII=";
let ghost = new Image();
ghost.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAACFJREFUKFNjZGBg+M+ABzCCFMSH+2NVsnDlRoahowCfNwFtuxoBXWlpLgAAAABJRU5ErkJggg==";

//Pieces creation
let pieceSpawnCenter = {
	"T" : -2,
	"O" : -1,
	"L" : -2,
	"J" : -1,
	"S" : -1,
	"Z" : -1,
	"I" : -1
};

pieces = {
  "T" : [
  		
      [1,1,1],
      [0,1,0],
      [0,0,0]
    ],
  "O": [
        [1, 1],
        [1, 1]
      ],
  "L": [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1]
      ],
  "J": [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0]
      ],
  "S": [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ],
  "Z": [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ],
  "I": [
        [0,1,0,0],
        [0,1,0,0],
        [0,1,0,0],
        [0,1,0,0]
      ],
};

//Initialization
let c = document.getElementById("canvas");
let ctx = c.getContext("2d");
let debug = document.getElementById("debug");
let scoreText = document.getElementById("scoreText");
//Scaler
let gameScale = 2;
//c.width = c.width * gameScale;
//c.height = c.height * gameScale;
c.width = window.innerWidth - 20;
c.height = window.innerHeight -80;
ctx.imageSmoothingEnabled = false;
//Dimensions
let levelWidth = 10;
let levelHeight = 20;
let blockWidth = c.width / levelWidth;
let blockHeight = c.height / levelHeight;

let currentPiece = pickRandomPiece();
let originalRotation = pieces[currentPiece];
let nextPiece = pickRandomPiece();
let X = Math.floor((levelWidth/2)) + pieceSpawnCenter[currentPiece], Y = 0;
let ghostX = X, ghostY = levelHeight - pieces[currentPiece].length;
let canRotate = true;
let hardDrop = false;
let score = 0;
let level = 1;
let linesForLevelUp = 10;
let maximumLevel = 28;
let maximumSpeed = 40;
let linesTotal = 0;

//Arena creation
let arena = [];
for (column = 0; column < levelHeight; column++) {
	arena[column] = [];
	for (row = 0; row < levelWidth; row++) {
		arena[column][row] = 0;
		if(column === levelHeight-1) {
			arena[column][row] = 2;
		}
	}
};

///Controls

let swipeStartX = 0;
let swipeStartY = 0;
let swipeEndX = 0;
let swipeEndY = 0;
let swipeDuration = 0;
let swipedLeft = false, swipedRight = false;
c.addEventListener("touchstart", function(e) {
	swipeStartX = e.touches[0].clientX;
	swipeStartY = e.touches[0].clientY;
});
c.addEventListener("touchmove", function(e) {
	swipeEndX = e.touches[0].clientX;
	swipeEndY = e.touches[0].clientY;
	swipeDuration += 1;
});
c.addEventListener("touchend", function(e) {
	e.preventDefault();
	if (!hardDrop && !isGameOver()) {
	if (swipeEndX < swipeStartX-20 && swipeDuration> 1) {
		X -= 1;
		ghostX -= 1;
		if (pieceIsOutOfBounds(pieces[currentPiece]) === "left") {
			X += 1;
			ghostX += 1;
		}
		if (collision() === "withPiece") {
			X += 1
			ghostX += 1;
		};
		swipeDuration = 0;
		draw();
	} else if(swipeEndX > swipeStartX+20 && swipeDuration > 1) {
		//Swipe right
			X += 1;
			ghostX += 1;
			if (pieceIsOutOfBounds(pieces[currentPiece]) === "right") {
				X -= 1;
				ghostX -= 1;
			}
			if(collision() === "withPiece") {
				X -= 1
				ghostX -= 1;
			};
			swipeDuration = 0;
			draw();
	} else if (swipeEndY < swipeStartY - 20 && swipeDuration > 1) {
		//Swipe up
		hardDrop = true;
		swipeDuration=0;
	}
	else if (swipeEndY > swipeStartY + 20 && swipeDuration > 1) {
		//Swipe down
		//dropPiece();
		dropPiece();
		score += 1;
		gameTimer = 0;
		draw();
		//timeStart = 0;
		swipeDuration=0;
	} else if (swipeDuration <= 1 && canRotate) {
		//Regular touch
		let buffer = rotate(pieces[currentPiece]);
		while(pieceIsOutOfBounds(buffer) === "left") {
			X+= 1;
		}
		while (pieceIsOutOfBounds(buffer) === "right") {
			X -= 1;
		}
		if (!rotationCollision(buffer) )
			pieces[currentPiece] = buffer;
		draw();
		swipeDuration = 0;
	}
}
}
);

//Functions
function draw() {
  //Clear screen
  ctx.clearRect(0, 0, c.width, c.height);
  //Rendering arena
  for (y = 0; y < levelHeight; y++) {
    for (x = 0; x < levelWidth; x++) {
    	if (arena[y][x] === 1) {
    		ctx.drawImage(block, x * blockWidth, y * blockHeight, blockWidth, blockHeight);
    			fadeBlock(x*blockWidth,y*blockHeight);
    		}
    	if (arena[y][x] === 0 ||
    			arena[y][x] === 2) {
    		ctx.drawImage(empty, x * blockWidth, y * blockHeight, blockWidth, blockHeight)
    	}
    }
  }
  //Rendering dropping piece
  for (i = 0; i < pieces[currentPiece].length; i++) {
    for (j = 0; j < pieces[currentPiece][0].length; j++) {
      if (pieces[currentPiece][i][j] !== 0) {
        ctx.drawImage(block,
        (X*blockWidth)  + (j*blockWidth),
        (Y*blockHeight) + (i*blockHeight),
        blockWidth, blockHeight);
      }
    }
  }
};

function random(min, max) {
	let rand = min + Math.random() * (max + 1 - min);
	rand = Math.floor(rand);
	return rand;
};

function pickRandomPiece() {
	let piece = "";
	let pieces = ["T","O","L","J","S","Z","I"];
	for (i = 0; i < pieces.length; i++) {
		piece = pieces[random(0,pieces.length-1)];
	}
	return piece;
};

function merge() {
	for (i = 0; i < pieces[currentPiece].length; i++) {
		for (j = 0; j < pieces[currentPiece][0].length; j++) {
			if (pieces[currentPiece][i][j] === 1) {
				arena[Y+i][X+j] = 1;
			}
		}
	}
};

function rotationCollision(buffer) {
	for (i = 0; i < buffer.length; i++) {
		for (j = 0; j < buffer[0].length; j++) {
			if (buffer[i][j] === 1) {
				if (arena[Y + i][(X + j)] === 1) {
					return true;
				}
			}
		}
	}
};

function collision() {
	for (i = 0; i < pieces[currentPiece].length; i++) {
		for (j = 0; j < pieces[currentPiece][0].length; j++) {
			if (pieces[currentPiece][i][j] === 1) {
				if (arena[Y + i][(X + j)] === 1) {
					return "withPiece";
				}
				if (arena[Y + i][(X + j)] === 2) {
					return "withBottom";
				}
			}
		}
	}
};

function pieceIsOutOfBounds(buffer) {
	let middle = levelWidth/2;
	
	if (X < middle) {
		for (i = 0; i < buffer.length; i++) {
			for (j = 0; j < buffer[0].length; j++) {
				if (buffer[i][j] === 1) {
					if(arena[Y+i][X+j] === undefined) {
						return "left";
					}
				}
			}
		}
	}
	
	if (X > middle) {
		for (i = 0; i < buffer.length; i++) {
			for (j = 0; j < buffer[0].length; j++) {
				if (buffer[i][j] === 1) {
					if (X+j === levelWidth) {
						return "right";
					}
				}
			}
		}
	}
};

function isGameOver() {
	for (i = 0; i < pieces[currentPiece].length; i++) {
		for (j = 0; j < pieces[currentPiece][0].length; j++) {
			if (pieces[currentPiece][i][j] === 1) {
				if (arena[0][X + j] === 1) {
					return true;
				}
			}
		}
	}
};

function dropPiece() {
	canRotate = false;
	if (isGameOver())
		console.log("GAME OVER");
	Y += 1;
	if (hardDrop)
		score += 2;
	if(collision() === "withPiece") {
		Y -= 1;
		merge();
		hardDrop = false;
		clearLines();
		pieces[currentPiece] = originalRotation;
		currentPiece = nextPiece;
		nextPiece = pickRandomPiece();
		while (nextPiece === currentPiece)
			nextPiece = pickRandomPiece();
		originalRotation = pieces[currentPiece];
		Y = 0;
		X = Math.floor((levelWidth/2)) + pieceSpawnCenter[currentPiece];
	}
	if (collision() === "withBottom") {
		merge();
		hardDrop = false;
		clearLines();
		pieces[currentPiece] = originalRotation;
		currentPiece = nextPiece;
		nextPiece = pickRandomPiece();
		while (nextPiece === currentPiece)
			nextPiece = pickRandomPiece();
		originalRotation = pieces[currentPiece];
		Y = 0;
		X = Math.floor((levelWidth/2)) + pieceSpawnCenter[currentPiece];
	}
	canRotate = true;
};

function ghostPiece() {
	if(collision() ) {
		ghostY = ghostY-pieces[currentPiece].length;
	} else {
		ghostY = levelHeight - pieces[currentPiece].length;
	}
};

function fadeBlock(x, y) {
	let buffer = ctx.getImageData(x, y, blockHeight, blockWidth);
	let data = buffer.data;

	for (var i = 0; i < data.length; i += 4) {
		data[i] = data[i] -30; // red
		data[i + 1] = data[i + 1] -30; // green
		data[i + 2] = data[i + 2] -30; // blue
	}
	ctx.putImageData(buffer, x, y);
};

function rotate(matrix) {
	const N = matrix.length - 1;
	const result = matrix.map((row, i) =>
		row.map((val, j) => matrix[N - j][i])
	);
	return result;
};

function clearLines() {
	let lines = [];
	
	for (var y = levelHeight-1; y >= 0; y--) {
		let numberOfBlocks = 0;
		
		for (var x = 0; x < levelWidth; x++) {
			if(arena[y][x] !== 0 && arena[y][x] !== 2) {
				numberOfBlocks += 1;
			}
		}
		
		if (numberOfBlocks === 0) {
			break;
		} else if (numberOfBlocks < levelWidth) {
			continue;
		} else if (numberOfBlocks === levelWidth) {
			lines.unshift(y);
		}
	}
	
	
	for (let index of lines) {
		arena.splice(index,1);
		arena.unshift(new Array(levelWidth).fill(0));
	}
	
	for (x = 0; x < levelWidth; x++) {
		if(arena[levelHeight-1][x] === 0)
			arena[levelHeight-1][x] = 2;
	}
	
	for (let index of lines) {
		linesTotal += 1;
	}
	if ((linesTotal > 0 && linesTotal % linesForLevelUp === 0) || linesTotal > linesForLevelUp) {
		level += 1;
		linesTotal -= linesForLevelUp;
		currentSpeed = currentSpeed - (maximumSpeed / maximumLevel);
	}
	console.log(`Lines cleared: ${linesTotal} :: Current level: ${level} :: Current speed: ${currentSpeed}`)
	
	if (lines.length === 1) {
		score = score + (100*level);
	} else if(lines.length === 2) {
		score = score + (300*level);
	} else if(lines.length === 3) {
		score = score + (500*level);
	} else if(lines.length === 4) {
		score = score + (800*level);
	}
};
draw();
//Main game loop
let timeStart = 0;
let gameTimer = 0;
let gameSpeed = 40;
let currentSpeed = 40;
//60 max, 28 levels
function update(timestamp) {
	if (!isGameOver()) {
		scoreText.innerHTML = `Score: ${score}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Level: ${level}<br>Current Piece: ${currentPiece}<br>Next piece: ${nextPiece}`;
		
		if (hardDrop)
			gameSpeed = 1;
		else gameSpeed = currentSpeed;
		gameTimer++;
		
	  //if (timestamp - timeStart >= 500) {
	  if (gameTimer >= gameSpeed) {
	  dropPiece();
	  draw();
	  gameTimer = 0;
	  timeStart = timestamp;
	  }
	  requestAnimationFrame(update);
	}
};

update();
