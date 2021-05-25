const { exit } = require('process')

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        user: 'captchat',
        password: 'LesChatsDominerontLeMonde4everTonight',
        database: 'captchat'
    }
})

const TABLES = ['utilisateurs', 'artistes', 'themes', 'jeu_images']

async function createTables() {
    await knex.schema
        .createTable('utilisateurs', table => {
            table.engine('InnoDB')
            table.increments('id')
            table.string('nom')
            table.string('mdp')
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
}

function howMuchTables() {
    let count = 0
    for (const table of TABLES) {
        knex.schema.hasTable(table).then(hasTable => {
            if (hasTable) {
                ++count
            }
        })
    }
    return count
}

try {
    if (howMuchTables() === 0) {
        console.log('Creating tables...')
        createTables()
        console.log('Tables created')
    } else
    if (howMuchTables() === TABLES.length) {
        // do nothing
    } else {
        readline.question(`ERROR: Database lacks one or more tables.
Do you want to reset database? [Y/N] `, choice => {
            const accepted = choice === 'Y'
            if (!accepted) {
                exit(1)
            }

            for (const table of TABLES) {
                knex.schema.dropTableIfExists(table)
            }
            createTables()
        })
    }
} catch(e) {
    console.error(e)
}
