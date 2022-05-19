let c, ctx, W, H, arr = [];

const random = (max=1, min=0) => Math.random() * (max - min) + min;

const rp = (a,b,c) => a+(b-a)*c;

const flag = () => {
    ctx.fillStyle = '#005BBB';
    ctx.fillRect(W/2-150, H/2-100, 300, 100);
    ctx.fill();
    ctx.fillStyle = '#FFD500';
    ctx.fillRect(W/2-150, H/2, 300, 100);
    ctx.fill();   
    ctx.fillStyle = 'white';
    ctx.font = "lighter 50px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RAN4EREP", W/2, H/2+150);
};

const arrFlag = () => {
    let m=ctx.getImageData(0,0,W,H);
    for(let i=0; i<m.data.length; i+=4) {
        let a = m.data[i+2]>0 ? m.data[i+2]>200&&m.data[i+2]>200? random(6.28): random(3.14):random(6.28,3.14)
        let rad = m.data[i+2]>200&&m.data[i+2]>200?random(60):100   
        arr.push(i/4%W,~~(i/4/W),m.data[i],m.data[i+1],m.data[i+2],m.data[i+3],m.data[i+2]>0?W/2+rad*Math.cos(a):i/4%W,m.data[i+2]>0?H/2-100+rad*Math.sin(a):~~(i/4/W),rad+2*Math.cos(a),a,random(1.3,0.7),0.02);            
    }
};

const uk = () => {
    var m=ctx.createImageData(W,H);
    for(let i=0; i<arr.length; i+=12) {
    let j=~~(Math.round(arr[i+6])+Math.round(arr[i+7])*W)*4
        m.data[j]=arr[i+2] 
        m.data[j+1]=arr[i+3]
        m.data[j+2]=arr[i+4]
        m.data[j+3]=arr[i+5]        
        if(arr[i+8]>0&&arr[i+3]>0){
            arr[i+9]+=arr[i+11]
            arr[i+8]-=arr[i+10]
            arr[i+6]=W/2+arr[i+8]* Math.cos(arr[i+9])
            arr[i+7]=100+arr[i+8]*Math.sin(arr[i+9])
        }
        else{
            arr[i+6]=rp(arr[i+6],arr[i],0.02)
            arr[i+7]=rp(arr[i+7],arr[i+1],0.02)
        }    
    }
    ctx.putImageData(m,0,0);
};

const animate = () => {
    uk();
    requestAnimationFrame(animate);
};

const init = () => {
    c = document.getElementById("canvas");
    c.width = W = window.innerWidth;
    c.height = H = window.innerHeight-400;
    ctx = c.getContext("2d");
    flag()
    arrFlag();
    animate();
};

onload = init;
