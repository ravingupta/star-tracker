export type CatalogItem = { name: string; ra: number; dec: number; type: 'star' | 'galaxy' | 'nebula' | 'cluster' };

// Small object catalog (RA in hours, Dec in degrees)
export const CATALOG: CatalogItem[] = [
  // Galaxies
  { name: 'Andromeda (M31)', ra: 0.712, dec: 41.269, type: 'galaxy' },
  { name: 'Triangulum (M33)', ra: 1.6, dec: 30.66, type: 'galaxy' },
  { name: 'Whirlpool (M51)', ra: 13.498, dec: 47.196, type: 'galaxy' },
  { name: 'Pinwheel (M101)', ra: 14.054, dec: 54.349, type: 'galaxy' },
  { name: 'Sombrero (M104)', ra: 12.666, dec: -11.623, type: 'galaxy' },
  { name: 'Black Eye (M64)', ra: 12.670, dec: 21.683, type: 'galaxy' },

  // Stars
  { name: 'Vega', ra: 18.615649, dec: 38.78369, type: 'star' },
  { name: 'Altair', ra: 19.846, dec: 8.868, type: 'star' },
  { name: 'Polaris', ra: 2.530, dec: 89.264, type: 'star' },
  { name: 'Sirius', ra: 6.752, dec: -16.716, type: 'star' },
  { name: 'Betelgeuse', ra: 5.919, dec: 7.407, type: 'star' },
  { name: 'Rigel', ra: 5.242, dec: -8.202, type: 'star' },
  { name: 'Arcturus', ra: 14.261, dec: 19.182, type: 'star' },
  { name: 'Capella', ra: 5.278, dec: 45.998, type: 'star' },
  { name: 'Procyon', ra: 7.655, dec: 5.225, type: 'star' },
  { name: 'Castor', ra: 7.576, dec: 31.888, type: 'star' },
  { name: 'Pollux', ra: 7.755, dec: 28.026, type: 'star' },
  { name: 'Regulus', ra: 10.139, dec: 11.967, type: 'star' },
  { name: 'Spica', ra: 13.420, dec: -11.161, type: 'star' },
  { name: 'Antares', ra: 16.490, dec: -26.432, type: 'star' },
  { name: 'Deneb', ra: 20.690, dec: 45.280, type: 'star' },

  // Star Clusters
  { name: 'M13 (Hercules)', ra: 16.6981, dec: 36.4613, type: 'cluster' },
  { name: 'Pleiades (M45)', ra: 3.791, dec: 24.105, type: 'cluster' },
  { name: 'Hyades', ra: 4.583, dec: 15.867, type: 'cluster' },
  { name: 'Beehive (M44)', ra: 8.673, dec: 19.991, type: 'cluster' },
  { name: 'M41', ra: 18.875, dec: 20.775, type: 'cluster' },

  // Nebulae
  { name: 'Orion Nebula (M42)', ra: 5.591, dec: -5.387, type: 'nebula' },
  { name: 'Ring Nebula (M57)', ra: 18.894, dec: 33.029, type: 'nebula' },
  { name: 'Dumbbell Nebula (M27)', ra: 19.991, dec: 22.721, type: 'nebula' },
  { name: 'Helix Nebula (NGC 7293)', ra: 22.146, dec: -20.917, type: 'nebula' },
  { name: 'Lagoon Nebula (M8)', ra: 18.084, dec: -24.386, type: 'nebula' },
  { name: 'Trifid Nebula (M20)', ra: 18.046, dec: -23.030, type: 'nebula' },
];

// Popular alignment stars
export const ALIGNMENT_STARS: CatalogItem[] = [
  { name: 'Vega', ra: 18.615649, dec: 38.78369, type: 'star' },
  { name: 'Altair', ra: 19.846, dec: 8.868, type: 'star' },
  { name: 'Polaris', ra: 2.530, dec: 89.264, type: 'star' },
  { name: 'Arcturus', ra: 14.261, dec: 19.182, type: 'star' },
  { name: 'Capella', ra: 5.278, dec: 45.998, type: 'star' },
  { name: 'Betelgeuse', ra: 5.919, dec: 7.407, type: 'star' },
  { name: 'Rigel', ra: 5.242, dec: -8.202, type: 'star' },
  { name: 'Sirius', ra: 6.752, dec: -16.716, type: 'star' },
  { name: 'Procyon', ra: 7.655, dec: 5.225, type: 'star' },
  { name: 'Regulus', ra: 10.139, dec: 11.967, type: 'star' },
  { name: 'Spica', ra: 13.420, dec: -11.161, type: 'star' },
  { name: 'Antares', ra: 16.490, dec: -26.432, type: 'star' },
  { name: 'Deneb', ra: 20.690, dec: 45.280, type: 'star' },
  { name: 'Fomalhaut', ra: 22.960, dec: -29.622, type: 'star' },
  { name: 'Aldebaran', ra: 4.600, dec: 16.509, type: 'star' },
  { name: 'Castor', ra: 7.576, dec: 31.888, type: 'star' },
  { name: 'Pollux', ra: 7.755, dec: 28.026, type: 'star' },
  { name: 'Bellatrix', ra: 5.418, dec: 6.350, type: 'star' },
  { name: 'Elnath', ra: 5.439, dec: 28.608, type: 'star' },
  { name: 'Alnitak', ra: 5.679, dec: -1.943, type: 'star' },
];
