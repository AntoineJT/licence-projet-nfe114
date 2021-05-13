const assert = require('assert')
const path = require('path')

const datascheme = require('./datascheme')

module.exports.addImagesToSet = function (set, basedir, imgArr) {
    for (const img of imgArr) {
        const filePath = path.join(basedir, img)
        set.add({ name: img, data: datascheme.embed(filePath) })
    }
}

module.exports.findImageIndex = function (arr, imgPath) {
    for (const [index, item] of arr.entries()) {
        if (item['name'] === imgPath) {
            return index
        }
    }
    assert(false, "Aucune image singulière dans l'imageset généré !")
}
