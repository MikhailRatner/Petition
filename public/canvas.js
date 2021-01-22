const canvSig = document.getElementById("canvasSignature");
const inpSigVal = document.getElementById("inputSignature").value;
const ctx = canvSig.getContext("2d");

let drawing = false;
let x = 0;
let y = 0;

canvSig.addEventListener("mousedown", (e) => {
    console.log("mousedown");
    x = e.offsetX;
    y = e.offsetY;
    drawing = true;
});

canvSig.addEventListener("mousemove", (e) => {
    console.log("mouseup");
    if (drawing === true) {
        draw(ctx, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

window.addEventListener("mouseup", (e) => {
    if (drawing === true) {
        draw(ctx, x, y, e.offsetX, e.offsetY);
        x = 0;
        y = 0;
        drawing = false;
        inputSigVal = canvas.toDataURL();
    }
});

function draw(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
}
