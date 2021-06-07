const DEBUG = true

const fs = require('fs')
const path = require('path')

const db = require('./server/db')
const imgutil = require('./server/imgutil')
const jsonutil = require('./server/jsonutil')
const picker = require('./server/picker')
const token = require('./server/token')

const fastify = require('fastify')({ logger: DEBUG })
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

fastify.register(require('fastify-formbody'))

fastify.get('/favicon.ico', (request, reply) => {
    reply.code(204).header('Content-Type', 'image/x-icon').send()
})

fastify.get('/', (request, reply) => sendHTMLFile(reply, 'index.html'))
fastify.get('/admin/artists', (request, reply) => sendHTMLFile(reply, 'artists.html'))

function sendHTMLFile(reply, file) {
    reply.type('text/html').send(fs.readFileSync(`client/${file}`, {encoding: 'utf-8'}))
}

// /i/ -> internal nonREST API
fastify.get('/i/newsession', (request, reply) => {
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

fastify.get('/i/validate', (request, reply) => {
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

fastify.get('/i/status', (request, reply) => {
    const tok = request.query['token']
    if (tok === undefined) {
        reply.code(400).send('`token` parameter is required')
        return
    }

    return {'success': CACHE_JSON[tok]}
})

// API REST
// Users
fastify.post('/api/users', (request, reply) => {
    const username = request.query['username'].toLowerCase()
    const password = request.query['password']

    handlePromise(reply, db.createUser(username, password), DEBUG)
})

fastify.get('/api/users/:username/authenticate', async (request, reply) => {
    const username = request.params['username'].toLowerCase()
    const password = request.query['password']

    const tok = await db.authenticate(username, password)
    if (tok === undefined) {
        reply.code(403).send()
    } else {
        reply.code(200).send({token: tok})
    }
})

// Artists
fastify.post('/api/artists', (request, reply) => atPost(request, reply, db.createArtist))
fastify.put('/api/artists', (request, reply) => atPut(request, reply, db.editArtist))
fastify.delete('/api/artists', (request, reply) => atDelete(request, reply, db.deleteArtist))
fastify.get('/api/artists', (request, reply) => atGet(request, reply, db.allArtists))

// Themes
fastify.post('/api/themes', (request, reply) => atPost(request, reply, db.createTheme))
fastify.put('/api/themes', (request, reply) => atPut(request, reply, db.editTheme))
fastify.delete('/api/themes', (request, reply) => atDelete(request, reply, db.deleteTheme))
fastify.get('/api/themes', (request, reply) => atGet(request, reply, db.allThemes))

// ImageSets
fastify.post('/api/imagesets', (request, reply) => {
    needAuth(request, reply, () => {
        const name = request.query['name'].toLowerCase()
        const themeName = request.query['themename'].toLowerCase()
        const artistName = request.query['artistname'].toLowerCase()

        handlePromise(reply, db.createImageSet(name, themeName, artistName), DEBUG, catchError)
    })
})

fastify.delete('/api/imagesets', (request, reply) => atDelete(request, reply, db.deleteImageSet))
fastify.get('/api/imagesets', (request, reply) => atGet(request, reply, db.allImageSets))

function catchError(error, debug, reply) {
    if (error.hasSome()) {
        reply.code(500).send(debug ? error.some : '')
        return false
    }
    return true
}

// at functions -> apply to artists and themes
// to avoid duplicated code
function atPost(request, reply, func) {
    needAuth(request, reply, () => {
        const contentType = request.headers['content-type']
        console.log(contentType)
        const params = contentType === 'application/x-www-form-urlencoded'
            ? request.body : request.query
        console.log(params)
        const name = params['name'].toLowerCase()
        handlePromise(reply, func(name), DEBUG, catchError)
    })
}

function atPut(request, reply, func) {
    needAuth(request, reply, async () => {
        const name = request.query['name'].toLowerCase()
        const newName = request.query['newname'].toLowerCase()

        handlePromise(reply, func(name, {nom: newName}), DEBUG, (success) => success)
    })
}

function atDelete(request, reply, func) {
    needAuth(request, reply, async () => {
        const name = request.query['name'].toLowerCase()
        const status = await func(name)
            ? 200 : 500
        reply.code(status).send()
    })
}

function atGet(request, reply, func) {
    needAuth(request, reply, async () => {
        reply.code(200).send(await func())
    })
}

// utils
function handlePromise(reply, promise, debug = false, validation = () => true) {
    promise.then(success => {
        if (validation(success, debug, reply)) {
            reply.code(200).send()
        } else if (!reply.sent) {
            reply.code(500).send()
        }
    }, err => {
        reply.code(500).send(debug ? err : '')
    })
}

function needAuth(request, reply, func) {
    if (!authenticated(request)) {
        return reply.code(403).send()
    }
    return func()
}

function authenticated(request) {
    return db.isTokenValid(request.headers['token'])
}

function unimplemented(reply) {
    return reply.code(501).send()
}

const start = async () => {
    try {
        await fastify.listen(8080)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()
