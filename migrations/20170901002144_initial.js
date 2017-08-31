exports.up = async function(knex) {
    await knex.schema.createTable('champions', table => {
        table.increments();
        table.string('name');
        table.string('riot_id');
    });
    await knex.schema.createTable('cache_control', table => {
        table.increments();
        table.string('cache_identifier');
        table.dateTime('expires');
        table.dateTime('last_modified');
    });
};

exports.down = async function(knex) {
    knex.schema.dropTable('champions');
    knex.schema.dropTable('cache_control');
};
