//                                          ___                      \\
//    |     '       /  |                   /   |                     \\
//    /__      ___ (  /   _ __ __ _ _ __  / /| | ___ _ __ ___ _ __   \\
//    \\--`-'-|`---\\ |  | '__/ _` | '_ \/ /_| |/ _ \ '__/ _ \ '_ \  \\
//     |' _/   ` __/ /   | | | (_| | | | \___  |  __/ | |  __/ |_) | \\
//     '._  W    ,--'    |_|  \__,_|_| |_|   |_/\___|_|  \___| .__/  \\
//        |_:_._/                                            | |     \\
//                                                           |_|     \\

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
canvas.width = 128;
canvas.height = 128;
// if(screen.orientation.type === "landscape-primary" || screen.orientation.type === "landscape-secondary") {
// 	canvas.style.left = `${(window.innerWidth/2)-(parseInt(canvas.style.width.replace("px",""))/2)}px`;
// 	canvas.style.width =  `${window.innerHeight}px`;
// 	canvas.style.height = `${window.innerHeight}px`;
// }
// if(screen.orientation.type === "portrait-primary" || screen.orientation.type === "portrait-secondary") {
// 	canvas.style.width =  `${window.innerWidth}px`;
// 	canvas.style.height = `${window.innerWidth}px`;
// }
let levelWidth = 16;
let levelHeight = 16;
let spriteSize = 8;
let tileSize = canvas.width / levelWidth;
let root = "data/";
let graphicsFiles = ["alex.png", "zombie_female.png", "font.png", "heart.png", "tileset.png", "font_inverted.png", "hud.png", "alex_portrait.png", "fich_portrait.png", "cars.png", "logo.png", "sveta_portrait.png", "weapons.png", "font_logo.png", "title_picture.png"];
let graphics = [];
let graphicsSumCounter = 0, allGraphicsLoaded = false, graphicsLoadingProgress = 0;
let times = [];
let fps;
let logoX = 1, logoY = 4;

let palette = [
	{rgb : "0,0,0",       hex : "#000000"}, //0
	{rgb : "29,43,83",    hex : "#1D2B53"}, //1
	{rgb : "126,37,83",   hex : "#7E2553"}, //2
	{rgb : "0,135,81",    hex : "#008751"}, //3
	{rgb : "171,82,54",   hex : "#AB5236"}, //4
	{rgb : "95,87,79",    hex : "#5F574F"}, //5
	{rgb : "194,195,199", hex : "#C2C3C7"}, //6
	{rgb : "255,241,232", hex : "#FFF1E8"}, //7
	{rgb : "255,0,77",    hex : "#FF004D"}, //8
	{rgb : "255,163,0",   hex : "#FFA300"}, //9
	{rgb : "255,236,39",  hex : "#FFEC27"}, //10
	{rgb : "0,228,54",    hex : "#00E436"}, //11
	{rgb : "41,173,255",  hex : "#29ADFF"}, //12
	{rgb : "131,118,156", hex : "#83769C"}, //13
	{rgb : "255,119,168", hex : "#FF77A8"}, //14
	{rgb : "255,204,170", hex : "#FFCCAA"}, //15
];

let alex_animations = [
	{name : "breathingLeft", frames : [0,1]},
	{name : "breathingRight", frames : [2,3]},
	{name : "smoking", frames : [4,5,6,7,8,9]},
	{name : "walkingLeft", frames : [10,11,12,13]},
	{name : "walkingRight", frames : [14,15,16,17]},
	{name : "walkingUp", frames : [18,19,20,21]},
	{name : "walkingDown", frames : [22,23,24,25]},
	{name : "talkingLeft", frames : [26,27]},
	{name : "talkingRight", frames : [28,29]},
	{name : "death", frames : [30,31,32,33,34,35,36]},
	{name : "breathingUp", frames : [37,38]},
	{name : "breathingDown", frames : [39,40]}
];

let zombie_animations = [
	{name : "walkingLeft", frames  : [0,1,2,3]},
	{name : "walkingRight", frames : [4,5,6,7]},
	{name : "walkingUp", frames    : [8,9,10,11]},
	{name : "walkingDown", frames  : [12,13,14,15]}
]

let smokingTimer = 0;
let isSmoking = false;
let mapOffsetX = 0;
let mapOffsetY = 0;
let tileOffsetX = 0;
let tileOffsetY = 0;

let minimapToggle = false;
let keyboardKeyAnimationFix = 0;
let viewport = {
	x : {
		min: 0,
		max: 32
	},
	y : {
		min: 0,
		max: 32
	}
};
let viewDistance = 10;
let mapSize = 32;
let currentMap = 1;
let pressedButton;
let konamiInput = "";
let LOSFOV = 5;
let r = 50, g = 50, b = 50;
let tilesetProperties;

let loadJSON = (file) => {
	let requestURL = file;
	let request = new XMLHttpRequest();
	request.open('GET', requestURL);
	request.responseType = 'json';
	request.send();
	request.onload = function() {
		tilesetProperties = request.response;
	}
}

loadJSON("tileset.json");
let cantSee = true;

//alert("No Save and Restore version");
alert("Out of for loop version");