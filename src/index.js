const fs = require('fs')
const path = require('path')

const fastify = require('fastify')({ logger: false })
const mime = require('mime')

const BASE_DIR = 'dataset'
const NEUTRAL_DIR = path.join(BASE_DIR, 'neutres')
const SINGULAR_DIR = path.join(BASE_DIR, 'singuliers')

fastify.get('/', async (request, reply) => {
    reply.type('text/html').send(fs.readFileSync('index.html', {encoding: 'utf-8'}))
})

function randInRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

function pickRandomImage(files) {
    return files[randInRange(0, files.length)]
}

function pick7NeutralImages() {
    const set = new Set()
    // Attention aux dossiers ! S'il y a un sous-dossier alors
    // ce dernier pourrait être tiré au sort, alors qu'il ne
    // le faut pas
    const files = fs.readdirSync(NEUTRAL_DIR)
    while (Array.from(set.values()).length < 7) {
        set.add(pickRandomImage(files))
    }
    return set
}

function base64encode(str) {
    return Buffer.from(str, 'utf-8').toString('base64')
}

function base64image(filePath) {
    const data = fs.readFileSync(filePath)
    const b64data = base64encode(data)
    return `data:${mime.getType(filePath)};base64,${b64data}`
}

function shuffle(array) {
    array.sort(() => Math.random() - 0.5)
}

fastify.get('/api/newsession', async (request, reply) => {
    const neutral = Array.from(pick7NeutralImages())
    const singular = pickRandomImage(fs.readdirSync(SINGULAR_DIR))
    // TODO Générer token, image data en base64 et conserver id de l'image singulière

    const images = neutral.concat(singular)
    const set = new Set()
    for (const image of images) {
        for (const dir of [NEUTRAL_DIR, SINGULAR_DIR]) {
            const filePath = path.join(dir, image)
            if (fs.existsSync(filePath)) {
                set.add(base64image(filePath))
                break
            }
        }
    }
    const arr = Array.from(set)
    shuffle(arr)
    const json = JSON.stringify(arr)

    // TODO Trouver singular dans l'array et récupérer son id pour le conserver
    reply.type("text/json").send(json)
})

const start = async () => {
    try {
        await fastify.listen(8080)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()