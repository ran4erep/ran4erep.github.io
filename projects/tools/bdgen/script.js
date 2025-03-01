//                                       ___                      \\
// |     '       /  |                   /   |                     \\
// /__      ___ (  /   _ __ __ _ _ __  / /| | ___ _ __ ___ _ __   \\
// \\--`-'-|`---\\ |  | '__/ _` | '_ \/ /_| |/ _ \ '__/ _ \ '_ \  \\
//  |' _/   ` __/ /   | | | (_| | | | \___  |  __/ | |  __/ |_) | \\
//  '._  W    ,--'    |_|  \__,_|_| |_|   |_/\___|_|  \___| .__/  \\
//     |_:_._/                                            | |     \\
//                              https://ran4erep.github.io|_|     \\

let date = new Date();
let minYear = date.getFullYear() - 100;
let maxYear = date.getFullYear();
const monthDays = 31;
const februaryDays = 29;
const monthsTotal = 12;
let startDay = 1, startMonth = 1, startYear = minYear;
//для оптимизации скорости генерации
let output = [];
document.getElementById("minInput").placeholder = minYear;
document.getElementById("maxInput").placeholder = maxYear;
document.getElementById("applyButton").addEventListener("click", function() {
	if ( /\d\d\d\d/ig.test(document.getElementById("minInput").value) && 
		parseInt(document.getElementById("minInput").value) <= parseInt(document.getElementById("maxInput").value)) {
		output = [];
		minYear = document.getElementById("minInput").value;
		maxYear = document.getElementById("maxInput").value;
	} else {
		alert("Ошибка ввода");
	}
});

document.getElementById("genButton").addEventListener("click", function() {

//Вариант даты DD/MM/YY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startDay < 10)
					startDay = 0 + startDay;
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startDay + startMonth + startYear);
			}
		}
	}

	//Вариант даты MM/DD/YY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startDay < 10)
					startDay = 0 + startDay;
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startMonth + startDay + startYear);
			}
		}
	}

	//Вариант даты YY/DD/MM
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startDay < 10)
					startDay = 0 + startDay;
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startYear + startDay + startMonth);
			}
		}
	}

	//Вариант даты YY/MM/DD
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startDay < 10)
					startDay = 0 + startDay;
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startYear + startMonth + startDay);
			}
		}
	}

	//Вариант даты DD/M/YY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startDay < 10)
					startDay = 0 + startDay;
				output.push(startDay + startMonth + startYear);
			}
		}
	}

	//Вариант даты M/DD/YY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startDay < 10)
					startDay = 0 + startDay;
				output.push(startMonth + startDay + startYear);
			}
		}
	}

	//Вариант даты YY/DD/M
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startDay < 10)
					startDay = 0 + startDay;
				output.push(startYear + startDay + startMonth);
			}
		}
	}

	//Вариант даты YY/M/DD
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startDay < 10)
					startDay = 0 + startDay;
				output.push(startYear + startMonth + startDay);
			}
		}
	}

	//Вариант даты D/MM/YY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startDay + startMonth + startYear);
			}
		}
	}

	//Вариант даты MM/D/YY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startMonth + startDay + startYear);
			}
		}
	}

	//Вариант даты YY/D/MM
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startYear + startDay + startMonth);
			}
		}
	}

	//Вариант даты YY/MM/D
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startYear + startMonth + startDay);
			}
		}
	}

//Вариант даты D/M/YY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				output.push(startDay + startMonth + startYear);
			}
		}
	}

	//Вариант даты M/D/YY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				output.push(startMonth + startDay + startYear);
			}
		}
	}

	//Вариант даты YY/D/M
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				output.push(startYear + startDay + startMonth);
			}
		}
	}

	//Вариант даты YY/M/D
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				startYear = startYear.match(/\d\d$/ig);
				output.push(startYear + startMonth + startDay);
			}
		}
	}

//-------------------------------------------------------------------

//Вариант даты DD/MM/YYYY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startDay < 10)
					startDay = 0 + startDay;
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startDay + startMonth + startYear);
			}
		}
	}

	//Вариант даты MM/DD/YYYY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startDay < 10)
					startDay = 0 + startDay;
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startMonth + startDay + startYear);
			}
		}
	}

	//Вариант даты YYYY/DD/MM
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startDay < 10)
					startDay = 0 + startDay;
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startYear + startDay + startMonth);
			}
		}
	}

	//Вариант даты YYYY/MM/DD
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startDay < 10)
					startDay = 0 + startDay;
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startYear + startMonth + startDay);
			}
		}
	}

	//Вариант даты DD/M/YYYY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startDay < 10)
					startDay = 0 + startDay;
				output.push(startDay + startMonth + startYear);
			}
		}
	}

	//Вариант даты M/DD/YYYY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startDay < 10)
					startDay = 0 + startDay;
				output.push(startMonth + startDay + startYear);
			}
		}
	}

	//Вариант даты YYYY/DD/M
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startDay < 10)
					startDay = 0 + startDay;
				output.push(startYear + startDay + startMonth);
			}
		}
	}

	//Вариант даты YYYY/M/DD
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= monthDays; day++) {
				if (month === 2 && day > februaryDays)
					continue;
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startDay < 10)
					startDay = 0 + startDay;
				output.push(startYear + startMonth + startDay);
			}
		}
	}

	//Вариант даты D/MM/YYYY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startDay + startMonth + startYear);
			}
		}
	}

	//Вариант даты MM/D/YYYY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startMonth + startDay + startYear);
			}
		}
	}

	//Вариант даты YYYY/D/MM
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startYear + startDay + startMonth);
			}
		}
	}

	//Вариант даты YYYY/MM/D
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= monthsTotal; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				if (startMonth < 10)
					startMonth = 0 + startMonth;
				output.push(startYear + startMonth + startDay);
			}
		}
	}

	//Вариант даты D/M/YYYY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				output.push(startDay + startMonth + startYear);
			}
		}
	}

	//Вариант даты M/D/YYYY
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				output.push(startMonth + startDay + startYear);
			}
		}
	}

	//Вариант даты YYYY/D/M
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				output.push(startYear + startDay + startMonth);
			}
		}
	}

	//Вариант даты YYYY/M/D
	for (let year = minYear; year <= maxYear; year++) {
		for (let month = 1; month <= 9; month++) {
			for (let day = 1; day <= 9; day++) {
				startDay = day.toString();
				startMonth = month.toString();
				startYear = year.toString();
				output.push(startYear + startMonth + startDay);
			}
		}
	}

	console.log(output.length);
	document.getElementById("genResult").innerHTML = output.join("\n") + "\nГенератор нагенерировал " + output.length + " вариантов\nhttps://ran4erep.github.io/bdgen";
	document.getElementById("genResult").style.display = "inline";
	
});
