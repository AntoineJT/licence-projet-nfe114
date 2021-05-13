const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const imgutil = require('./server/imgutil')
const jsonutil = require('./server/jsonutil')
const picker = require('./server/picker')
const token = require('./server/token')

const fastify = require('fastify')({ logger: false })
const fastify_static = require('fastify-static')

// DIRECTORIES
const BASE_DIR = 'dataset'
const NEUTRAL_DIR = path.join(BASE_DIR, 'neutres')
const SINGULAR_DIR = path.join(BASE_DIR, 'singuliers')

// IN-MEM JSON
const HINTS_JSON = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'indices.json')))
Object.freeze(HINTS_JSON)
const DATA_JSON = JSON.parse(jsonutil.readOrCreate('data.json', '{}'))

// FUNCTIONS
function shuffle(array) {
    array.sort(() => crypto.randomInt(100))
}

// ROUTES
fastify.register(fastify_static, {
    root: path.join(__dirname, 'public'),
    prefix: '/public/'
})

fastify.get('/favicon.ico', (request, reply) => {
    reply.code(204).header('Content-Type', 'image/x-icon').send()
})

fastify.get('/', async (request, reply) => {
    reply.type('text/html').send(fs.readFileSync('client/index.html', {encoding: 'utf-8'}))
})

fastify.get('/api/newsession', async (request, reply) => {
    const neutral = Array.from(picker.pick7NeutralImages(NEUTRAL_DIR))
    const singular = picker.pickRandomImage(fs.readdirSync(SINGULAR_DIR))

    const set = new Set()
    imgutil.addImagesToSet(set, NEUTRAL_DIR, neutral)
    imgutil.addImagesToSet(set, SINGULAR_DIR, [singular])

    const arr = Array.from(set)
    shuffle(arr)

    const singularIndex = imgutil.findImageIndex(arr, singular)
    const tok = token.generate()

    jsonutil.writeData('data.json', DATA_JSON, tok, singularIndex)

    // On enlève le nom de l'array
    const images = arr.map(item => item['data'])

    reply.type("text/json").send({
        hint: HINTS_JSON[singular],
        images: images,
        token: tok
    })
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
