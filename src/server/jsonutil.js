const fs = require('fs')

module.exports.readOrCreate = function (filePath, defaultContent) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, defaultContent)
        return defaultContent
    }
    return fs.readFileSync(filePath)
}

module.exports.writeData = function (filePath, inRam, token, idToGuess) {
    inRam[token] = idToGuess
    fs.writeFileSync(filePath, JSON.stringify(inRam))
}

module.exports.deleteData = function (filePath, inRam, token) {
    delete inRam[token]
    fs.writeFileSync(filePath, JSON.stringify(inRam))
}
