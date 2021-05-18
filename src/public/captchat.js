async function captchat_reload() {
    async function req(url) {
        return await fetch(url).then(data => data.text())
    }

    const captchat = document.getElementById("captchat")
    if (captchat === null) {
        console.error("CaptChat: Le captcha n'a pas été placé !")
        return
    }

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

    captchat.innerHTML += '<canvas id="horloge" width="300" height="300"></canvas>'
    captchat.innerHTML += '<div id="temps"></div>'

    captchat.innerHTML += `<input type="hidden" name="captchat-token" value="${json.token}">`
    captchat.innerHTML += "</div>"

    // add selected image to the field
    const buttons = document.querySelectorAll('.captchat-btn')
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const selected = btn.getAttribute('value')
            const res = await req(`/api/validate?token=${json.token}&guess=${selected}`)
            // TODO faire un timer
            // TODO Utiliser la réponse pour réduire timer
            // TODO Reload
            alert(JSON.parse(res).success)
        })
    })
}

(async() => await captchat_reload())()
