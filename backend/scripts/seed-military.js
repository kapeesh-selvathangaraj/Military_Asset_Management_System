require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Indian Military Asset Management System Data Seeding
 */

const seedIndianMilitaryData = async () => {
  try {
    console.log('🇮🇳 Starting Indian Military Data Seeding...');

    await seedIndianBases();
    await seedIndianPersonnel();
    await seedIndianAssets();
    await seedAssetBalances();
    await seedPurchases();
    await seedTransfers();
    await seedAssignments();

    console.log('✅ Indian Military Data Seeding Completed!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

const seedIndianBases = async () => {
  console.log('🏛️ Seeding Indian Military Bases...');
  
  const bases = [
    {
      id: uuidv4(),
      name: 'Red Fort Cantonment',
      code: 'RFC',
      location: 'Delhi, India',
      contact_info: JSON.stringify({
        phone: '+91-11-2309-4500',
        email: 'rfc.command@army.gov.in'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Siachen Base Camp',
      code: 'SBC',
      location: 'Siachen Glacier, Ladakh',
      contact_info: JSON.stringify({
        phone: '+91-1982-252-100',
        email: 'siachen.ops@army.gov.in'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'INS Vikramaditya Naval Base',
      code: 'VKT',
      location: 'Karwar, Karnataka',
      contact_info: JSON.stringify({
        phone: '+91-8382-266-500',
        email: 'vikramaditya@navy.gov.in'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Hindan Air Force Station',
      code: 'HAS',
      location: 'Ghaziabad, Uttar Pradesh',
      contact_info: JSON.stringify({
        phone: '+91-120-276-5400',
        email: 'hindan.afs@iaf.gov.in'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Pokhran Field Firing Range',
      code: 'PFR',
      location: 'Pokhran, Rajasthan',
      contact_info: JSON.stringify({
        phone: '+91-2994-222-300',
        email: 'pokhran.range@army.gov.in'
      }),
      is_active: true
    }
  ];

  for (const base of bases) {
    await query(
      `INSERT INTO bases (id, name, code, location, contact_info, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [base.id, base.name, base.code, base.location, base.contact_info, base.is_active]
    );
  }
  
  console.log(`   ✅ Created ${bases.length} bases`);
  return bases;
};

const seedIndianPersonnel = async () => {
  console.log('👥 Seeding Indian Military Personnel...');
  
  const bases = await query('SELECT id FROM bases ORDER BY name');
  const basesList = bases.rows;
  
  const personnel = [
    {
      username: 'gen_bipin',
      email: 'bipin.rawat@army.gov.in',
      first_name: 'Bipin',
      last_name: 'Rawat',
      role: 'admin',
      base_id: basesList[0]?.id
    },
    {
      username: 'col_rajesh',
      email: 'rajesh.kumar@army.gov.in',
      first_name: 'Rajesh',
      last_name: 'Kumar',
      role: 'base_commander',
      base_id: basesList[0]?.id
    },
    {
      username: 'maj_suresh',
      email: 'suresh.gupta@army.gov.in',
      first_name: 'Suresh',
      last_name: 'Gupta',
      role: 'logistics_officer',
      base_id: basesList[0]?.id
    },
    {
      username: 'capt_vikram',
      email: 'vikram.singh@navy.gov.in',
      first_name: 'Vikram',
      last_name: 'Singh',
      role: 'base_commander',
      base_id: basesList[2]?.id
    },
    {
      username: 'gp_capt_anjali',
      email: 'anjali.verma@iaf.gov.in',
      first_name: 'Anjali',
      last_name: 'Verma',
      role: 'base_commander',
      base_id: basesList[3]?.id
    }
  ];

  const passwordHash = await bcrypt.hash('password123', 12);

  for (const person of personnel) {
    const userId = uuidv4();
    const fullName = `${person.first_name} ${person.last_name}`;
    await query(
      `INSERT INTO users (id, username, email, password_hash, first_name, last_name, full_name,
                         role, base_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [userId, person.username, person.email, passwordHash, person.first_name, 
       person.last_name, fullName, person.role, person.base_id, true]
    );
  }
  
  console.log(`   ✅ Created ${personnel.length} personnel`);
};

const seedIndianAssets = async () => {
  console.log('🚁 Seeding Indian Military Assets...');
  
  // First create asset types
  const assetTypes = [
    { name: 'Arjun Main Battle Tank', category: 'vehicle' },
    { name: 'Sukhoi Su-30MKI', category: 'aircraft' },
    { name: 'INS Vikrant Aircraft Carrier', category: 'naval_vessel' },
    { name: 'INSAS Rifle', category: 'weapon' },
    { name: 'BrahMos Missile', category: 'missile' }
  ];

  const assetTypeIds = {};
  for (const assetType of assetTypes) {
    const typeId = uuidv4();
    await query(
      `INSERT INTO asset_types (id, name, category, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [typeId, assetType.name, assetType.category]
    );
    assetTypeIds[assetType.name] = typeId;
  }
  
  const bases = await query('SELECT id FROM bases ORDER BY name');
  const basesList = bases.rows;
  
  const assets = [
    {
      asset_type_name: 'Arjun Main Battle Tank',
      model: 'Mk-II',
      manufacturer: 'DRDO/Heavy Vehicles Factory',
      serial_number: 'ARJUN-001-2023',
      acquisition_date: '2023-01-15',
      acquisition_cost: 1650000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Tank Park A',
      base_id: basesList[0]?.id
    },
    {
      asset_type_name: 'Sukhoi Su-30MKI',
      model: 'Flanker-H',
      manufacturer: 'HAL',
      serial_number: 'SB-001-2020',
      acquisition_date: '2020-05-15',
      acquisition_cost: 620000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Hangar 3',
      base_id: basesList[3]?.id
    },
    {
      asset_type_name: 'INS Vikrant Aircraft Carrier',
      model: 'Aircraft Carrier',
      manufacturer: 'Cochin Shipyard',
      serial_number: 'IAC-001-2022',
      acquisition_date: '2022-09-02',
      acquisition_cost: 2300000000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Naval Dock 1',
      base_id: basesList[2]?.id
    },
    {
      asset_type_name: 'INSAS Rifle',
      model: '5.56mm',
      manufacturer: 'Ordnance Factory Board',
      serial_number: 'INSAS-67890-2021',
      acquisition_date: '2021-07-01',
      acquisition_cost: 45000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Armory Block C',
      base_id: basesList[0]?.id
    },
    {
      asset_type_name: 'BrahMos Missile',
      model: 'Block-III',
      manufacturer: 'BrahMos Aerospace',
      serial_number: 'BRAHMOS-001-2023',
      acquisition_date: '2023-01-20',
      acquisition_cost: 140000000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Missile Storage',
      base_id: basesList[4]?.id
    }
  ];

  for (const asset of assets) {
    const assetId = uuidv4();
    const assetTypeId = assetTypeIds[asset.asset_type_name];
    await query(
      `INSERT INTO assets (id, asset_type_id, model, manufacturer, serial_number, 
                          acquisition_date, acquisition_cost, current_status, condition_status, 
                          notes, base_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [assetId, assetTypeId, asset.model, asset.manufacturer, 
       asset.serial_number, asset.acquisition_date, asset.acquisition_cost, 
       asset.current_status, asset.condition_status, asset.notes, 
       asset.base_id]
    );
  }
  
  console.log(`   ✅ Created ${assets.length} assets`);
};

const seedAssetBalances = async () => {
  console.log('📊 Seeding Asset Balances...');
  
  // Get unique combinations of asset_type_id and base_id to avoid duplicate key errors
  const assets = await query('SELECT DISTINCT asset_type_id, base_id FROM assets');
  
  for (const asset of assets.rows) {
    await query(
      `INSERT INTO asset_balances (id, asset_type_id, base_id, current_balance, 
                                  available_quantity, reserved_quantity, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (base_id, asset_type_id) DO NOTHING`,
      [uuidv4(), asset.asset_type_id, asset.base_id, 1, 1, 0]
    );
  }
  
  console.log(`   ✅ Created balances for ${assets.rows.length} unique asset types`);
};

const seedPurchases = async () => {
  console.log('💰 Seeding Purchases...');
  
  const bases = await query('SELECT id FROM bases LIMIT 3');
  
  const purchases = [
    {
      asset_type: 'vehicle',
      base_id: bases.rows[0]?.id,
      quantity: 5,
      unit_cost: 850000.00,
      total_cost: 4250000.00,
      supplier: 'Ordnance Factory Board',
      purchase_date: '2023-06-15',
      delivery_date: '2023-08-30',
      po_number: 'PO-ARMY-2023-001',
      invoice_number: 'INV-OFB-4567',
      notes: 'T-90 tanks for operations'
    },
    {
      asset_type: 'aircraft',
      base_id: bases.rows[1]?.id,
      quantity: 2,
      unit_cost: 450000000.00,
      total_cost: 900000000.00,
      supplier: 'HAL',
      purchase_date: '2023-03-20',
      delivery_date: '2023-12-15',
      po_number: 'PO-IAF-2023-002',
      invoice_number: 'INV-HAL-7890',
      notes: 'Tejas aircraft delivery'
    }
  ];

  for (const purchase of purchases) {
    await query(
      `INSERT INTO purchases (id, asset_type, base_id, quantity, unit_cost, total_cost,
                             supplier, purchase_date, delivery_date, po_number, 
                             invoice_number, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [uuidv4(), purchase.asset_type, purchase.base_id, purchase.quantity,
       purchase.unit_cost, purchase.total_cost, purchase.supplier,
       purchase.purchase_date, purchase.delivery_date, purchase.po_number,
       purchase.invoice_number, purchase.notes]
    );
  }
  
  console.log(`   ✅ Created ${purchases.length} purchases`);
};

const seedTransfers = async () => {
  console.log('🚚 Seeding Transfers...');
  
  const bases = await query('SELECT id FROM bases LIMIT 4');
  
  const transfers = [
    {
      from_base_id: bases.rows[0]?.id,
      to_base_id: bases.rows[1]?.id,
      asset_type: 'vehicle',
      quantity: 2,
      transfer_date: '2023-07-15',
      reason: 'operational_requirement',
      notes: 'Transfer for Siachen operations',
      status: 'completed'
    }
  ];

  for (const transfer of transfers) {
    await query(
      `INSERT INTO transfers (id, from_base_id, to_base_id, asset_type, quantity,
                             transfer_date, reason, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [uuidv4(), transfer.from_base_id, transfer.to_base_id, transfer.asset_type,
       transfer.quantity, transfer.transfer_date, transfer.reason,
       transfer.notes, transfer.status]
    );
  }
  
  console.log(`   ✅ Created ${transfers.length} transfers`);
};

const seedAssignments = async () => {
  console.log('📋 Seeding Assignments...');
  
  const assets = await query('SELECT id FROM assets LIMIT 3');
  const users = await query('SELECT id FROM users WHERE role != \'admin\' LIMIT 3');
  
  const assignments = [
    {
      asset_id: assets.rows[0]?.id,
      assigned_to_user_id: users.rows[0]?.id,
      assigned_date: '2023-08-01',
      purpose: 'Training Exercise',
      location: 'Training Ground Alpha',
      notes: 'Tank crew training program',
      status: 'active'
    }
  ];

  for (const assignment of assignments) {
    await query(
      `INSERT INTO assignments (id, asset_id, assigned_to_user_id, assigned_date,
                               purpose, location, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [uuidv4(), assignment.asset_id, assignment.assigned_to_user_id,
       assignment.assigned_date, assignment.purpose, assignment.location,
       assignment.notes, assignment.status]
    );
  }
  
  console.log(`   ✅ Created ${assignments.length} assignments`);
};

// Run if called directly
if (require.main === module) {
  seedIndianMilitaryData()
    .then(() => {
      console.log('🎯 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedIndianMilitaryData };
