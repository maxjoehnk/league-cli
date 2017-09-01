exports.up = async function(knex) {
    await knex.schema.table('champions', table => {
        table.string('title');
        table.text('lore');
    });
    await knex.schema.createTable('champion_spells', table => {
        table.increments();
        table.integer('champion_id');
        table.foreign('champion_id').references('champions.riot_id');
        table.string('name');
        table.string('description');
        table.string('image_url');
    });
    await knex.from('cache_control')
        .where('cache_identifier', 'riot_champions')
        .del();
};

exports.down = async function(knex) {
    await knex.schema.table('champions', table => {
        table.dropColumn('title');
        table.dropColumn('lore');
    });
    await knex.schema.dropTable('champion_spells');
};
