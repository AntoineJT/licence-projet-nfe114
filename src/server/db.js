const fs = require('fs')
const process = require('process')
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

const token = require('./token')

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
    const user = await knex.first('mdp', 'token')
        .where('nom', username)
        .from('utilisateurs')

    return await argon2.verify(user.mdp, password)
        ? user.token : undefined
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
        })
        .createTable('themes', table => {
            table.engine('InnoDB')
            table.increments('id')
            table.string('nom')
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
                .references('themes.id')
            table
                .integer('artiste_id')
                .unsigned()
                .references('artistes.id')
            table.primary('id', 'nom', 'theme_id', 'artiste_id')
            // TODO Ajouter urlusage ?
        })

    fs.writeFileSync(DB_LOCK, STATUS_CREATED)
    console.log('Tables created')
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
