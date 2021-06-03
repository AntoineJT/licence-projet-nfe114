const fs = require('fs')
const path = require('path')

const db = require('./server/db')
const imgutil = require('./server/imgutil')
const jsonutil = require('./server/jsonutil')
const picker = require('./server/picker')
const token = require('./server/token')

const fastify = require('fastify')({ logger: false })
const fastify_compress = require('fastify-compress')
const fastify_static = require('fastify-static')
const shuffle = require('shuffle-array')

// DIRECTORIES
const BASE_DIR = 'dataset'
const NEUTRAL_DIR = path.join(BASE_DIR, 'neutres')
const SINGULAR_DIR = path.join(BASE_DIR, 'singuliers')

// IN-MEM JSON
const HINTS_JSON = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'indices.json')))
Object.freeze(HINTS_JSON)
const DATA_JSON_FILE = 'data.json'
const DATA_JSON = JSON.parse(jsonutil.readOrCreate(DATA_JSON_FILE, '{}'))
const CACHE_JSON_FILE = 'cache.json'
const CACHE_JSON = JSON.parse(jsonutil.readOrCreate(CACHE_JSON_FILE, '{}'))

// ROUTES
// Pas besoin de compression pour les routes ou assets
// sauf pour la route newsession qui renvoie les images
// en base64
fastify.register(fastify_compress, { global: false })

fastify.register(fastify_static, {
    root: path.join(__dirname, 'public'),
    prefix: '/public/'
})

fastify.get('/favicon.ico', (request, reply) => {
    reply.code(204).header('Content-Type', 'image/x-icon').send()
})

fastify.get('/', (request, reply) => {
    reply.type('text/html').send(fs.readFileSync('client/index.html', {encoding: 'utf-8'}))
})

fastify.get('/api/newsession', (request, reply) => {
    const neutral = Array.from(picker.pick7NeutralImages(NEUTRAL_DIR))
    const singular = picker.pickRandomImage(fs.readdirSync(SINGULAR_DIR))

    const set = new Set()
    imgutil.addImagesToSet(set, NEUTRAL_DIR, neutral)
    imgutil.addImagesToSet(set, SINGULAR_DIR, [singular])

    const arr = Array.from(set)
    shuffle(arr)

    const singularIndex = imgutil.findImageIndex(arr, singular)
    const tok = token.generate()

    jsonutil.writeData(DATA_JSON_FILE, DATA_JSON, tok, singularIndex)

    // On enlève le nom de l'array
    const images = arr.map(item => item['data'])

    reply.type('text/json').compress({
        hint: HINTS_JSON[singular],
        images: images,
        token: tok
    })
})

fastify.get('/api/validate', (request, reply) => {
    const tok = request.query['token']
    const guess = request.query['guess']

    if ([tok, guess].findIndex(item => item === undefined) !== -1) {
        reply.code('400').send('`token` and `guess` parameters are required')
        return
    }

    const toGuess = DATA_JSON[tok]
    if (toGuess === undefined) {
        reply.code(410).send(`token '${tok}' is not valid anymore. Is this your second request?`)
        return
    }
    // on récupère le succès ou l'erreur
    // puis on supprime le token des captcha
    // en cours
    const status = toGuess == guess
    jsonutil.deleteData(DATA_JSON_FILE, DATA_JSON, tok)

    jsonutil.writeData(CACHE_JSON_FILE, CACHE_JSON, tok, status)
    return {'success': status}
})

fastify.get('/api/status', (request, reply) => {
    const tok = request.query['token']
    if (tok === undefined) {
        reply.code(400).send('`token` parameter is required')
        return
    }

    return {'success': CACHE_JSON[tok]}
})

// TODO Supprimer les /api/ des autres routes
// API REST
fastify.post('/api/users', (request, reply) => {
    const username = request.query['username'].toLowerCase()
    const password = request.query['password']

    db.createUser(username, password).then(_success => {
        reply.code(200).send()
    }, _err => {
        reply.code(500).send()
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
