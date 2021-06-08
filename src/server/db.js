const fs = require('fs')
const process = require('process')
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

const token = require('./token')
const Optional = require('./classes/Optional')

const argon2 = require('argon2')
const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        user: 'captchat',
        password: 'LesChatsDominerontLeMonde4everTonight',
        database: 'captchat'
    }
})

module.exports.createUser = async function (username, password) {
    const hash = await argon2.hash(password)
    await knex('utilisateurs').insert({
        nom: username, mdp: hash, token: token.generate()
    })
}

module.exports.authenticate = async function (username, password) {
    const user = await knex('utilisateurs')
        .first('mdp', 'token')
        .where('nom', username)

    return await argon2.verify(user.mdp, password)
        ? user.token : undefined
}

module.exports.isTokenValid = async function (tok) {
    return await knex('utilisateurs')
        .where('token', tok)
        .count('id as count')
        .first()
        .count === 1
}

module.exports.createArtist = async (name) => insert('artistes', {nom: name})
module.exports.deleteArtist = async (name) => del('artistes', 'nom', name)
module.exports.editArtist = async (name, obj) => edit('artistes', name, obj)
module.exports.allArtists = async () => all('artistes')

module.exports.createTheme = async (name) => insert('themes', {nom: name})
module.exports.deleteTheme = async (name) => del('themes', 'nom', name)
module.exports.editTheme = async (name, obj) => edit('themes', name, obj)
module.exports.allThemes = async () => all('themes')

module.exports.createImageSet = async function (name, themeName, artistName) {
    const id = await incrementedId('jeu_images')
    const tId = await getIdByName('themes', themeName)
    const aId = await getIdByName('artistes', artistName)

    if (tId === undefined || aId === undefined)
        return new Optional('Invalid theme and/or artist names')

    return insert('jeu_images', {
        id: id,
        nom: name,
        theme_id: tId,
        artiste_id: aId
    })
}
module.exports.deleteImageSet = async (name) => del('jeu_images', 'nom', name)
module.exports.allImageSets = async () => all('jeu_images')

// silly inefficient method but screw this
async function getIdByName(table, name) {
    return knex(table).select('id').where('nom', name).pluck('id')
}

async function incrementedId(table) {
    const res = (await knex(table).max('id', {as: 'max'})).max
    return res === undefined ? 1 : res + 1
}

async function all(table) {
    return knex(table).select()
}

async function del(table, col, val) {
    try {
        const rows = await knex(table).where(col, val).del()
        if (rows === 1)
            return new Optional()
        return new Optional('Nothing deleted!')
    } catch (e) {
        return new Optional(e)
    }
}

async function insert(table, obj) {
    try {
        await knex(table).insert(obj)
    } catch(e) {
        return new Optional(e)
    }
    return new Optional()
}

async function edit(table, name, obj) {
    return await knex(table).where('nom', name).update(obj) === 1
}

const DB_LOCK = 'db.lock'
const TABLES = ['utilisateurs', 'artistes', 'themes', 'jeu_images']
const STATUS_CREATING = 'CREATE'
const STATUS_CREATED = 'CREATED'

async function createTables() {
    console.log('Creating tables...')
    fs.writeFileSync(DB_LOCK, STATUS_CREATING)

    await knex.schema
        .createTable('utilisateurs', table => {
            table.engine('InnoDB')
            table.increments('id')
            table.string('nom')
                .unique()
            table.string('mdp')
            table.string('token')
        })
        .createTable('artistes', table => {
            table.engine('InnoDB')
            table.increments('id')
            table.string('nom')
                .unique()
        })
        .createTable('themes', table => {
            table.engine('InnoDB')
            table.increments('id')
            table.string('nom')
                .unique()
        })
        .createTable('jeu_images', table => {
            table.engine('InnoDB')
            table
                .integer('id')
                .unsigned()
                .notNullable()
            table
                .string('nom')
                .notNullable()
                .unique()
            table
                .integer('theme_id')
                .unsigned()
                .notNullable()
                .references('themes.id')
            table
                .integer('artiste_id')
                .unsigned()
                .notNullable()
                .references('artistes.id')
            table.primary('id', 'nom', 'theme_id', 'artiste_id')
            // TODO Ajouter urlusage ?
        })

    fs.writeFileSync(DB_LOCK, STATUS_CREATED)
    console.log('Tables created')

    console.log('Setting up Postman account...')
    // mdp: password
    await knex('utilisateurs').insert({
        nom: 'postman',
        mdp: '$argon2i$v=19$m=4096,t=3,p=1$k8eryE0yNBhV2yd/RL7nYQ$S8+vNxAvQd8uDFa2kCRZ9YJJUYwSYhcR4++P4G/ek9g',
        token: '25096b23936ec1d5138f2e1cde9fd083ae457935'
    })
    console.log('Postman account created')
}

try {
    const status = fs.existsSync(DB_LOCK) ? fs.readFileSync(DB_LOCK) : 'UNKNOWN'
    if (status == STATUS_CREATING) {
        readline.question(`ERROR: Database lacks one or more tables.
Do you want to reset database? [Y/N] `, choice => {
            const accepted = choice === 'Y' || choice === 'y'
            if (!accepted) {
                process.exit(1)
            }

            for (const table of TABLES) {
                knex.schema.dropTableIfExists(table)
            }
            createTables()
        })
    } else
    if (status == STATUS_CREATED) {
        // do nothing
    } else {
        createTables()
    }
} catch(e) {
    console.error(e)
}
