let notes = {
	"C": 261.6,
	"C#": 277.2,
	"D": 293.7,
	"Eb": 311.1,
	"E": 329.6,
	"F": 349.2,
	"F#": 370.0,
	"G": 392.0,
	"G#": 415.3,
	"A": 440.8,
	"Bb": 466.2,
	"B": 493.9
};
let currentOctave = "4";
let octaveRadio = document.getElementsByClassName("octaveRadio");
for (let i = 0; i < octaveRadio.length; i++) {
	octaveRadio[i].addEventListener("click", function(e) {
		currentOctave = e.target.value;
	});
}

audioOn.addEventListener("click", async function(e) {
	await Tone.start();
	document.getElementById("apiEnable").style.display = "none";
});

let synth = new Tone.PolySynth(16).toMaster();

//действие по клику по клавише
let keys = document.getElementsByClassName('key');
for (let i = 0; i < keys.length; i++) {
	keys[i].addEventListener("touchstart", function(e) {
		e.preventDefault();
		playNote(e.target.dataset.key);
		if (e.target.classList[1] === "white")
			e.target.classList.add("pressedWhite");
		else
			e.target.classList.add("pressedBlack");
	});
	keys[i].addEventListener("touchend", function(e) {
		e.preventDefault();
		stopPlayingNote(e.target.dataset.key);
		if (e.target.classList[1] === "white")
			e.target.classList.remove("pressedWhite");
		else
			e.target.classList.remove("pressedBlack");
	});
	keys[i].addEventListener("mousedown", function(e) {
		playNote(e.target.dataset.key);
	});
	keys[i].addEventListener("mouseup", function(e) {
		stopPlayingNote(e.target.dataset.key);
	});
}

// Напишем названия нот на самих нотах из даты
for (let i = 0; i < keys.length; i++) {
	keys[i].innerHTML = keys[i].dataset.key;
}

function playNote(note) {
	synth.triggerAttack(note + currentOctave);
}
function stopPlayingNote(note) {
	synth.triggerRelease(note + currentOctave);
}
