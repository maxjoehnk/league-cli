exports.up = async function(knex) {
    await knex.schema.table('champions', table => {
        table.string('image_url');
    });
    await knex.schema.table('items', table => {
        table.string('image_url');
    });
};

exports.down = async function(knex) {
    await knex.schema.table('champions', table => {
        table.dropColumn('image_url');
    });
    await knex.schema.table('items', table => {
        table.dropColumn('image_url');
    });
};
