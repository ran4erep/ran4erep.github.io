//                                       ___                      \\
// |     '       /  |                   /   |                     \\
// /__      ___ (  /   _ __ __ _ _ __  / /| | ___ _ __ ___ _ __   \\
// \\--`-'-|`---\\ |  | '__/ _` | '_ \/ /_| |/ _ \ '__/ _ \ '_ \  \\
//  |' _/   ` __/ /   | | | (_| | | | \___  |  __/ | |  __/ |_) | \\
//  '._  W    ,--'    |_|  \__,_|_| |_|   |_/\___|_|  \___| .__/  \\
//     |_:_._/                                            | |     \\
//                              https://ran4erep.github.io|_|     \\
let date = new Date();
let monthNames = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"]
let currentMonthName = monthNames[date.getMonth()];
document.getElementById("calendarTitle").innerHTML = "Календарь на " + currentMonthName + " " + date.getFullYear() + "-го года";
function daysInMonth() {
	let month = date.getMonth();
	let year = date.getFullYear()
	return 32 - new Date(year,month,32).getDate();
}
function firstDay(year,month) {
	let currentMonth = new Date(year,month,1);
	if (currentMonth.getDay()-1 !== -1)
		return currentMonth.getDay()-1;
	else
		return 6;
}
if (date.getMonth() === 11 || date.getMonth() === 0 || date.getMonth() === 1) {
	document.body.style.backgroundImage = "url(img/winter.jpg)"
}
if (date.getMonth() === 2 || date.getMonth() === 3 || date.getMonth() === 4) {
	document.body.style.backgroundImage = "url(img/spring.jpg)"
}
if (date.getMonth() === 5 || date.getMonth() === 6 || date.getMonth() === 7) {
	document.body.style.backgroundImage = "url(img/summer.jpg)"
}
if (date.getMonth() === 8 || date.getMonth() === 9 || date.getMonth() === 10) {
	document.body.style.backgroundImage = "url(img/fall.jpg)"
}

let startDay = 3;
let daysOnWork = [];
for (let days = 1; days <=11; days++){
	if (startDay<31)
		daysOnWork.push(startDay)
	startDay+=3
}
console.log(daysOnWork)
let dayCounter = 0;
let first = firstDay(date.getFullYear(),date.getMonth());
let currentDay = date.getDate();

for (let day = 0; day < 7; day++) {
	if (day >= first) {
		dayCounter++;
		if (dayCounter === currentDay) {
			document.getElementById("week0").innerHTML = document.getElementById("week0").innerHTML + "<td class=\"currentDay\">" + (dayCounter) + "</td>"
		}
		else if (day === 6) {
			document.getElementById("week0").innerHTML = document.getElementById("week0").innerHTML + "<td style=\"color: red;\" class=\"regularDay\">" + (dayCounter) + "</td>"
		}
		else {
			document.getElementById("week0").innerHTML = document.getElementById("week0").innerHTML + "<td class=\"regularDay\">" + (dayCounter) + "</td>"
		}
	}
	else {
		document.getElementById("week0").innerHTML = document.getElementById("week0").innerHTML + "<td></td>"
	}
}

for (let week = 1; week < 6; week++)
{
	for (let day = 0; day < 7; day++) {
		if (dayCounter < daysInMonth()) {
			dayCounter++;
			if (dayCounter === currentDay) {
				document.getElementById("week" + week).innerHTML = document.getElementById("week" + week).innerHTML + "<td class=\"currentDay\">" + (dayCounter) + "</td>"
			}
			else if (day === 6) {
				document.getElementById("week" + week).innerHTML = document.getElementById("week" + week).innerHTML + "<td style=\"color: red;\" class=\"regularDay\">" + (dayCounter) + "</td>"
			}
			else {
				document.getElementById("week" + week).innerHTML = document.getElementById("week" + week).innerHTML + "<td class=\"regularDay\">" + (dayCounter) + "</td>"
			}
		}
		else {
			document.getElementById("week" + week).innerHTML = document.getElementById("week" + week).innerHTML + "<td></td>"
		}
	}
}
