async function captchat_reload () {
    async function req(url) {
        return await fetch(url).then(data => data.text())
    }

    const captchat = document.getElementById("captchat")
    if (captchat === null) {
        console.error("CaptChat: Le captcha n'a pas été placé !")
        return
    }

    captchat.innerHTML = ''

    const jsonText = await req("/api/newsession")
    const json = JSON.parse(jsonText)
    // console.log(json)

    captchat.innerHTML += `<h2>Indice : ${json['hint']}</h2>`
    captchat.innerHTML += "<div>"
    // temp scope to destroy index variable
    {
        let index = 0
        for (const item of json.images) {
            captchat.innerHTML += `<button class="captchat-btn" value="${index}"><img src="${item}"></button>`
            ++index
        }
    }
    captchat.innerHTML += `<input type="hidden" name="captchat-token" value="${json.token}">`
    captchat.innerHTML += "</div>"

    // add selected image to the field
    const buttons = document.querySelectorAll('.captchat-btn')
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const selected = btn.getAttribute('value')
            const res = await req(`/api/validate?token=${json.token}&guess=${selected}`)
            const success = JSON.parse(res).success
            if (!success) {
                // on supprime le refresh automatique
                // lorsque le captchat est réussi
                clearInterval(refresh)
                alert('Vous êtes humain !')
                return
            }
            captchat_reload_err()
        })
    })
}
captchat_reload()

// réduit le temps de 5s
function captchat_reload_err() {
    t = Math.max(refreshTime, t - 5000)
    captchat_reload()
}

const refreshTime = 10000
let t = refreshTime + 20000

const refresh = window.setTimeout(() => window.setInterval(() => captchat_reload_err(), refreshTime), t - refreshTime)
