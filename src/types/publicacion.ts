export type TipoPublicacion =
  | 'PROMOCION'
  | 'CONSEJO'
  | 'VACUNA'
  | 'ALERTA'
  | 'EVENTO'
  | 'NUEVO_SERVICIO'
  | 'EDUCATIVO'
  | 'ANUNCIO'

export type TipoBotonAccion = 'NONE' | 'WHATSAPP' | 'WEB'

export interface Publicacion {
  id_publicacion: number
  id_veterinaria: number
  tipo: TipoPublicacion
  titulo: string
  resumen?: string | null
  contenido?: string | null
  imagen_url?: string | null
  boton_texto?: string | null
  boton_accion?: string | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
  activo: boolean
  created_at?: string
}

export interface PublicacionFormData {
  tipo: TipoPublicacion
  titulo: string
  resumen: string
  contenido: string
  imagen_url?: string | null
  botonTipo: TipoBotonAccion
  boton_texto: string
  boton_accion: string
  fecha_inicio?: string | null
  fecha_fin?: string | null
  activo: boolean
}

export interface PublicacionFilters {
  tipo?: TipoPublicacion | 'TODOS'
  activo?: 'ALL' | 'ACTIVE' | 'INACTIVE'
  search?: string
}
