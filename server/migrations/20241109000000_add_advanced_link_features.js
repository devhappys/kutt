/**
 * Add advanced link features
 * - Max clicks limit
 * - Redirect type (301/302/307)
 * - Analytics toggle
 * - Public stats toggle  
 * - SEO meta tags
 */

exports.up = async function(knex) {
  // Check if columns exist before adding
  const hasMaxClicks = await knex.schema.hasColumn('links', 'max_clicks');
  
  if (!hasMaxClicks) {
    await knex.schema.table('links', table => {
      // Click limits
      table.integer('max_clicks').nullable().comment('Maximum number of clicks allowed');
      table.string('click_limit_period', 20).nullable().comment('Period for click limit: hour, day, week, month, total');
      table.integer('click_count_period').defaultTo(0).comment('Click count in current period');
      table.timestamp('click_period_start').nullable().comment('Start of current click counting period');
      
      // Redirect configuration
      table.string('redirect_type', 3).defaultTo('302').comment('HTTP redirect status code: 301, 302, or 307');
      
      // Analytics & Privacy
      table.boolean('enable_analytics').defaultTo(true).comment('Enable/disable analytics tracking');
      table.boolean('public_stats').defaultTo(false).comment('Make stats publicly viewable');
      
      // SEO Meta Tags
      table.string('meta_title', 200).nullable().comment('Custom meta title for preview');
      table.text('meta_description').nullable().comment('Custom meta description for preview');
      table.string('meta_image').nullable().comment('Custom meta image URL for preview');
      
      // Advanced features
      table.string('utm_campaign', 100).nullable().comment('Default UTM campaign');
      table.string('utm_source', 100).nullable().comment('Default UTM source');
      table.string('utm_medium', 100).nullable().comment('Default UTM medium');
    });
    
    console.log('✓ Added advanced link features columns to links table');
  } else {
    console.log('ℹ Advanced link features columns already exist');
  }
};

exports.down = async function(knex) {
  await knex.schema.table('links', table => {
    table.dropColumn('max_clicks');
    table.dropColumn('click_limit_period');
    table.dropColumn('click_count_period');
    table.dropColumn('click_period_start');
    table.dropColumn('redirect_type');
    table.dropColumn('enable_analytics');
    table.dropColumn('public_stats');
    table.dropColumn('meta_title');
    table.dropColumn('meta_description');
    table.dropColumn('meta_image');
    table.dropColumn('utm_campaign');
    table.dropColumn('utm_source');
    table.dropColumn('utm_medium');
  });
  
  console.log('✓ Removed advanced link features columns from links table');
};
