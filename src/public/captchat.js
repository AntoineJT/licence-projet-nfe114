(async () => {
    const captchat = document.getElementById("captchat")
    if (captchat === null) {
        console.error("CaptChat: Le captcha n'a pas été placé !")
        return
    }

    const jsonText = await fetch("/api/newsession").then(data => data.text())
    const json = JSON.parse(jsonText)
    // console.log(json)

    captchat.innerHTML += `<h2>Indice : ${json['hint']}</h2>`
    captchat.innerHTML += "<div>"
    // temp scope to destroy index variable
    {
        let index = 0
        for (const item of json.images) {
            captchat.innerHTML += `<button class="w-1/4 captchat-btn" value="${index}"><img src="${item}"></button>`
            ++index
        }
    }
    captchat.innerHTML += `<input type="hidden" name="captchat-token" value="${json.token}">`
    captchat.innerHTML += "</div>"

    // add selected image to the field
    const buttons = document.querySelectorAll('.captchat-btn')
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selected = btn.getAttribute('value')
            // TODO Faire une requête de validationg
            alert(selected)
        })
    })
})()
