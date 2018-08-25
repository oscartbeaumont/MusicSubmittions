var colors = new Array([62, 35, 255], [60, 255, 60], [255, 35, 98], [45, 175, 230], [255, 0, 255], [255, 128, 0]),
    step = 0,
    colorIndices = [0, 1, 2, 3],
    gradientSpeed = .002;

function updateGradient() {
    var o = colors[colorIndices[0]],
        e = colors[colorIndices[1]],
        r = colors[colorIndices[2]],
        t = colors[colorIndices[3]],
        c = 1 - step,
        n = "rgb(" + Math.round(c * o[0] + step * e[0]) + "," + Math.round(c * o[1] + step * e[1]) + "," + Math.round(c * o[2] + step * e[2]) + ")",
        s = "rgb(" + Math.round(c * r[0] + step * t[0]) + "," + Math.round(c * r[1] + step * t[1]) + "," + Math.round(c * r[2] + step * t[2]) + ")";
    document.getElementsByTagName("body")[0].style.background = "-webkit-gradient(linear, left top, right top, from(" + n + "), to(" + s + "))", 1 <= (step += gradientSpeed) && (step %= 1, colorIndices[0] = colorIndices[1], colorIndices[2] = colorIndices[3], colorIndices[1] = (colorIndices[1] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length, colorIndices[3] = (colorIndices[3] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length)
}
setInterval(updateGradient, 10);
