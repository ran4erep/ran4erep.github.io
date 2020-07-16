export let distanceBetween = (x1,y1, x2,y2) => {
			let distanceX = x1-x2;
			let distanceY = y1-y2;
			return Math.sqrt(distanceX*distanceX + distanceY*distanceY);
		}