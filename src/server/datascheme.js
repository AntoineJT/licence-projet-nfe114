const fs = require('fs')
const mime = require('mime')

function base64encode(str) {
    return Buffer.from(str, 'utf-8').toString('base64')
}

module.exports.embed = function (filePath) {
    const data = fs.readFileSync(filePath)
    const b64data = base64encode(data)
    // Here is the spec : https://datatracker.ietf.org/doc/html/rfc2397
    return `data:${mime.getType(filePath)};base64,${b64data}`
}
