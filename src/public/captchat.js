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

    const jsonText = await req("/i/newsession")
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
                <canvas id="horloge" width="50" height="370"></canvas>
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
            const res = await req(`/i/validate?token=${json.token}&guess=${selected}`)
            success = JSON.parse(res).success
            console.log(success)
            if (success) {
                const horloge = document.getElementById('bloc-horloge')
                horloge.style.display = 'none'
                horloge.parentElement.innerHTML += "<p>Captcha réussi</p>"
                return
            }
            captchat_reload_err()
            runHorloge()
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

// HORLOGE
const refreshTime = 10000
let t = refreshTime + 20000

let horlogeTimeouts = []

function runHorloge() {
    // Destruction des anciens timeout pour éviter
    // des conflits au niveau de l'affichage et
    // du rafraichissement
    for (const timeout of horlogeTimeouts) {
        clearTimeout(timeout)
    }
    debuter(new Date().getTime())
}

function debuter(debut) {
    if (success)
        return

    const d = new Date()
    window.intOffset = t - (d.getTime() - debut)

    temps.innerHTML = Math.ceil(window.intOffset / 1000)

    const mult = 60000 / t
    window.angle = 0.1048335 * 0.001 * mult * window.intOffset

    if (window.intOffset <= 0) {
        captchat_reload_err()
        runHorloge()
        return
    }
    const pourcent =  ((d.getTime() - debut) * 100) / t
    drawHorloge(pourcent)

    horlogeTimeouts.push(setTimeout(`debuter(${debut})`, 16))
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

    ctx.clearRect(0, 0, 300, 300)

    ctx.beginPath()
    ctx.globalAlpha = 1
    ctx.fillStyle = changeColor(window.angle)

    ctx.fillRect(0, 40, 65, 300)
    ctx.fillStyle = "#bbb"
    ctx.fillRect(0, 40, 65, 300 * (pourcent / 100))

    ctx.fill()
    ctx.closePath()
}
// END HORLOGE
