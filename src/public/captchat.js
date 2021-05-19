async function captchat_reload () {
    async function req(url) {
        return fetch(url).then(data => data.text())
    }

    const captchat = document.getElementById("captchat")
    if (captchat === null) {
        console.error("CaptChat: Le captcha n'a pas été placé !")
        return
    }

    const captmain = document.getElementById("captchat-main")

    if (captmain !== null)
        captmain.innerHTML = ''

    const jsonText = await req("/api/newsession")
    const json = JSON.parse(jsonText)
    // console.log(json)

    {
        let buffer = captmain === null ? '<div id="captchat-main">' : ''
        buffer += `<h2>Indice : ${json['hint']}</h2>`
        buffer += '<div>'
        // temp scope to destroy index variable
        {
            let index = 0
            for (const item of json.images) {
                buffer += `<button class="captchat-btn" value="${index}"><img src="${item}"></button>`
                ++index
            }
        }
        buffer += `<input type="hidden" name="captchat-token" value="${json.token}">`
        buffer += "</div></div>"

        // if first run
        if (captmain === null) {
            buffer += `<div id="bloc-horloge">
                <canvas id="horloge" width="300" height="300"></canvas>
                <div id="temps"></div>
            </div>`
            captchat.innerHTML = buffer
        } else {
            captmain.innerHTML += buffer
        }
    }

    // add selected image to the field
    const buttons = document.querySelectorAll('.captchat-btn')
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const selected = btn.getAttribute('value')
            const res = await req(`/api/validate?token=${json.token}&guess=${selected}`)
            success = JSON.parse(res).success
            console.log(success)
            if (success) {
                // on supprime le refresh automatique
                // lorsque le captchat est réussi
                clearInterval(refresh)
                alert('Vous êtes humain !')
                const horloge = document.getElementById('bloc-horloge')
                horloge.style.display = 'none'
                horloge.parentElement.innerHTML += "<p>Captcha réussi</p>"
                return
            }
            captchat_reload_err()
        })
    })
}

let temps
let success = false

captchat_reload().then(_ => {
    temps = document.getElementById('temps')

    runHorloge()
})

// réduit le temps de 5s
function captchat_reload_err() {
    t = Math.max(refreshTime, t - 5000)
    captchat_reload()
}

const refreshTime = 10000
let t = refreshTime + 20000

// HORLOGE

function runHorloge() {
    const debut = new Date()
    debuter(debut.getTime(), t)
}

function debuter(debut, timer) {
    if (success)
        return

    const d = new Date()
    window.intOffset = timer - (d.getTime() - debut)

    temps.innerHTML = Math.ceil(window.intOffset / 1000)

    const mult = 60000 / t
    window.angle = 0.1048335 * 0.001 * mult * window.intOffset

    if (window.intOffset <= 0) {
        captchat_reload_err()
        runHorloge()
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
// END HORLOGE