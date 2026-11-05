var widthTiles =20;
var tileSize = 20;
var startPoint = {x:10,y:10};

for(var j=0;j<widthTiles;j++){
	for(var i=0;i<widthTiles;i++){
  	$("body").append('<div id="'+i+'-'+j+'"></div>');
  }
}

$("html").mousemove(function(e){
	count = 0;

	var x = Math.floor(e.clientX/tileSize);
  var y = Math.floor(e.clientY/tileSize);
  $("div").removeClass("line");
  $("div").html("")
  drawline(startPoint.x,startPoint.y,x,y)
});

var drawline = function(x0,y0,x1,y1){
	var tmp;
	var steep = Math.abs(y1-y0) > Math.abs(x1-x0);
  if(steep){
  	//swap x0,y0
  	tmp=x0; x0=y0; y0=tmp;
    //swap x1,y1
    tmp=x1; x1=y1; y1=tmp;
  }
  
  var sign = 1;
	if(x0>x1){
    sign = -1;
    x0 *= -1;
    x1 *= -1;
  }
  var dx = x1-x0;
  var dy = Math.abs(y1-y0);
  var err = ((dx/2));
  var ystep = y0 < y1 ? 1:-1;
  var y = y0;
  
  for(var x=x0;x<=x1;x++){
  	if(!(steep ? plot(y,sign*x) : plot(sign*x,y))) return;
    err = (err - dy);
    if(err < 0){
    	y+=ystep;
      err+=dx;
    }
  }
}

var plot = function(x,y){
	$("#"+x+"-"+y).html(count);
  count++;
	$("#"+x+"-"+y).addClass("line");
  return true;
}

