const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        user: 'captchat',
        password: 'LesChatsDominerontLeMonde4everTonight',
        database: 'captchat'
    }
})

module.exports.init = async function() {
    try {
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
    } catch(e) {
        console.error(e)
    }
}
