/**
 * Colombia: departamentos y sus municipios principales.
 * Fuente: DANE — lista reducida a municipios relevantes por departamento.
 */
const COLOMBIA = [
  {
    departamento: 'Amazonas',
    municipios: ['Leticia', 'Puerto Nariño'],
  },
  {
    departamento: 'Antioquia',
    municipios: [
      'Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Turbo',
      'Rionegro', 'Caucasia', 'Sabaneta', 'La Estrella', 'Copacabana',
      'Girardota', 'Barbosa', 'Caldas', 'Marinilla', 'El Carmen de Viboral',
    ],
  },
  {
    departamento: 'Arauca',
    municipios: ['Arauca', 'Saravena', 'Arauquita', 'Tame', 'Fortul'],
  },
  {
    departamento: 'Atlántico',
    municipios: [
      'Barranquilla', 'Soledad', 'Malambo', 'Galapa', 'Sabanagrande',
      'Puerto Colombia', 'Baranoa', 'Sabanalarga',
    ],
  },
  {
    departamento: 'Bolívar',
    municipios: [
      'Cartagena', 'Magangué', 'Mompós', 'El Carmen de Bolívar',
      'Arjona', 'Turbaco', 'San Juan Nepomuceno',
    ],
  },
  {
    departamento: 'Boyacá',
    municipios: [
      'Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa',
      'Puerto Boyacá', 'Moniquirá', 'Villa de Leyva',
    ],
  },
  {
    departamento: 'Caldas',
    municipios: [
      'Manizales', 'La Dorada', 'Chinchiná', 'Riosucio', 'Villamaría',
      'Anserma', 'Aguadas', 'Supía',
    ],
  },
  {
    departamento: 'Caquetá',
    municipios: ['Florencia', 'San Vicente del Caguán', 'Belén de los Andaquíes', 'Puerto Rico'],
  },
  {
    departamento: 'Casanare',
    municipios: ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena', 'Monterrey', 'Paz de Ariporo'],
  },
  {
    departamento: 'Cauca',
    municipios: [
      'Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía',
      'El Tambo', 'Guapi', 'Bolívar',
    ],
  },
  {
    departamento: 'Cesar',
    municipios: [
      'Valledupar', 'Aguachica', 'Bosconia', 'Codazzi', 'Chiriguaná',
      'La Jagua de Ibirico', 'San Alberto',
    ],
  },
  {
    departamento: 'Chocó',
    municipios: ['Quibdó', 'Istmina', 'Riosucio', 'Tumaco', 'Bahía Solano', 'Nuquí'],
  },
  {
    departamento: 'Córdoba',
    municipios: [
      'Montería', 'Cereté', 'Lorica', 'Sahagún', 'Montelíbano',
      'Tierralta', 'Planeta Rica', 'Ciénaga de Oro',
    ],
  },
  {
    departamento: 'Cundinamarca',
    municipios: [
      'Bogotá D.C.', 'Soacha', 'Zipaquirá', 'Facatativá', 'Chía',
      'Fusagasugá', 'Girardot', 'Madrid', 'Mosquera', 'Funza',
      'Cajicá', 'Tocancipá', 'Sopó', 'La Calera',
    ],
  },
  {
    departamento: 'Guainía',
    municipios: ['Inírida'],
  },
  {
    departamento: 'Guaviare',
    municipios: ['San José del Guaviare', 'Calamar', 'El Retorno', 'Miraflores'],
  },
  {
    departamento: 'Huila',
    municipios: [
      'Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre',
      'Rivera', 'Palermo', 'San Agustín',
    ],
  },
  {
    departamento: 'La Guajira',
    municipios: ['Riohacha', 'Maicao', 'Uribia', 'Manaure', 'Villanueva', 'San Juan del Cesar'],
  },
  {
    departamento: 'Magdalena',
    municipios: [
      'Santa Marta', 'Ciénaga', 'Fundación', 'El Banco', 'Plato',
      'Aracataca', 'Pivijay',
    ],
  },
  {
    departamento: 'Meta',
    municipios: [
      'Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Cumaral',
      'Restrepo', 'San Martín', 'La Macarena',
    ],
  },
  {
    departamento: 'Nariño',
    municipios: [
      'Pasto', 'Tumaco', 'Ipiales', 'Túquerres', 'La Unión',
      'Samaniego', 'Barbacoas',
    ],
  },
  {
    departamento: 'Norte de Santander',
    municipios: [
      'Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios',
      'El Zulia', 'Tibú',
    ],
  },
  {
    departamento: 'Putumayo',
    municipios: ['Mocoa', 'Puerto Asís', 'Orito', 'Valle del Guamuez', 'Sibundoy'],
  },
  {
    departamento: 'Quindío',
    municipios: [
      'Armenia', 'Calarcá', 'Montenegro', 'La Tebaida', 'Quimbaya',
      'Circasia', 'Filandia',
    ],
  },
  {
    departamento: 'Risaralda',
    municipios: [
      'Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia',
      'Marsella', 'Belén de Umbría',
    ],
  },
  {
    departamento: 'San Andrés y Providencia',
    municipios: ['San Andrés', 'Providencia'],
  },
  {
    departamento: 'Santander',
    municipios: [
      'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja',
      'San Gil', 'Socorro', 'Vélez', 'Málaga',
    ],
  },
  {
    departamento: 'Sucre',
    municipios: ['Sincelejo', 'Corozal', 'Sampués', 'Tolú', 'San Marcos', 'Morroa'],
  },
  {
    departamento: 'Tolima',
    municipios: [
      'Ibagué', 'Espinal', 'Melgar', 'Honda', 'Líbano',
      'Chaparral', 'Mariquita', 'Purificación',
    ],
  },
  {
    departamento: 'Valle del Cauca',
    municipios: [
      'Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Buga',
      'Cartago', 'Yumbo', 'Jamundí', 'Florida', 'Candelaria',
      'El Cerrito', 'Pradera', 'Ginebra',
    ],
  },
  {
    departamento: 'Vaupés',
    municipios: ['Mitú'],
  },
  {
    departamento: 'Vichada',
    municipios: ['Puerto Carreño', 'La Primavera', 'Santa Rosalía', 'Cumaribo'],
  },
];

export const DEPARTAMENTOS = COLOMBIA.map((d) => d.departamento);

export const getMunicipios = (departamento) => {
  const found = COLOMBIA.find((d) => d.departamento === departamento);
  return found ? found.municipios : [];
};

export default COLOMBIA;
