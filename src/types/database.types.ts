/**
 * Tipos de Base de Datos para Supabase — Esquema 'veterinarias'
 * Generado a partir del esquema oficial de PostgreSQL (30 tablas y 3 vistas).
 */

export type TipoTemporalidad = 'mensual' | 'anual';
export type EstadoSuscripcion = 'trial' | 'active' | 'past_due' | 'canceled' | 'expired' | 'suspended';

export type RolCodigo = 
  | 'SUPERADMIN'
  | 'ADMINISTRADOR'
  | 'SUPERVISOR'
  | 'VETERINARIO'
  | 'ASISTENTE'
  | 'RECEPCION'
  | 'CLIENTE';

export type PermisoCodigo =
  | 'TENANT_MANAGEMENT'
  | 'VER_CLIENTES'
  | 'CREAR_CLIENTES'
  | 'EDITAR_CLIENTES'
  | 'ELIMINAR_CLIENTES'
  | 'VER_MASCOTAS'
  | 'CREAR_MASCOTAS'
  | 'EDITAR_MASCOTAS'
  | 'ELIMINAR_MASCOTAS'
  | 'VER_CITAS'
  | 'CREAR_CITAS'
  | 'EDITAR_CITAS'
  | 'CANCELAR_CITAS'
  | 'VER_HISTORIA_CLINICA'
  | 'CREAR_CONSULTA'
  | 'EDITAR_CONSULTA'
  | 'VER_RECETAS'
  | 'CREAR_RECETAS'
  | 'HOSPITALIZACION_OP'
  | 'CIRUGIA_OP'
  | 'VER_INVENTARIO'
  | 'EDITAR_INVENTARIO'
  | 'CONFIGURACION_GENERAL'
  | 'VER_REPORTES'
  | 'VER_PUBLICACIONES'
  | 'ADMINISTRAR_PUBLICACIONES'
  | 'ADMINISTRAR_USUARIOS'
  | 'ADMINISTRAR_ROLES';

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type TableDef<TRow> = {
  Row: TRow;
  Insert: Partial<TRow> & Record<string, unknown>;
  Update: Partial<TRow> & Record<string, unknown>;
  Relationships: GenericRelationship[];
};

export type ViewDef<TRow> = {
  Row: TRow;
  Relationships: GenericRelationship[];
};

export type AvisosCliente = {
  id_aviso: number;
  id_veterinaria: number;
  id_cliente: number;
  titulo: string;
  cuerpo: string | null;
  leido: boolean;
  created_at: string | null;
  [key: string]: unknown;
};

export type BloqueosAgenda = {
  id_bloqueo: number;
  id_veterinaria: number;
  id_persona: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_bloqueo: string | null;
  motivo: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type Cirugias = {
  id_cirugia: number;
  id_historia_clinica: number | null;
  tipo_cirugia: string | null;
  procedimiento: string | null;
  anestesia: string | null;
  complicaciones: string | null;
  resultado: string | null;
  fecha_cirugia: string | null;
  observaciones: string | null;
  created_at: string | null;
  id_veterinaria: number | null;
  id_mascota: number | null;
  cirujano: string | null;
  estado: string | null;
  updated_at: string | null;
  [key: string]: unknown;
};

export type Citas = {
  id_cita: number;
  id_veterinaria: number;
  id_cliente: number;
  id_mascota: number;
  id_persona: number;
  id_servicio: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  origen: string | null;
  motivo: string | null;
  observaciones: string | null;
  confirmado_cliente: boolean | null;
  recordatorio_enviado: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  [key: string]: unknown;
};

export type CitasHistorial = {
  id_historial: number;
  id_cita: number;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  observacion: string | null;
  changed_at: string | null;
  changed_by: number | null;
  [key: string]: unknown;
};

export type CitasNotificaciones = {
  id_notificacion: number;
  id_cita: number;
  tipo: string | null;
  enviado: boolean | null;
  fecha_envio: string | null;
  mensaje: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type Clientes = {
  id_cliente: number;
  id_veterinaria: number;
  nombres: string;
  apellidos: string;
  numero_ci: string | null;
  telefono: string | null;
  email: string | null;
  foto_url: string | null;
  fecha_crea: string | null;
  password: string | null;
  fcm_token: string | null;
  depto: number | null;
  [key: string]: unknown;
};

export type Departamentos = {
  id_depto: number;
  departamento: string;
  [key: string]: unknown;
};

export type HistoriaArchivos = {
  id_archivo: number;
  id_historia_clinica: number;
  tipo_archivo: string | null;
  nombre_archivo: string | null;
  url_archivo: string;
  extension: string | null;
  tamano_kb: number | null;
  observaciones: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type HistoriaDiagnosticos = {
  id_diagnostico: number;
  id_historia_clinica: number;
  tipo_diagnostico: string | null;
  diagnostico: string;
  codigo_cie_vet: string | null;
  gravedad: string | null;
  observaciones: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type HistoriaEvolucionHospitalizacion = {
  id_evolucion: number;
  id_hospitalizacion: number;
  fecha_evolucion: string | null;
  descripcion: string | null;
  id_personal: number | null;
  created_at: string | null;
  nota: string | null;
  temperatura: string | null;
  peso: string | null;
  frecuencia_cardiaca: string | null;
  frecuencia_respiratoria: string | null;
  tratamiento: string | null;
  [key: string]: unknown;
};

export type HistoriaExamenes = {
  id_examen: number;
  id_historia_clinica: number;
  tipo_examen: string | null;
  resultado: string | null;
  archivo_resultado: string | null;
  fecha_examen: string | null;
  laboratorio: string | null;
  observaciones: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type HistoriaRecetas = {
  id_receta: number;
  id_historia_clinica: number;
  medicamento: string;
  dosis: string | null;
  frecuencia: string | null;
  via_administracion: string | null;
  duracion: string | null;
  instrucciones: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type HistoriaSignosVitales = {
  id_signo_vital: number;
  id_historia_clinica: number;
  peso: number | null;
  temperatura: number | null;
  frecuencia_cardiaca: number | null;
  frecuencia_respiratoria: number | null;
  presion_arterial: string | null;
  hidratacion: string | null;
  mucosas: string | null;
  condicion_corporal: string | null;
  observaciones: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type HistoriaTratamientos = {
  id_tratamiento: number;
  id_historia_clinica: number;
  tratamiento: string;
  indicaciones: string | null;
  duracion_dias: number | null;
  estado: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type HistorialVacunas = {
  id_vacuna: number;
  id_veterinaria: number;
  id_mascota: number;
  fecha: string;
  nombre_vacuna: string;
  descripcion: string | null;
  dosis: string | null;
  requiere_refuerzo: string | null;
  frecuencia: string | null;
  estado: string | null;
  created_at: string;
  [key: string]: unknown;
};

export type HistoriasClinicas = {
  id_historia_clinica: number;
  id_veterinaria: number;
  id_mascota: number;
  id_cliente: number;
  id_personal: number | null;
  numero_historia: string | null;
  fecha_consulta: string;
  tipo_consulta: string | null;
  motivo_consulta: string | null;
  anamnesis: string | null;
  estado_general: string | null;
  observaciones: string | null;
  estado: string | null;
  created_at: string | null;
  updated_at: string | null;
  [key: string]: unknown;
};

export type HorariosPersonal = {
  id_horario: number;
  id_persona: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type Hospitalizaciones = {
  id_hospitalizacion: number;
  id_historia_clinica: number | null;
  fecha_ingreso: string | null;
  fecha_alta: string | null;
  motivo: string | null;
  evolucion: string | null;
  observaciones: string | null;
  estado: string | null;
  created_at: string | null;
  id_veterinaria: number | null;
  id_mascota: number | null;
  motivo_ingreso: string | null;
  habitacion: string | null;
  updated_at: string | null;
  [key: string]: unknown;
};

export type Mascotas = {
  id_mascota: number;
  id_veterinaria: number;
  id_cliente: number;
  nombre: string;
  especie: string;
  raza: string | null;
  edad: number | null;
  edad_meses: number | null;
  fecha_nac: string | null;
  peso: number | null;
  foto_url: string | null;
  alertas: string | null;
  fecha_crea: string | null;
  sexo: string | null;
  estado: string;
  [key: string]: unknown;
};

export type NotificacionesTrace = {
  id: number;
  id_publicacion: number | null;
  id_veterinaria: number | null;
  topic: string | null;
  titulo: string | null;
  tipo: string | null;
  evento: string;
  detalle: Record<string, any> | any[] | string | number | boolean | null | null;
  created_at: string;
  [key: string]: unknown;
};

export type Permisos = {
  id_permiso: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  modulo: string;
  fecha_crea: string | null;
  [key: string]: unknown;
};

export type Personal = {
  id_persona: number;
  id_veterinaria: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  rol: string | null;
  estado: string | null;
  user_id: string | null;
  foto_url: string | null;
  [key: string]: unknown;
};

export type Publicaciones = {
  id_publicacion: number;
  id_veterinaria: number;
  tipo: string;
  titulo: string;
  resumen: string | null;
  contenido: string | null;
  imagen_url: string | null;
  boton_texto: string | null;
  boton_accion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type Roles = {
  id_rol: number;
  id_veterinaria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  es_sistema: boolean;
  fecha_crea: string | null;
  [key: string]: unknown;
};

export type RolesPermisos = {
  id_rol: number;
  id_permiso: number;
  [key: string]: unknown;
};

export type Servicios = {
  id_servicio: number;
  id_veterinaria: number;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number | null;
  color: string | null;
  activo: boolean | null;
  created_at: string | null;
  [key: string]: unknown;
};

export type Suscripciones = {
  id: string;
  id_entidad: string;
  plan_id: string | null;
  temporalidad: 'mensual' | 'anual';
  estado: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired' | 'suspended';
  fecha_creacion: string;
  fecha_inicio_suscripcion: string | null;
  fecha_vencimiento_trial: string | null;
  fecha_ultimo_pago: string | null;
  fecha_proximo_vencimiento: string | null;
  renovacion_automatica: boolean;
  stripe_subscription_id: string | null;
  updated_at: string;
  [key: string]: unknown;
};

export type UsuariosRoles = {
  id_persona: number;
  id_rol: number;
  [key: string]: unknown;
};

export type Veterinarias = {
  id_veterinaria: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  estado: string | null;
  created_at: string | null;
  depto: number | null;
  zona: string | null;
  presentacion: string | null;
  [key: string]: unknown;
};

// Vistas Unificadas del Esquema 'veterinarias'
export type VwTimelineClinico = {
  id_historia_clinica: number | null;
  id_veterinaria: number;
  id_mascota: number;
  id_cliente: number;
  fecha_consulta: string;
  tipo_consulta: string;
  motivo_consulta: string;
  estado: string;
  mascota: string;
  propietario: string;
  origen_registro: 'CONSULTA' | 'HOSPITALIZACION' | 'CIRUGIA';
  id_origen: number;
  [key: string]: unknown;
};

export type VwAgendaGeneral = {
  id_cita: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA' | string;
  mascota: string;
  propietario: string;
  veterinario: string;
  servicio: string;
  [key: string]: unknown;
};

export type VNotificacionesTrace = {
  id: number;
  evento: string;
  id_publicacion: number | null;
  id_veterinaria: number;
  topic: string | null;
  titulo: string;
  tipo: string;
  detalle: string | null;
  created_at: string;
  created_local: string;
  [key: string]: unknown;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  veterinarias: {
    Tables: {
      avisos_cliente: TableDef<AvisosCliente>;
      bloqueos_agenda: TableDef<BloqueosAgenda>;
      cirugias: TableDef<Cirugias>;
      citas: TableDef<Citas>;
      citas_historial: TableDef<CitasHistorial>;
      citas_notificaciones: TableDef<CitasNotificaciones>;
      clientes: TableDef<Clientes>;
      departamentos: TableDef<Departamentos>;
      historia_archivos: TableDef<HistoriaArchivos>;
      historia_diagnosticos: TableDef<HistoriaDiagnosticos>;
      historia_evolucion_hospitalizacion: TableDef<HistoriaEvolucionHospitalizacion>;
      historia_examenes: TableDef<HistoriaExamenes>;
      historia_recetas: TableDef<HistoriaRecetas>;
      historia_signos_vitales: TableDef<HistoriaSignosVitales>;
      historia_tratamientos: TableDef<HistoriaTratamientos>;
      historial_vacunas: TableDef<HistorialVacunas>;
      historias_clinicas: TableDef<HistoriasClinicas>;
      horarios_personal: TableDef<HorariosPersonal>;
      hospitalizaciones: TableDef<Hospitalizaciones>;
      mascotas: TableDef<Mascotas>;
      notificaciones_trace: TableDef<NotificacionesTrace>;
      permisos: TableDef<Permisos>;
      personal: TableDef<Personal>;
      publicaciones: TableDef<Publicaciones>;
      roles: TableDef<Roles>;
      roles_permisos: TableDef<RolesPermisos>;
      servicios: TableDef<Servicios>;
      suscripciones: TableDef<Suscripciones>;
      usuarios_roles: TableDef<UsuariosRoles>;
      veterinarias: TableDef<Veterinarias>;
    };
    Views: {
      vw_timeline_clinico: ViewDef<VwTimelineClinico>;
      vw_agenda_general: ViewDef<VwAgendaGeneral>;
      v_notificaciones_trace: ViewDef<VNotificacionesTrace>;
    };
    Functions: {
      get_my_vet_id: {
        Args: Record<string, unknown>;
        Returns: number | null;
      };
      validar_solapamiento_citas: {
        Args: {
          p_id_veterinaria: number;
          p_id_persona: number;
          p_fecha_inicio: string;
          p_fecha_fin: string;
          p_id_cita_excluir?: number | null;
        };
        Returns: boolean;
      };
    };
    Enums: {
      tipo_temporalidad: TipoTemporalidad;
      estado_suscripcion: EstadoSuscripcion;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      avisos_cliente: TableDef<AvisosCliente>;
      bloqueos_agenda: TableDef<BloqueosAgenda>;
      cirugias: TableDef<Cirugias>;
      citas: TableDef<Citas>;
      citas_historial: TableDef<CitasHistorial>;
      citas_notificaciones: TableDef<CitasNotificaciones>;
      clientes: TableDef<Clientes>;
      departamentos: TableDef<Departamentos>;
      historia_archivos: TableDef<HistoriaArchivos>;
      historia_diagnosticos: TableDef<HistoriaDiagnosticos>;
      historia_evolucion_hospitalizacion: TableDef<HistoriaEvolucionHospitalizacion>;
      historia_examenes: TableDef<HistoriaExamenes>;
      historia_recetas: TableDef<HistoriaRecetas>;
      historia_signos_vitales: TableDef<HistoriaSignosVitales>;
      historia_tratamientos: TableDef<HistoriaTratamientos>;
      historial_vacunas: TableDef<HistorialVacunas>;
      historias_clinicas: TableDef<HistoriasClinicas>;
      horarios_personal: TableDef<HorariosPersonal>;
      hospitalizaciones: TableDef<Hospitalizaciones>;
      mascotas: TableDef<Mascotas>;
      notificaciones_trace: TableDef<NotificacionesTrace>;
      permisos: TableDef<Permisos>;
      personal: TableDef<Personal>;
      publicaciones: TableDef<Publicaciones>;
      roles: TableDef<Roles>;
      roles_permisos: TableDef<RolesPermisos>;
      servicios: TableDef<Servicios>;
      suscripciones: TableDef<Suscripciones>;
      usuarios_roles: TableDef<UsuariosRoles>;
      veterinarias: TableDef<Veterinarias>;
    };
    Views: {
      vw_timeline_clinico: ViewDef<VwTimelineClinico>;
      vw_agenda_general: ViewDef<VwAgendaGeneral>;
      v_notificaciones_trace: ViewDef<VNotificacionesTrace>;
    };
    Functions: {
      get_mis_permisos: {
        Args: Record<string, unknown>;
        Returns: {
          rol_nombre: string;
          permisos_codigos: string[];
        }[];
      };
      get_personal_veterinaria: {
        Args: {
          p_id_veterinaria: number;
        };
        Returns: {
          id_persona: number;
          id_veterinaria: number;
          nombres: string;
          apellidos: string;
          email: string;
          telefono: string | null;
          rol: string;
          estado: string;
          user_id: string | null;
          foto_url: string | null;
        }[];
      };
      registrar_personal_con_auth: {
        Args: {
          p_nombres: string;
          p_apellidos: string;
          p_email: string;
          p_password: string;
          p_telefono?: string | null;
          p_rol?: string;
          p_id_rol?: number | null;
        };
        Returns: Record<string, any>;
      };
      dar_de_baja_personal: {
        Args: {
          p_id_persona: number;
        };
        Returns: Record<string, any>;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
