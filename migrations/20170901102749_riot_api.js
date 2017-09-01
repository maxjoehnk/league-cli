exports.up = async function (knex) {
    await knex.schema.createTable('items', table => {
        table.increments();
        table.integer('riot_id');
        table.string('name');
        table.string('description');
    });
    await knex.schema.createTable('runes', table => {
        table.increments();
        table.integer('riot_id');
        table.string('name');
        table.string('description');
    });
    await knex.schema.dropTable('champions');
    await knex.from('cache_control')
        .where('cache_identifier', 'riot_champions')
        .del();
    await knex.schema.createTable('champions', table => {
        table.increments();
        table.integer('riot_id');
        table.string('name');
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTable('items');
    await knex.schema.dropTable('runes');
};
