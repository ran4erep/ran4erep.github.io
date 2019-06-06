//                                       ___                      \\
// |     '       /  |                   /   |                     \\
// /__      ___ (  /   _ __ __ _ _ __  / /| | ___ _ __ ___ _ __   \\
// \\--`-'-|`---\\ |  | '__/ _` | '_ \/ /_| |/ _ \ '__/ _ \ '_ \  \\
//  |' _/   ` __/ /   | | | (_| | | | \___  |  __/ | |  __/ |_) | \\
//  '._  W    ,--'    |_|  \__,_|_| |_|   |_/\___|_|  \___| .__/  \\
//     |_:_._/                                            | |     \\
//                              https://ran4erep.github.io|_|     \\

let canvas = document.getElementById("canvas");
let c = canvas.getContext("2d");
let level = [
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,1,1,1,0,0,0],
	[0,0,0,1,1,1,1,1,0,0],
	[0,0,1,0,0,0,0,0,1,0],
	[0,0,1,1,0,0,1,0,1,0],
	[0,0,1,0,0,0,0,0,1,0],
	[0,0,1,0,0,0,0,0,1,0],
	[0,0,1,1,1,1,1,1,1,0],
	[0,0,1,0,1,0,1,0,1,0],
	[0,0,0,0,0,0,0,0,0,0]
]
let userField = new Array(level.length);
for (var i = 0; i < userField.length; i++) {
	userField[i] = new Array(level[0].length);
}
for (var i = 0; i < userField[0].length; i++) {
	for (var j = 0; j < userField.length; j++) {
		userField[j][i] = 0;
	}
}
let blockSize = 30;
let gridXLength = level[0].length;
let gridYLength = level.length;
canvas.width = ( (blockSize * gridXLength) + gridXLength ) + 1;
canvas.height = ( (blockSize * gridYLength) + gridYLength ) + 1;
let width = canvas.width;
let height = canvas.height;
let horizontalLines = [], verticalLines = [];
let topBar = document.getElementById("topBar");
let leftBar = document.getElementById("leftBar");
let leftBarWidth = 0;
let topBarHeight = 0;
let mode = "drawDot";
let isClicked = false;
let cross = new Image();
cross.src = "img/cross.png";

canvas.addEventListener("mousedown", function(e) {
	isClicked = true;
	e.preventDefault();
	let touchX = Math.floor(e.offsetX / blockSize);
	let touchY = Math.floor(e.offsetY / blockSize);
	if (mode === "drawDot")
		userField[touchY][touchX] = 1;
	else
		userField[touchY][touchX] = 2;

	if (userField[touchY][touchX] === 1 || userField[touchY][touchX] === 2)
		userField[touchY][touchX] = 0;
	draw();
});
canvas.addEventListener("mouseup", function(e) {
	isClicked = false;
	e.preventDefault();
});
canvas.addEventListener("mousemove", function(e) {
	e.preventDefault();
	let touchX = Math.floor(e.offsetX / blockSize);
	let touchY = Math.floor(e.offsetY / blockSize);
	if (mode === "drawDot" && isClicked)
		userField[touchY][touchX] = 1;
	else if (mode === "drawCross" && isClicked)
		userField[touchY][touchX] = 2;
	draw();
});
canvas.addEventListener("touchstart", function(e) {
	e.preventDefault();
	let offset = canvas.getBoundingClientRect();
	let touchX = Math.floor(e.changedTouches[0].clientX - offset.left);
	let touchY = Math.floor(e.changedTouches[0].clientY - offset.top);
	touchX = Math.floor(touchX/blockSize);
	touchY = Math.floor(touchY/blockSize);
	if (mode === "drawDot")
		userField[touchY][touchX] = 1;
	else
		userField[touchY][touchX] = 2;

	if (userField[touchY][touchX] === 1 || userField[touchY][touchX] === 2)
		userField[touchY][touchX] = 0;
	draw();
});
canvas.addEventListener("touchend", function(e) {
	e.preventDefault();
});
canvas.addEventListener("touchmove", function(e) {
	e.preventDefault();
	let offset = canvas.getBoundingClientRect();
	let touchX = Math.floor(e.changedTouches[0].clientX - offset.left);
	let touchY = Math.floor(e.changedTouches[0].clientY - offset.top);
	touchX = Math.floor(touchX/blockSize);
	touchY = Math.floor(touchY/blockSize);
	if (mode === "drawDot")
		userField[touchY][touchX] = 1;
	else
		userField[touchY][touchX] = 2;
	/*if (mode === "drawCross")
		userField[touchY][touchX] = 2;
	else
		userField[touchY][touchX] = 0;*/
	draw();
});
toggleX.addEventListener("click", function(e) {
	if (mode === "drawDot") {
		mode = "drawCross";
		document.getElementById("toggleX").innerHTML = "<span style=\"color: red;\">&cross;</span>";
	}
	else {
		mode = "drawDot";
		document.getElementById("toggleX").innerHTML = "&#x25a0;"
	}
});

//retrieving lines from game field
for (var i = 0; i < level[0].length; i++) {
	let temp = [];
	for (var j = 0; j < level.length; j++) {
		temp[j] = level[j][i]
		if (j === level.length-1)
			verticalLines[i] = temp;
	}
}
for (var i = 0; i < level.length; i++) {
	horizontalLines[i] = level[i];
}

//scanning lines for dots number
function scanningForNumbers(line, isVert) {
	let counter = 0, output = [];
	if ( line.every(function(e) {
		return e === 0;
	}) ) {
		return 0;
	}
	if ( line.every(function(e) {
		return e === 1;
	}) ) {
		return line.length;
	}
	for (var i = 0; i < line.length; i++) {
		if (line[i] === 1) {
			counter++;
			if (i === line.length-1)
				output.push(counter);
		}
		if (line[i] === 0 && counter !==0) {
			output.push(counter);
			counter = 0;
		}
	}
	if (!isVert) return output.join(" ");
	else return output.join("<br>")
}

	//displaying number of dots on left and top sides of canvas
	for (var i = 0; i < horizontalLines.length; i++) {
		let temp = document.createElement("div");
		temp.innerHTML = scanningForNumbers(horizontalLines[i], false);
		temp.className = "leftNumbers";
		temp.style.height = blockSize + "px";
		leftBar.appendChild(temp);
	}
	for (var i = 0; i < verticalLines.length; i++) {
		let temp = document.createElement("div");
		temp.innerHTML = scanningForNumbers( verticalLines[i], true );
		temp.className = "topNumbers";
		temp.style.width = blockSize + "px";
		topBar.appendChild(temp);
	}

function draw() {
	
	for (var i = 0; i < level[0].length; i++) {
		for (var j = 0; j < level.length; j++) {
			if (userField[j][i] === 1) {
				c.fillStyle = "#000000";
				c.fillRect( (i * (blockSize+1)) + 1, (j * (blockSize+1)) + 1, blockSize, blockSize);
			}
			if (userField[j][i] === 0) {
				c.fillStyle = "#e4e4e4";
				c.fillRect( (i * (blockSize+1)) + 1, (j * (blockSize+1)) + 1, blockSize, blockSize);
			}
			if (userField[j][i] === 2) {/*
				c.fillStyle = "#e4e4e4";
				c.clearRect( (i * (blockSize+1)) + 1, (j * (blockSize+1)) + 1, blockSize, blockSize);
				c.fillRect( (i * (blockSize+1)) + 1, (j * (blockSize+1)) + 1, blockSize, blockSize);
				c.strokeStyle = "#c51829";
				c.beginPath();
				c.moveTo( (i*blockSize) + (blockSize/2), (j*blockSize) + (blockSize/2) );
				c.lineTo( (i*blockSize) + blockSize/2, (j*blockSize)+blockSize/2 );
				c.stroke();
				c.beginPath();
				c.moveTo( (i*blockSize)+blockSize,j*blockSize);
				c.lineTo( i*blockSize, (j*blockSize) + blockSize );
				c.stroke();*/
				//c.fillRect( (i * (blockSize+1)) + 1, (j * (blockSize+1)) + 1, blockSize, blockSize);
				c.drawImage(cross, (i * (blockSize+1)) + 1, (j * (blockSize+1)) + 1, blockSize, blockSize);
			}
		}
	}
	document.getElementById("topBar").style.width = width + "px";
	document.getElementById("topBar").style.left = (document.getElementById("leftBar").clientWidth + 2) + "px";
}
draw();

console.dir(document.getElementById("leftBar"))
//debug into console
console.log(width + "/" + height);