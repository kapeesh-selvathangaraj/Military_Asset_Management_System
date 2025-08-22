require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { query } = require('../config/database');

/**
 * Reset Database - Clear all data for fresh seeding
 */

const resetDatabase = async () => {
  try {
    console.log('🗑️ Resetting database - clearing all data...');

    // First, update foreign key references to NULL where possible
    await query('UPDATE bases SET commander_id = NULL');
    await query('UPDATE users SET base_id = NULL');
    
    // Delete in order to respect foreign key constraints
    await query('DELETE FROM assignments');
    await query('DELETE FROM transfers');
    await query('DELETE FROM purchases');
    await query('DELETE FROM asset_balances');
    await query('DELETE FROM assets');
    await query('DELETE FROM asset_types');
    await query('DELETE FROM users');
    await query('DELETE FROM bases');

    console.log('✅ Database reset completed - all data cleared');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎯 Database is ready for fresh seeding');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Reset failed:', error.message);
      process.exit(1);
    });
}

module.exports = { resetDatabase };
