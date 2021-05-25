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

const FIRST_TABLE_NAME = 'users'
const LAST_TABLE_NAME = 'jeu_images'
const TABLES = [FIRST_TABLE_NAME, 'artistes', 'themes', LAST_TABLE_NAME]

async function createTables() {
    await knex.schema
        .createTable(FIRST_TABLE_NAME, table => {
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
        .createTable(LAST_TABLE_NAME, table => {
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

try {
    // première et dernière table
    const hasFirstTable = knex.schema.hasTable(FIRST_TABLE_NAME)
    const hasLastTable = knex.schema.hasTable(LAST_TABLE_NAME)

    if (!hasFirstTable && !hasLastTable) {
        createTables()
    } else
    if (hasFirstTable && hasLastTable) {
        // do nothing
    } else {
        readline.question(`An error occurred with database: FIRST_TABLE: ${hasFirstTable}, 
        LAST_TABLE: ${hasLastTable}.\n
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
