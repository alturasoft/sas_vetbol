/**
 * Catálogos estandarizados para el registro de clientes y pacientes (mascotas).
 * Basado en la especificación técnica clínica multi-tenant.
 */

export interface DepartamentoOption {
  id: number
  nombre: string
}

export const BOLIVIAN_DEPARTMENTS: DepartamentoOption[] = [
  { id: 1, nombre: 'La Paz' },
  { id: 2, nombre: 'Santa Cruz' },
  { id: 3, nombre: 'Cochabamba' },
  { id: 4, nombre: 'Oruro' },
  { id: 5, nombre: 'Potosí' },
  { id: 6, nombre: 'Tarija' },
  { id: 7, nombre: 'Chuquisaca' },
  { id: 8, nombre: 'Beni' },
  { id: 9, nombre: 'Pando' },
]

export const PET_SPECIES = [
  'Perros',
  'Gatos',
  'Aves',
  'Peces',
  'Hámsters',
  'Conejos',
  'Tortugas',
  'Loros',
  'Hurones',
  'Otros',
] as const

export type PetSpeciesType = (typeof PET_SPECIES)[number]

export const DOG_BREEDS: string[] = [
  'Mestizo/Criollo',
  'Labrador Retriever',
  'Pastor Alemán',
  'Golden Retriever',
  'Chihuahua',
  'Poodle (Caniche)',
  'Bulldog Francés',
  'Pug (Carlino)',
  'Yorkshire Terrier',
  'Beagle',
  'Rottweiler',
  'Bóxer',
  'Schnauzer Miniatura',
  'Pitbull Terrier Americano',
  'Siberian Husky',
]

export const CAT_BREEDS: string[] = [
  'Mestizo/criollo',
  'Persa',
  'Siamés',
  'Bengala (Bengalí)',
  'Maine Coon',
  'Angora Turco',
  'Ragdoll',
  'Azul Ruso',
  'Esfinge (Sphynx)',
  'Himalayo',
  'British Shorthair',
  'Abisinio',
  'Bombay',
  'Birmano',
]
