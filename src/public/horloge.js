function runHorloge() {
    const debut = new Date()
    debuter(debut.getTime(), t)
}

function debuter(debut, timer) {
    const d = new Date()
    window.intOffset = timer - (d.getTime() - debut)

    temps.innerHTML = Math.ceil(window.intOffset / 1000)

    const mult = 60000 / t
    window.angle = 0.1048335 * 0.001 * mult * window.intOffset

    if (window.intOffset <= 0) {
        return
    }
    drawHorloge(1)

    window.t = setTimeout(`debuter(${debut}, ${timer})`, 16)
}

function changeColor(angle) {
    angle = 6.29 - angle;
    const r = Math.floor(72 + 55 * angle)
    const b = Math.floor(214 + 14 * angle)

    return (r < 255 || b < 255)
        ? `rgb(${r}, ${b}, 0)`
        : `rgb(${Math.floor(255)}, ${Math.floor(597 - (90 * angle))}, 0)`
}

function drawHorloge(pourcent) {
    const canvas = document.getElementById("horloge")
    const ctx = canvas.getContext("2d")
    const twoPI = Math.PI * 2

    ctx.clearRect(0, 0, 300, 300)

    /*
    ctx.beginPath()
    ctx.globalAlpha = 1
    ctx.arc(150, 150, 140, 0, 6.283, false)
    ctx.arc(150, 150, 105, 6.283, twoPI, true)
    ctx.fillStyle = "#bbb"
    ctx.fill()
    ctx.closePath()
    */

    ctx.beginPath()
    ctx.globalAlpha = 1
    // ctx.arc(150, 150, 140.1, -1.57, (-1.57 + window.angle), false)
    // ctx.arc(150, 150, 105, (-1.57 + window.angle), (twoPI - 1.57), true)
    ctx.fillStyle = changeColor(window.angle)
    
    // new
    ctx.fillRect(10, 50, 65, 400)
    ctx.fillStyle = "#bbb"
    ctx.fillRect(10, 50, 65, 400 * (window.pourcent / 100))
    // end new

    ctx.fill()
    ctx.closePath()

    /*
    ctx.beginPath()
    ctx.arc(150, 150, (105 * pourcent), 0, 6.283, false)
    ctx.fillStyle = "#fff"
    ctx.fill()
    ctx.closePath()
    */
}

const captchat = document.getElementById('captchat')
captchat.innerHTML += `<div id="bloc-horloge">
    <canvas id="horloge" width="300" height="300"></canvas>
    <div id="temps"></div>
</div>`
runHorloge()
