const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const datascheme = require('./server/datascheme')

const fastify = require('fastify')({ logger: false })

// DIRECTORIES
const BASE_DIR = 'dataset'
const NEUTRAL_DIR = path.join(BASE_DIR, 'neutres')
const SINGULAR_DIR = path.join(BASE_DIR, 'singuliers')

// IN-MEM JSON
const HINTS_JSON = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'indices.json')))
Object.freeze(HINTS_JSON)
const DATA_JSON = JSON.parse(readOrCreateJson('data.json', '{}'))

// FUNCTIONS
function readOrCreateJson(filePath, defaultContent) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, defaultContent)
        return defaultContent
    }
    return fs.readFileSync(filePath)
}

function pickRandomImage(files) {
    return files[crypto.randomInt(0, files.length)]
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

function shuffle(array) {
    array.sort(() => crypto.randomInt(100))
}

function findImageIndex(arr, imgPath) {
    for (const [index, item] of arr.entries()) {
        if (item['name'] === imgPath) {
            return index
        }
    }
    assert(false, "Aucune image singulière dans l'imageset généré !")
}

function addImagesToSet(set, basedir, imgArr) {
    for (const img of imgArr) {
        const filePath = path.join(basedir, img)
        set.add({ name: img, data: datascheme.embed(filePath) })
    }
}

function writeData(token, idToGuess) {
    DATA_JSON[token] = idToGuess
    fs.writeFileSync('data.json', JSON.stringify(DATA_JSON))
}

function generateToken() {
    return crypto.randomBytes(20).toString('hex');
}

// ROUTES
fastify.get('/', async (request, reply) => {
    reply.type('text/html').send(fs.readFileSync('client/index.html', {encoding: 'utf-8'}))
})

fastify.get('/api/newsession', async (request, reply) => {
    const neutral = Array.from(pick7NeutralImages())
    const singular = pickRandomImage(fs.readdirSync(SINGULAR_DIR))

    const set = new Set()
    addImagesToSet(set, NEUTRAL_DIR, neutral)
    addImagesToSet(set, SINGULAR_DIR, [singular])

    const arr = Array.from(set)
    shuffle(arr)

    const singularIndex = findImageIndex(arr, singular)
    const token = generateToken()

    writeData(token, singularIndex)

    // On enlève le nom de l'array
    const images = arr.map(item => item['data'])

    reply.type("text/json").send({
        hint: HINTS_JSON[singular],
        images: images,
        token: token
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
