function rand(min, max) {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    rand = Math.round(rand);
    return rand;
  }

let buttons = document.getElementsByClassName('buttonNumber');
let playerNumber = 0;
let pcNumber = rand(1,10);
let isDone = true;
let wins = 0, looses = 0, games = 0;
document.getElementById("numb").innerHTML = pcNumber;
document.getElementById("score").innerHTML = "Угадано чисел: " + wins + "<br>Не угадано чисел: " + looses + "<br>Процент побед составляет 0%";
for (var i = 0; i < buttons.length; i++) {
	buttons[i].addEventListener("click", function (e) {
		document.getElementById("numb").innerHTML = pcNumber;
		if (isDone) {
			document.getElementById("text").innerHTML = "";
			document.getElementById("hide").classList.remove("animClose");
			document.getElementById("hide").classList.add("anim");
			playerNumber = parseInt(e.target.innerHTML)
			if (playerNumber === pcNumber) {
				isDone = false;
				setTimeout(function() {
					document.getElementById("hide").classList.remove("anim");
					document.getElementById("hide").classList.add("animClose");
					document.getElementById("text").innerHTML = "Вы угадали число которое я загадал";
					pcNumber = rand(1,10);
					wins++;
					games++;
					document.getElementById("score").innerHTML = "Угадано чисел: " + wins + "<br>Не угадано чисел: " + looses + "<br>Процент побед составляет " + winrate(wins, games) + "%";
					isDone = true;
				}, 2000)
			}
			else {
				isDone = false;
				setTimeout(function() {
					document.getElementById("hide").classList.remove("anim");
					document.getElementById("hide").classList.add("animClose");
					document.getElementById("text").innerHTML = "Вы не угадали число которое я загадал";
					pcNumber = rand(1,10);
					looses++;
					games++;
					document.getElementById("score").innerHTML = "Угадано чисел: " + wins + "<br>Не угадано чисел: " + looses + "<br>Процент побед составляет " + winrate(wins, games) + "%";
					isDone = true;
				}, 2000)
			}
		}
	})
}
function winrate(wins, allGames) {
	return Math.round(wins / allGames * 100);
}

console.log(buttons);