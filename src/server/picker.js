const crypto = require('crypto')
const fs = require('fs')

module.exports.pickRandomImage = function (files) {
    return files[crypto.randomInt(0, files.length)]
}

module.exports.pick7NeutralImages = function (neutral_dir) {
    const set = new Set()
    // Attention aux dossiers ! S'il y a un sous-dossier alors
    // ce dernier pourrait être tiré au sort, alors qu'il ne
    // le faut pas
    const files = fs.readdirSync(neutral_dir)
    while (Array.from(set.values()).length < 7) {
        set.add(this.pickRandomImage(files))
    }
    return set
}
