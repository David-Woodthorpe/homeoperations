/**
 * The starter structure for a house O&M manual. These are sections only: the
 * user fills in their own pages and appliances. Descriptions double as
 * guidance, so someone opening an empty section knows what belongs there.
 *
 * Icons must exist in `src/lib/icons.ts`.
 */
export const structureVersion = 2;

export const seedSections = [
  {
    name: 'House Essentials',
    icon: 'home',
    description:
      'The first things anyone needs: water stopcock, gas and electricity isolators, meters, router, alarm panel and key contacts.'
  },
  {
    name: 'Heating & Hot Water',
    icon: 'flame',
    description:
      'Boiler, heat pump, radiators, underfloor heating, hot water cylinder, thermostats and controls.'
  },
  {
    name: 'Ventilation & Air',
    icon: 'wind',
    description:
      'MVHR, extractor fans, air conditioning, filters and how to keep air moving through the house.'
  },
  {
    name: 'Electrical',
    icon: 'bolt',
    description:
      'Consumer unit, circuits, sockets, lighting, solar panels, battery storage and EV charging.'
  },
  {
    name: 'Water & Drainage',
    icon: 'droplet',
    description:
      'Stopcock, water softener, outside taps, drains, gutters, sump pumps and leak protection.'
  },
  {
    name: 'Kitchen',
    icon: 'cook',
    description:
      'Ovens, hob, extractor, fridge, freezer, dishwasher, boiling tap and waste disposal.'
  },
  {
    name: 'Laundry & Utility',
    icon: 'washer',
    description:
      'Washing machine, tumble dryer, utility sink, vacuum, iron and household batteries.'
  },
  {
    name: 'Smart Home & Network',
    icon: 'wifi',
    description:
      'Hub, router, mesh Wi-Fi, integrations, automations, accounts, backups and what to do when it stops responding.'
  },
  {
    name: 'Security & Alarms',
    icon: 'shield',
    description:
      'Alarm system, cameras, doorbell, smart locks, smoke and CO alarms, safe and key locations.'
  },
  {
    name: 'Garden & Exterior',
    icon: 'leaf',
    description:
      'Mower, irrigation, shed, gates, exterior lighting, decking, fencing and seasonal jobs.'
  },
  {
    name: 'Maintenance Schedule',
    icon: 'calendar',
    description:
      'Seasonal jobs and the reasoning behind them. The live due list is under Maintenance in the menu.'
  },
  {
    name: 'Service Contacts',
    icon: 'phone',
    description:
      'Boiler engineer, electrician, plumber, smart home installer, gardener and anyone else who knows the house.'
  },
  {
    name: 'Warranties & Receipts',
    icon: 'receipt',
    description:
      'Where paperwork is kept, warranty expiry dates, guarantees and proof of purchase.'
  },
  {
    name: 'Unsorted',
    icon: 'folder',
    description:
      'Anything moved from an older version of the book, or not yet filed in the right section.'
  }
] as const;

/** Suggestions for the appliance register's category field. */
export const applianceCategories = [
  'Heating',
  'Hot water',
  'Ventilation',
  'Electrical',
  'Water',
  'Kitchen',
  'Laundry',
  'Smart home',
  'Network',
  'Security',
  'Garden',
  'Exterior',
  'Other'
] as const;

/** Suggestions for standalone maintenance tasks. */
export const maintenanceCategories = [
  'Safety',
  'Seasonal',
  'Heating',
  'Ventilation',
  'Water',
  'Electrical',
  'Exterior',
  'Garden',
  'Smart home',
  'Other'
] as const;

/** Starter ideas for standalone maintenance tasks. */
export const maintenanceSuggestions = [
  'Test smoke and CO alarms',
  'Clean gutters',
  'Service the boiler',
  'Replace MVHR filters',
  'Bleed radiators',
  'Check the water softener salt',
  'Clean the dryer lint duct',
  'Drain and store garden hoses',
  'Check external lights',
  'Test the alarm system',
  'Back up smart home configuration',
  'Check fire extinguishers'
] as const;
