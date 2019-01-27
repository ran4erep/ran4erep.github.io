let display = document.getElementById("display");
var expression = [];
var width = 24;
var maxDisplayWidth = 0;
var operation;
var formula;

//   /(\d+)|\+|-|×|÷/g
//   /[(×)(÷)]/g

function displayDraw(pressedButton) {
	if (maxDisplayWidth !== width || maxDisplayWidth < 0) {
		expression[maxDisplayWidth] = pressedButton;
		maxDisplayWidth++;
		display.value = "\n" + expression.join("");
		formula = expression.join("");
	}
}

function evaluation(expressionForEvaluation) {
	var replacingSheet = {
		"×": "*",
		"÷": "/",
		"(": "(",
		")": ")"
	};
	expressionForEvaluation = expressionForEvaluation.replace(/[(×)(÷)]/g, function (m) { return replacingSheet[m]; });
	console.log(expressionForEvaluation);
	var result = eval(expressionForEvaluation);
	if (result === Infinity)
		return "Бесконечность ∞";
	else
		return result;
}
/*
for (var i = 0; i < width; i++) {
	expression[i] = " ";
}
*/
display.value = "\n0"

button1.addEventListener("click", function(e) {
	displayDraw(1);
});

button2.addEventListener("click", function(e) {
	displayDraw(2);
});

button3.addEventListener("click", function(e) {
	displayDraw(3);
});

button4.addEventListener("click", function(e) {
	displayDraw(4);
});

button5.addEventListener("click", function(e) {
	displayDraw(5);
});

button6.addEventListener("click", function(e) {
	displayDraw(6);
});

button7.addEventListener("click", function(e) {
	displayDraw(7);
});

button8.addEventListener("click", function(e) {
	displayDraw(8);
});

button9.addEventListener("click", function(e) {
	displayDraw(9);
});

button0.addEventListener("click", function(e) {
	displayDraw(0);
});

buttonDot.addEventListener("click", function(e) {
	if (maxDisplayWidth === 0)
		displayDraw("0.");
	else
		displayDraw(".");
});

buttonC.addEventListener("click", function(e) {
	for (var i = 0; i < width; i++) {
		delete expression[i];
	}
	maxDisplayWidth = 0;
	display.value = "\n0";
});

buttonDel.addEventListener("click", function(e) {
	if (maxDisplayWidth > 0) {
		delete expression[maxDisplayWidth-1];
		maxDisplayWidth--;
	}

	if (maxDisplayWidth === 0)
		display.value = "\n0";
	else
		display.value = "\n" + expression.join("");
});

buttonDivide.addEventListener("click", function(e) {
	operation = "divide";
	displayDraw("÷");
});

buttonMultiply.addEventListener("click", function(e) {
	operation = "multiply";
	displayDraw("×");
});

buttonPlus.addEventListener("click", function(e) {
		operation = "plus";
		displayDraw("+");
});

buttonMinus.addEventListener("click", function(e) {
	operation = "minus";
	displayDraw("-");
});

buttonEqual.addEventListener("click", function(e) {
	display.value = formula + "=\n" + evaluation(formula);
});

buttonBracketOpen.addEventListener("click", function(e) {
	displayDraw("\(");
});

buttonBracketClose.addEventListener("click", function(e) {
	displayDraw("\)");
});

buttonRandom.addEventListener("click", function(e) {
	function rand(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	if (formula.match(/^[\d]+-[\d]+$/)) {
		randResult = formula.split("-");
		display.value = formula + "=\nСлучайное число: " + rand(parseInt(randResult[0]), parseInt(randResult[1]));
	}
	else
		alert("Неверный формат. Для определния случайного числа укажите диапазон в формате «минимальноеЧисло-максимальноеЧисло»");
});
