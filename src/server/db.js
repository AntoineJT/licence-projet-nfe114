const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: 'data.db'
    }
    // , useNullAsDefault: true
})

module.exports.init = async function() {
    try {
        await knex.schema
            .createTable('users', table => {
                table.increments('id')
                table.string('nom')
                table.string('mdp')
            })
            .createTable('artistes', table => {
                table.increments('id')
                table.string('nom')
            })
            .createTable('themes', table => {
                table.increments('id')
                table.string('nom')
            })
            .createTable('jeu_images', table => {
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
                table
                    .integer('image_id')
                    .unsigned()
                    .references('images.id')
                table.primary('id', 'nom', 'theme_id', 'artiste_id')
                // TODO Ajouter urlusage ?
            })
    } catch(e) {
        console.error(e)
    }
}
