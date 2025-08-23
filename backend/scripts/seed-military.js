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
    // Army Bases
    {
      id: uuidv4(),
      name: 'Red Fort Cantonment',
      code: 'RFC',
      location: 'Delhi, India',
      contact_info: JSON.stringify({
        phone: '+91-11-2309-4500',
        email: 'rfc.command@army.gov.in',
        command: 'Delhi Area',
        zone: 'Western Command'
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
        email: 'siachen.ops@army.gov.in',
        command: 'Fire & Fury Corps',
        zone: 'Northern Command'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Pathankot Military Station',
      code: 'PMS',
      location: 'Pathankot, Punjab',
      contact_info: JSON.stringify({
        phone: '+91-186-222-3456',
        email: 'pathankot.command@army.gov.in',
        command: 'XVI Corps',
        zone: 'Western Command'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Tezpur Military Station',
      code: 'TMS',
      location: 'Tezpur, Assam',
      contact_info: JSON.stringify({
        phone: '+91-3712-220-456',
        email: 'tezpur.ops@army.gov.in',
        command: 'IV Corps',
        zone: 'Eastern Command'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Jaisalmer Military Station',
      code: 'JMS',
      location: 'Jaisalmer, Rajasthan',
      contact_info: JSON.stringify({
        phone: '+91-2992-252-789',
        email: 'jaisalmer.desert@army.gov.in',
        command: 'Desert Corps',
        zone: 'South Western Command'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Pune Military Station',
      code: 'PUMS',
      location: 'Pune, Maharashtra',
      contact_info: JSON.stringify({
        phone: '+91-20-2605-4321',
        email: 'pune.command@army.gov.in',
        command: 'Southern Command HQ',
        zone: 'Southern Command'
      }),
      is_active: true
    },
    // Naval Bases
    {
      id: uuidv4(),
      name: 'INS Vikramaditya Naval Base',
      code: 'VNB',
      location: 'Karwar, Karnataka',
      contact_info: JSON.stringify({
        phone: '+91-8382-256-789',
        email: 'vikramaditya.command@navy.gov.in',
        command: 'Western Naval Command',
        zone: 'Arabian Sea Operations'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'INS Visakhapatnam Naval Base',
      code: 'VNBV',
      location: 'Visakhapatnam, Andhra Pradesh',
      contact_info: JSON.stringify({
        phone: '+91-891-256-7890',
        email: 'visakhapatnam.fleet@navy.gov.in',
        command: 'Eastern Naval Command',
        zone: 'Bay of Bengal Operations'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'INS Kochi Naval Base',
      code: 'KNB',
      location: 'Kochi, Kerala',
      contact_info: JSON.stringify({
        phone: '+91-484-266-7890',
        email: 'kochi.southern@navy.gov.in',
        command: 'Southern Naval Command',
        zone: 'Indian Ocean Operations'
      }),
      is_active: true
    },
    // Air Force Bases
    {
      id: uuidv4(),
      name: 'Hindon Air Force Station',
      code: 'HAFS',
      location: 'Ghaziabad, Uttar Pradesh',
      contact_info: JSON.stringify({
        phone: '+91-120-278-5000',
        email: 'hindon.ops@iaf.gov.in',
        command: 'Western Air Command',
        zone: 'Delhi Air Defence'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Ambala Air Force Station',
      code: 'AAFS',
      location: 'Ambala, Haryana',
      contact_info: JSON.stringify({
        phone: '+91-171-260-1234',
        email: 'ambala.fighter@iaf.gov.in',
        command: 'Western Air Command',
        zone: 'Fighter Operations'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Sulur Air Force Station',
      code: 'SAFS',
      location: 'Coimbatore, Tamil Nadu',
      contact_info: JSON.stringify({
        phone: '+91-422-261-5678',
        email: 'sulur.transport@iaf.gov.in',
        command: 'Southern Air Command',
        zone: 'Transport Operations'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Bagdogra Air Force Station',
      code: 'BAFS',
      location: 'Siliguri, West Bengal',
      contact_info: JSON.stringify({
        phone: '+91-353-258-9012',
        email: 'bagdogra.eastern@iaf.gov.in',
        command: 'Eastern Air Command',
        zone: 'Eastern Sector Operations'
      }),
      is_active: true
    },
    // Border Outposts
    {
      id: uuidv4(),
      name: 'Daulat Beg Oldi Post',
      code: 'DBO',
      location: 'Ladakh, J&K',
      contact_info: JSON.stringify({
        phone: '+91-1982-252-999',
        email: 'dbo.outpost@army.gov.in',
        command: 'Fire & Fury Corps',
        zone: 'High Altitude Warfare'
      }),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Nathu La Border Post',
      code: 'NLA',
      location: 'Sikkim, India',
      contact_info: JSON.stringify({
        phone: '+91-3592-252-111',
        email: 'nathula.border@army.gov.in',
        command: 'XXXIII Corps',
        zone: 'Eastern Command'
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
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE SET
         code = EXCLUDED.code,
         location = EXCLUDED.location,
         contact_info = EXCLUDED.contact_info,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()`,
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
    // High Command & Administrators
    {
      username: 'gen_bipin',
      email: 'bipin.rawat@army.gov.in',
      first_name: 'Bipin',
      last_name: 'Rawat',
      role: 'admin',
      base_id: basesList[0]?.id
    },
    {
      username: 'gen_manoj',
      email: 'manoj.pande@army.gov.in',
      first_name: 'Manoj',
      last_name: 'Pande',
      role: 'admin',
      base_id: basesList[5]?.id
    },
    {
      username: 'adm_karambir',
      email: 'karambir.singh@navy.gov.in',
      first_name: 'Karambir',
      last_name: 'Singh',
      role: 'admin',
      base_id: basesList[6]?.id
    },
    {
      username: 'acm_vivek',
      email: 'vivek.chaudhari@iaf.gov.in',
      first_name: 'Vivek Ram',
      last_name: 'Chaudhari',
      role: 'admin',
      base_id: basesList[9]?.id
    },
    
    // Base Commanders - Army
    {
      username: 'col_rajesh',
      email: 'rajesh.kumar@army.gov.in',
      first_name: 'Rajesh',
      last_name: 'Kumar',
      role: 'base_commander',
      base_id: basesList[0]?.id
    },
    {
      username: 'col_pradeep',
      email: 'pradeep.sharma@army.gov.in',
      first_name: 'Pradeep',
      last_name: 'Sharma',
      role: 'base_commander',
      base_id: basesList[1]?.id
    },
    {
      username: 'col_harinder',
      email: 'harinder.singh@army.gov.in',
      first_name: 'Harinder',
      last_name: 'Singh',
      role: 'base_commander',
      base_id: basesList[2]?.id
    },
    {
      username: 'col_anil',
      email: 'anil.chauhan@army.gov.in',
      first_name: 'Anil',
      last_name: 'Chauhan',
      role: 'base_commander',
      base_id: basesList[3]?.id
    },
    {
      username: 'col_yogesh',
      email: 'yogesh.joshi@army.gov.in',
      first_name: 'Yogesh',
      last_name: 'Joshi',
      role: 'base_commander',
      base_id: basesList[4]?.id
    },
    {
      username: 'col_deepak',
      email: 'deepak.kapoor@army.gov.in',
      first_name: 'Deepak',
      last_name: 'Kapoor',
      role: 'base_commander',
      base_id: basesList[13]?.id
    },
    {
      username: 'col_raman',
      email: 'raman.puri@army.gov.in',
      first_name: 'Raman',
      last_name: 'Puri',
      role: 'base_commander',
      base_id: basesList[14]?.id
    },
    
    // Base Commanders - Navy
    {
      username: 'capt_vikram',
      email: 'vikram.singh@navy.gov.in',
      first_name: 'Vikram',
      last_name: 'Singh',
      role: 'base_commander',
      base_id: basesList[6]?.id
    },
    {
      username: 'capt_dinesh',
      email: 'dinesh.tripathi@navy.gov.in',
      first_name: 'Dinesh K',
      last_name: 'Tripathi',
      role: 'base_commander',
      base_id: basesList[7]?.id
    },
    {
      username: 'capt_sanjay',
      email: 'sanjay.bhalla@navy.gov.in',
      first_name: 'Sanjay',
      last_name: 'Bhalla',
      role: 'base_commander',
      base_id: basesList[8]?.id
    },
    
    // Base Commanders - Air Force
    {
      username: 'gp_capt_anjali',
      email: 'anjali.verma@iaf.gov.in',
      first_name: 'Anjali',
      last_name: 'Verma',
      role: 'base_commander',
      base_id: basesList[9]?.id
    },
    {
      username: 'gp_capt_rakesh',
      email: 'rakesh.bhadauria@iaf.gov.in',
      first_name: 'Rakesh Kumar Singh',
      last_name: 'Bhadauria',
      role: 'base_commander',
      base_id: basesList[10]?.id
    },
    {
      username: 'gp_capt_sandeep',
      email: 'sandeep.singh@iaf.gov.in',
      first_name: 'Sandeep',
      last_name: 'Singh',
      role: 'base_commander',
      base_id: basesList[11]?.id
    },
    {
      username: 'gp_capt_amit',
      email: 'amit.dev@iaf.gov.in',
      first_name: 'Amit',
      last_name: 'Dev',
      role: 'base_commander',
      base_id: basesList[12]?.id
    },
    
    // Logistics Officers - Army
    {
      username: 'maj_suresh',
      email: 'suresh.gupta@army.gov.in',
      first_name: 'Suresh',
      last_name: 'Gupta',
      role: 'logistics_officer',
      base_id: basesList[0]?.id
    },
    {
      username: 'maj_ashok',
      email: 'ashok.kumar@army.gov.in',
      first_name: 'Ashok',
      last_name: 'Kumar',
      role: 'logistics_officer',
      base_id: basesList[1]?.id
    },
    {
      username: 'maj_ravi',
      email: 'ravi.shankar@army.gov.in',
      first_name: 'Ravi',
      last_name: 'Shankar',
      role: 'logistics_officer',
      base_id: basesList[2]?.id
    },
    {
      username: 'maj_kiran',
      email: 'kiran.bedi@army.gov.in',
      first_name: 'Kiran',
      last_name: 'Bedi',
      role: 'logistics_officer',
      base_id: basesList[3]?.id
    },
    {
      username: 'maj_vinod',
      email: 'vinod.rai@army.gov.in',
      first_name: 'Vinod',
      last_name: 'Rai',
      role: 'logistics_officer',
      base_id: basesList[4]?.id
    },
    {
      username: 'maj_sunita',
      email: 'sunita.sharma@army.gov.in',
      first_name: 'Sunita',
      last_name: 'Sharma',
      role: 'logistics_officer',
      base_id: basesList[5]?.id
    },
    {
      username: 'maj_rohit',
      email: 'rohit.shetty@army.gov.in',
      first_name: 'Rohit',
      last_name: 'Shetty',
      role: 'logistics_officer',
      base_id: basesList[13]?.id
    },
    {
      username: 'maj_priya',
      email: 'priya.nair@army.gov.in',
      first_name: 'Priya',
      last_name: 'Nair',
      role: 'logistics_officer',
      base_id: basesList[14]?.id
    },
    
    // Logistics Officers - Navy
    {
      username: 'cdr_rajiv',
      email: 'rajiv.kumar@navy.gov.in',
      first_name: 'Rajiv',
      last_name: 'Kumar',
      role: 'logistics_officer',
      base_id: basesList[6]?.id
    },
    {
      username: 'cdr_meera',
      email: 'meera.nair@navy.gov.in',
      first_name: 'Meera',
      last_name: 'Nair',
      role: 'logistics_officer',
      base_id: basesList[7]?.id
    },
    {
      username: 'cdr_sunil',
      email: 'sunil.menon@navy.gov.in',
      first_name: 'Sunil',
      last_name: 'Menon',
      role: 'logistics_officer',
      base_id: basesList[8]?.id
    },
    
    // Logistics Officers - Air Force
    {
      username: 'wg_cdr_rahul',
      email: 'rahul.dravid@iaf.gov.in',
      first_name: 'Rahul',
      last_name: 'Dravid',
      role: 'logistics_officer',
      base_id: basesList[9]?.id
    },
    {
      username: 'wg_cdr_kavita',
      email: 'kavita.krishnan@iaf.gov.in',
      first_name: 'Kavita',
      last_name: 'Krishnan',
      role: 'logistics_officer',
      base_id: basesList[10]?.id
    },
    {
      username: 'wg_cdr_arjun',
      email: 'arjun.singh@iaf.gov.in',
      first_name: 'Arjun',
      last_name: 'Singh',
      role: 'logistics_officer',
      base_id: basesList[11]?.id
    },
    {
      username: 'wg_cdr_neha',
      email: 'neha.kapoor@iaf.gov.in',
      first_name: 'Neha',
      last_name: 'Kapoor',
      role: 'logistics_officer',
      base_id: basesList[12]?.id
    }
  ];

  const passwordHash = await bcrypt.hash('password123', 12);

  for (const person of personnel) {
    const userId = uuidv4();
    const fullName = `${person.first_name} ${person.last_name}`;
    await query(
      `INSERT INTO users (id, username, email, password_hash, first_name, last_name, full_name,
                         role, base_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       ON CONFLICT (username) DO UPDATE SET
         email = EXCLUDED.email,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         base_id = EXCLUDED.base_id,
         updated_at = NOW()`,
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
    // Army Vehicles
    { name: 'Arjun Main Battle Tank', category: 'vehicle' },
    { name: 'T-90 Bhishma Tank', category: 'vehicle' },
    { name: 'BMP-2 Sarath IFV', category: 'vehicle' },
    { name: 'Tata LPTA 713 TC', category: 'vehicle' },
    { name: 'Mahindra Axe Light Vehicle', category: 'vehicle' },
    { name: 'Pinaka Multi Barrel Rocket Launcher', category: 'vehicle' },
    { name: 'Dhanush Howitzer', category: 'vehicle' },
    
    // Naval Vessels
    { name: 'INS Vikrant Aircraft Carrier', category: 'naval_vessel' },
    { name: 'INS Kolkata Destroyer', category: 'naval_vessel' },
    { name: 'INS Shivalik Frigate', category: 'naval_vessel' },
    { name: 'INS Kalvari Submarine', category: 'naval_vessel' },
    { name: 'INS Saryu Patrol Vessel', category: 'naval_vessel' },
    { name: 'Fast Attack Craft', category: 'naval_vessel' },
    
    // Aircraft
    { name: 'Sukhoi Su-30MKI', category: 'aircraft' },
    { name: 'HAL Tejas LCA', category: 'aircraft' },
    { name: 'Mirage 2000', category: 'aircraft' },
    { name: 'MiG-29 Fulcrum', category: 'aircraft' },
    { name: 'HAL Dhruv Helicopter', category: 'aircraft' },
    { name: 'HAL Rudra Attack Helicopter', category: 'aircraft' },
    { name: 'C-130J Super Hercules', category: 'aircraft' },
    { name: 'Boeing P-8I Neptune', category: 'aircraft' },
    
    // Weapons
    { name: 'INSAS Rifle', category: 'weapon' },
    { name: 'AK-203 Assault Rifle', category: 'weapon' },
    { name: 'SIG Sauer 716 Rifle', category: 'weapon' },
    { name: 'DRDO Anti-Material Rifle', category: 'weapon' },
    { name: 'Carl Gustaf Recoilless Rifle', category: 'weapon' },
    { name: 'Milan Anti-Tank Missile', category: 'weapon' },
    { name: 'Javelin Anti-Tank Missile', category: 'weapon' },
    
    // Missiles
    { name: 'BrahMos Missile', category: 'missile' },
    { name: 'Agni-V ICBM', category: 'missile' },
    { name: 'Prithvi-II Missile', category: 'missile' },
    { name: 'Akash Surface-to-Air Missile', category: 'missile' },
    { name: 'Nag Anti-Tank Missile', category: 'missile' },
    { name: 'Astra Air-to-Air Missile', category: 'missile' },
    
    // Communication & Electronics
    { name: 'BEL Communication System', category: 'communication' },
    { name: 'DRDO Radar System', category: 'communication' },
    { name: 'Satellite Communication Terminal', category: 'communication' },
    { name: 'Electronic Warfare System', category: 'communication' },
    
    // Support Equipment
    { name: 'Field Hospital Unit', category: 'medical' },
    { name: 'Water Purification System', category: 'support' },
    { name: 'Generator Set', category: 'support' },
    { name: 'Engineering Equipment', category: 'support' }
  ];

  const assetTypeIds = {};
  for (const assetType of assetTypes) {
    const typeId = uuidv4();
    const result = await query(
      `INSERT INTO asset_types (id, name, category, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE SET
         category = EXCLUDED.category,
         updated_at = NOW()
       RETURNING id`,
      [typeId, assetType.name, assetType.category]
    );
    assetTypeIds[assetType.name] = result.rows[0].id;
  }
  
  const bases = await query('SELECT id FROM bases ORDER BY name');
  const basesList = bases.rows;
  
  const assets = [
    // Army Tanks & Vehicles
    {
      asset_type_name: 'Arjun Main Battle Tank',
      model: 'Mk-II',
      manufacturer: 'DRDO/Heavy Vehicles Factory',
      serial_number: 'ARJUN-001-2023',
      acquisition_date: '2023-01-15',
      acquisition_cost: 1650000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Tank Park A - Ready for deployment',
      base_id: basesList[0]?.id
    },
    {
      asset_type_name: 'T-90 Bhishma Tank',
      model: 'S',
      manufacturer: 'Heavy Vehicles Factory',
      serial_number: 'T90-BH-456-2022',
      acquisition_date: '2022-03-10',
      acquisition_cost: 1200000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Tank Park B - Operational',
      base_id: basesList[1]?.id
    },
    {
      asset_type_name: 'BMP-2 Sarath IFV',
      model: 'Sarath',
      manufacturer: 'Ordnance Factory Medak',
      serial_number: 'BMP2-SR-789-2021',
      acquisition_date: '2021-08-20',
      acquisition_cost: 850000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Mechanized Infantry Park',
      base_id: basesList[2]?.id
    },
    {
      asset_type_name: 'Pinaka Multi Barrel Rocket Launcher',
      model: 'Mk-II',
      manufacturer: 'DRDO/Tata Power SED',
      serial_number: 'PINAKA-MK2-123-2023',
      acquisition_date: '2023-02-14',
      acquisition_cost: 2500000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Artillery Park - High readiness',
      base_id: basesList[4]?.id
    },
    {
      asset_type_name: 'Dhanush Howitzer',
      model: '155mm/45 Cal',
      manufacturer: 'Ordnance Factory Board',
      serial_number: 'DHANUSH-155-567-2022',
      acquisition_date: '2022-11-30',
      acquisition_cost: 1800000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Artillery Regiment A',
      base_id: basesList[3]?.id
    },
    
    // Naval Vessels
    {
      asset_type_name: 'INS Vikrant Aircraft Carrier',
      model: 'IAC-1',
      manufacturer: 'Cochin Shipyard Limited',
      serial_number: 'IAC-001-2022',
      acquisition_date: '2022-09-02',
      acquisition_cost: 2300000000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Flagship - Western Naval Command',
      base_id: basesList[6]?.id
    },
    {
      asset_type_name: 'INS Kolkata Destroyer',
      model: 'Project 15A',
      manufacturer: 'Mazagon Dock Shipbuilders',
      serial_number: 'D63-KOL-2014',
      acquisition_date: '2014-08-16',
      acquisition_cost: 1100000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Fleet Operations - Arabian Sea',
      base_id: basesList[6]?.id
    },
    {
      asset_type_name: 'INS Shivalik Frigate',
      model: 'Project 17',
      manufacturer: 'Mazagon Dock Shipbuilders',
      serial_number: 'F47-SHV-2010',
      acquisition_date: '2010-04-29',
      acquisition_cost: 650000000.00,
      current_status: 'available',
      condition_status: 'fair',
      notes: 'Patrol Operations - Bay of Bengal',
      base_id: basesList[7]?.id
    },
    {
      asset_type_name: 'INS Kalvari Submarine',
      model: 'Scorpene Class',
      manufacturer: 'Mazagon Dock Shipbuilders',
      serial_number: 'S21-KLV-2017',
      acquisition_date: '2017-12-14',
      acquisition_cost: 900000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Submarine Operations - Indian Ocean',
      base_id: basesList[8]?.id
    },
    
    // Aircraft - Fighter Jets
    {
      asset_type_name: 'Sukhoi Su-30MKI',
      model: 'Flanker-H',
      manufacturer: 'HAL/Sukhoi',
      serial_number: 'SB-001-2020',
      acquisition_date: '2020-05-15',
      acquisition_cost: 620000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Air Superiority Squadron',
      base_id: basesList[9]?.id
    },
    {
      asset_type_name: 'HAL Tejas LCA',
      model: 'Mk-1A',
      manufacturer: 'Hindustan Aeronautics Limited',
      serial_number: 'LCA-MK1A-045-2023',
      acquisition_date: '2023-03-25',
      acquisition_cost: 450000000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Light Combat Aircraft Squadron',
      base_id: basesList[10]?.id
    },
    {
      asset_type_name: 'Mirage 2000',
      model: 'H/TH',
      manufacturer: 'Dassault Aviation',
      serial_number: 'M2K-H-234-2019',
      acquisition_date: '2019-02-27',
      acquisition_cost: 580000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Multi-role Fighter Squadron',
      base_id: basesList[10]?.id
    },
    {
      asset_type_name: 'MiG-29 Fulcrum',
      model: 'UPG',
      manufacturer: 'HAL/MiG',
      serial_number: 'MIG29-UPG-678-2021',
      acquisition_date: '2021-09-15',
      acquisition_cost: 520000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Air Defence Squadron',
      base_id: basesList[11]?.id
    },
    
    // Helicopters
    {
      asset_type_name: 'HAL Dhruv Helicopter',
      model: 'ALH Mk-IV',
      manufacturer: 'Hindustan Aeronautics Limited',
      serial_number: 'ALH-MK4-890-2022',
      acquisition_date: '2022-07-18',
      acquisition_cost: 180000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Utility Helicopter Squadron',
      base_id: basesList[12]?.id
    },
    {
      asset_type_name: 'HAL Rudra Attack Helicopter',
      model: 'WSI',
      manufacturer: 'Hindustan Aeronautics Limited',
      serial_number: 'RUDRA-WSI-345-2021',
      acquisition_date: '2021-11-22',
      acquisition_cost: 220000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Attack Helicopter Squadron',
      base_id: basesList[9]?.id
    },
    
    // Transport Aircraft
    {
      asset_type_name: 'C-130J Super Hercules',
      model: '30',
      manufacturer: 'Lockheed Martin',
      serial_number: 'C130J-30-456-2019',
      acquisition_date: '2019-06-12',
      acquisition_cost: 1200000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Special Operations Squadron',
      base_id: basesList[11]?.id
    },
    {
      asset_type_name: 'Boeing P-8I Neptune',
      model: 'P-8I',
      manufacturer: 'Boeing Defense',
      serial_number: 'P8I-NEP-123-2020',
      acquisition_date: '2020-01-30',
      acquisition_cost: 2800000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Maritime Patrol Squadron',
      base_id: basesList[8]?.id
    },
    
    // Small Arms & Weapons
    {
      asset_type_name: 'INSAS Rifle',
      model: '5.56mm',
      manufacturer: 'Ordnance Factory Board',
      serial_number: 'INSAS-67890-2021',
      acquisition_date: '2021-07-01',
      acquisition_cost: 45000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Infantry Regiment Armory',
      base_id: basesList[0]?.id
    },
    {
      asset_type_name: 'AK-203 Assault Rifle',
      model: '7.62mm',
      manufacturer: 'Indo-Russian Rifles Pvt Ltd',
      serial_number: 'AK203-IR-12345-2023',
      acquisition_date: '2023-04-10',
      acquisition_cost: 55000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Special Forces Armory',
      base_id: basesList[1]?.id
    },
    {
      asset_type_name: 'SIG Sauer 716 Rifle',
      model: '7.62mm',
      manufacturer: 'SIG Sauer India',
      serial_number: 'SIG716-IN-67890-2022',
      acquisition_date: '2022-08-15',
      acquisition_cost: 65000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Border Security Forces',
      base_id: basesList[13]?.id
    },
    
    // Missiles
    {
      asset_type_name: 'BrahMos Missile',
      model: 'Block-III',
      manufacturer: 'BrahMos Aerospace',
      serial_number: 'BRAHMOS-001-2023',
      acquisition_date: '2023-01-20',
      acquisition_cost: 140000000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Strategic Missile Regiment',
      base_id: basesList[4]?.id
    },
    {
      asset_type_name: 'Agni-V ICBM',
      model: 'Strategic',
      manufacturer: 'DRDO',
      serial_number: 'AGNI-V-001-2022',
      acquisition_date: '2022-10-27',
      acquisition_cost: 750000000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Strategic Forces Command',
      base_id: basesList[5]?.id
    },
    {
      asset_type_name: 'Akash Surface-to-Air Missile',
      model: 'Mk-II',
      manufacturer: 'DRDO/BEL',
      serial_number: 'AKASH-MK2-234-2023',
      acquisition_date: '2023-05-18',
      acquisition_cost: 85000000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Air Defence Regiment',
      base_id: basesList[10]?.id
    },
    
    // Communication & Electronics
    {
      asset_type_name: 'BEL Communication System',
      model: 'SDR-Tactical',
      manufacturer: 'Bharat Electronics Limited',
      serial_number: 'BEL-SDR-567-2022',
      acquisition_date: '2022-12-05',
      acquisition_cost: 12500000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Signal Regiment HQ',
      base_id: basesList[0]?.id
    },
    {
      asset_type_name: 'DRDO Radar System',
      model: 'Arudhra MPR',
      manufacturer: 'DRDO/BEL',
      serial_number: 'ARUDHRA-MPR-890-2021',
      acquisition_date: '2021-03-14',
      acquisition_cost: 95000000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Air Defence Radar Network',
      base_id: basesList[9]?.id
    },
    
    // Support Equipment
    {
      asset_type_name: 'Field Hospital Unit',
      model: 'Mobile-50',
      manufacturer: 'DRDO/Private Consortium',
      serial_number: 'FH-MOB50-123-2022',
      acquisition_date: '2022-06-20',
      acquisition_cost: 8500000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Medical Corps - Emergency Ready',
      base_id: basesList[2]?.id
    },
    {
      asset_type_name: 'Water Purification System',
      model: 'WPS-1000L',
      manufacturer: 'Ion Exchange India',
      serial_number: 'WPS-1000-456-2023',
      acquisition_date: '2023-01-08',
      acquisition_cost: 450000.00,
      current_status: 'available',
      condition_status: 'new',
      notes: 'Field Engineering Company',
      base_id: basesList[14]?.id
    },
    {
      asset_type_name: 'Generator Set',
      model: 'DG-500KVA',
      manufacturer: 'Cummins India',
      serial_number: 'CUMMINS-DG500-789-2022',
      acquisition_date: '2022-09-12',
      acquisition_cost: 1200000.00,
      current_status: 'available',
      condition_status: 'good',
      notes: 'Base Power Backup System',
      base_id: basesList[1]?.id
    }
  ];

  for (const asset of assets) {
    const assetId = uuidv4();
    const assetTypeId = assetTypeIds[asset.asset_type_name];
    await query(
      `INSERT INTO assets (id, asset_type_id, model, manufacturer, serial_number, 
                          acquisition_date, acquisition_cost, current_status, condition_status, 
                          notes, base_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       ON CONFLICT (serial_number) DO UPDATE SET
         model = EXCLUDED.model,
         manufacturer = EXCLUDED.manufacturer,
         acquisition_cost = EXCLUDED.acquisition_cost,
         current_status = EXCLUDED.current_status,
         condition_status = EXCLUDED.condition_status,
         notes = EXCLUDED.notes,
         base_id = EXCLUDED.base_id,
         updated_at = NOW()`,
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
  const users = await query('SELECT id FROM users WHERE role = \'admin\' LIMIT 1');
  const assetTypes = await query('SELECT id, name FROM asset_types LIMIT 5');
  
  const purchases = [
    {
      asset_type_id: assetTypes.rows.find(at => at.name.includes('T-90'))?.id || assetTypes.rows[0]?.id,
      base_id: bases.rows[0]?.id,
      quantity: 5,
      unit_cost: 1200000.00,
      total_cost: 6000000.00,
      vendor: 'Heavy Vehicles Factory',
      purchase_date: '2023-06-15',
      delivery_date: '2023-08-30',
      status: 'delivered',
      created_by: users.rows[0]?.id,
      notes: 'T-90 Bhishma tanks for armored operations'
    },
    {
      asset_type_id: assetTypes.rows.find(at => at.name.includes('Tejas'))?.id || assetTypes.rows[1]?.id,
      base_id: bases.rows[1]?.id,
      quantity: 2,
      unit_cost: 450000000.00,
      total_cost: 900000000.00,
      vendor: 'Hindustan Aeronautics Limited',
      purchase_date: '2023-03-20',
      delivery_date: '2023-12-15',
      status: 'approved',
      created_by: users.rows[0]?.id,
      notes: 'HAL Tejas LCA Mk-1A fighter aircraft'
    },
    {
      asset_type_id: assetTypes.rows.find(at => at.name.includes('BrahMos'))?.id || assetTypes.rows[2]?.id,
      base_id: bases.rows[2]?.id,
      quantity: 10,
      unit_cost: 140000000.00,
      total_cost: 1400000000.00,
      vendor: 'BrahMos Aerospace',
      purchase_date: '2023-01-10',
      delivery_date: '2023-07-20',
      status: 'delivered',
      created_by: users.rows[0]?.id,
      notes: 'BrahMos Block-III supersonic cruise missiles'
    }
  ];

  for (const purchase of purchases) {
    await query(
      `INSERT INTO purchases (id, base_id, asset_type_id, quantity, unit_cost, total_cost,
                             vendor, purchase_date, delivery_date, status, created_by, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [uuidv4(), purchase.base_id, purchase.asset_type_id, purchase.quantity,
       purchase.unit_cost, purchase.total_cost, purchase.vendor,
       purchase.purchase_date, purchase.delivery_date, purchase.status,
       purchase.created_by, purchase.notes]
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
