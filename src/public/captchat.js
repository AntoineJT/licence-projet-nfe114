(async () => {
    async function req(url) {
        return await fetch(url).then(data => data.text())
    }

    const captchat = document.getElementById("captchat")
    if (captchat === null) {
        console.error("CaptChat: Le captcha n'a pas été placé !")
        return
    }

    (async function reload() {
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
        captchat.innerHTML += '<input type="hidden" disabled name="reload" value="0">'
        captchat.innerHTML += "</div>"

        // add selected image to the field
        const buttons = document.querySelectorAll('.captchat-btn')
        buttons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const selected = btn.getAttribute('value')
                const res = await req(`/api/validate?token=${json.token}&guess=${selected}`)
                alert(JSON.parse(res).success)
            })
        })
    })().then(() => {
        const reloadTrigger = document.querySelector('input[name=reload]')
        reloadTrigger.addEventListener('change', async () => {
            const val = reloadTrigger.getAttribute('value')
            console.log(val)
            if (val != 1)
                return

            reloadTrigger.setAttribute('value', 0)
            await reload()
        })
    })
})()
