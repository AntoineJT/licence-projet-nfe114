const { exit } = require('node:process')

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

const TABLES = ['users', 'artistes', 'themes', 'jeu_images']

async function createTables() {
    await knex.schema
        .createTable('users', table => {
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
    let count
    for (const table of TABLES) {
        if (knex.schema.hasTable(table)) {
            ++count
        }
    }
    return count
}

try {
    if (howMuchTables() === 0) {
        createTables()
    } else
    if (howMuchTables === TABLES.length) {
        // do nothing
    } else {
        readline.question(`ERROR: Database lacks one or more tables.\n
        Do you want to reset database? [Y/N]`, choice => {
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
