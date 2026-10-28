// PROVISIONAL: generado en B1 desde las 3 migraciones aplicadas en un Postgres local,
// porque la sesión no tenía acceso a Supabase. Reemplázalo con: npm run tipos:db

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          seq: number
          notaria_id: string
          usuario_id: string | null
          tabla: string
          accion: string
          registro_id: string
          antes: Json | null
          despues: Json | null
          creado_en: string
          hash_anterior: string | null
          hash: string
        }
        Insert: {
          seq?: number
          notaria_id: string
          usuario_id?: string | null
          tabla: string
          accion: string
          registro_id: string
          antes?: Json | null
          despues?: Json | null
          creado_en: string
          hash_anterior?: string | null
          hash: string
        }
        Update: {
          seq?: number
          notaria_id?: string
          usuario_id?: string | null
          tabla?: string
          accion?: string
          registro_id?: string
          antes?: Json | null
          despues?: Json | null
          creado_en?: string
          hash_anterior?: string | null
          hash?: string
        }
        Relationships: []
      }
      catalogo_tramites: {
        Row: {
          id: string
          notaria_id: string | null
          codigo: string
          nombre: string
          sinonimos: string[]
          descripcion: string
          requisitos: string[]
          casos_especiales: string[]
          notas: string[]
          tarifa: Json
          fuentes: string[]
          validado_por_notaria: boolean
          activo: boolean
          vigencia_desde: string
        }
        Insert: {
          id?: string
          notaria_id?: string | null
          codigo: string
          nombre: string
          sinonimos?: string[]
          descripcion: string
          requisitos: string[]
          casos_especiales?: string[]
          notas?: string[]
          tarifa: Json
          fuentes?: string[]
          validado_por_notaria?: boolean
          activo?: boolean
          vigencia_desde: string
        }
        Update: {
          id?: string
          notaria_id?: string | null
          codigo?: string
          nombre?: string
          sinonimos?: string[]
          descripcion?: string
          requisitos?: string[]
          casos_especiales?: string[]
          notas?: string[]
          tarifa?: Json
          fuentes?: string[]
          validado_por_notaria?: boolean
          activo?: boolean
          vigencia_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_tramites_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
        ]
      }
      consecutivos: {
        Row: {
          notaria_id: string
          anio: number
          ultimo: number
        }
        Insert: {
          notaria_id: string
          anio: number
          ultimo: number
        }
        Update: {
          notaria_id?: string
          anio?: number
          ultimo?: number
        }
        Relationships: [
          {
            foreignKeyName: "consecutivos_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
        ]
      }
      conversaciones: {
        Row: {
          id: string
          notaria_id: string
          telefono: string
          nombre_perfil: string | null
          estado: string
          atendida_por: string | null
          iniciada_en: string
          ultima_actividad: string
        }
        Insert: {
          id?: string
          notaria_id: string
          telefono: string
          nombre_perfil?: string | null
          estado?: string
          atendida_por?: string | null
          iniciada_en?: string
          ultima_actividad?: string
        }
        Update: {
          id?: string
          notaria_id?: string
          telefono?: string
          nombre_perfil?: string | null
          estado?: string
          atendida_por?: string | null
          iniciada_en?: string
          ultima_actividad?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversaciones_atendida_por_fkey"
            columns: ["atendida_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversaciones_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidacion_items: {
        Row: {
          id: string
          notaria_id: string
          tramite_id: string
          concepto: string
          tipo: string
          valor: number
          creado_en: string
        }
        Insert: {
          id?: string
          notaria_id: string
          tramite_id: string
          concepto: string
          tipo: string
          valor: number
          creado_en?: string
        }
        Update: {
          id?: string
          notaria_id?: string
          tramite_id?: string
          concepto?: string
          tipo?: string
          valor?: number
          creado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "liquidacion_items_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidacion_items_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: false
            referencedRelation: "tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          id: string
          notaria_id: string
          conversacion_id: string
          direccion: string
          autor: string
          empleado_id: string | null
          wa_message_id: string | null
          tipo: string
          contenido: string | null
          intencion: string | null
          tramite_codigo: string | null
          herramientas: Json | null
          creado_en: string
          fecha_operativa: string
        }
        Insert: {
          id?: string
          notaria_id: string
          conversacion_id: string
          direccion: string
          autor: string
          empleado_id?: string | null
          wa_message_id?: string | null
          tipo?: string
          contenido?: string | null
          intencion?: string | null
          tramite_codigo?: string | null
          herramientas?: Json | null
          creado_en?: string
          fecha_operativa?: string
        }
        Update: {
          id?: string
          notaria_id?: string
          conversacion_id?: string
          direccion?: string
          autor?: string
          empleado_id?: string | null
          wa_message_id?: string | null
          tipo?: string
          contenido?: string | null
          intencion?: string | null
          tramite_codigo?: string | null
          herramientas?: Json | null
          creado_en?: string
          fecha_operativa?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
        ]
      }
      notaria_perfil: {
        Row: {
          notaria_id: string
          nombre_publico: string
          ciudad: string
          direccion: string | null
          telefono: string | null
          correo: string | null
          horario: string | null
          mapa_url: string | null
          politica_datos_url: string | null
          actualizado_en: string
        }
        Insert: {
          notaria_id: string
          nombre_publico: string
          ciudad: string
          direccion?: string | null
          telefono?: string | null
          correo?: string | null
          horario?: string | null
          mapa_url?: string | null
          politica_datos_url?: string | null
          actualizado_en?: string
        }
        Update: {
          notaria_id?: string
          nombre_publico?: string
          ciudad?: string
          direccion?: string | null
          telefono?: string | null
          correo?: string | null
          horario?: string | null
          mapa_url?: string | null
          politica_datos_url?: string | null
          actualizado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "notaria_perfil_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: true
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
        ]
      }
      notarias: {
        Row: {
          id: string
          codigo: string
          nombre: string
        }
        Insert: {
          id?: string
          codigo: string
          nombre: string
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          id: string
          notaria_id: string
          tramite_id: string
          evento_id: string
          parte_id: string
          telefono: string
          motivo: string
          detalle: string | null
          estado: string
          intentos: number
          wa_message_id: string | null
          error: string | null
          creado_en: string
          procesada_en: string | null
        }
        Insert: {
          id?: string
          notaria_id: string
          tramite_id: string
          evento_id: string
          parte_id: string
          telefono: string
          motivo: string
          detalle?: string | null
          estado?: string
          intentos?: number
          wa_message_id?: string | null
          error?: string | null
          creado_en?: string
          procesada_en?: string | null
        }
        Update: {
          id?: string
          notaria_id?: string
          tramite_id?: string
          evento_id?: string
          parte_id?: string
          telefono?: string
          motivo?: string
          detalle?: string | null
          estado?: string
          intentos?: number
          wa_message_id?: string | null
          error?: string | null
          creado_en?: string
          procesada_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "tramite_eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_parte_id_fkey"
            columns: ["parte_id"]
            isOneToOne: false
            referencedRelation: "tramite_partes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: false
            referencedRelation: "tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          id: string
          notaria_id: string
          tramite_id: string
          sesion_caja_id: string
          registrado_por: string
          tipo: string
          monto: number
          metodo: string
          factura_sin: string | null
          reversa_de: string | null
          motivo: string | null
          autorizado_por: string | null
          fecha_operativa: string
          creado_en: string
        }
        Insert: {
          id?: string
          notaria_id: string
          tramite_id: string
          sesion_caja_id: string
          registrado_por: string
          tipo: string
          monto: number
          metodo: string
          factura_sin?: string | null
          reversa_de?: string | null
          motivo?: string | null
          autorizado_por?: string | null
          fecha_operativa?: string
          creado_en?: string
        }
        Update: {
          id?: string
          notaria_id?: string
          tramite_id?: string
          sesion_caja_id?: string
          registrado_por?: string
          tipo?: string
          monto?: number
          metodo?: string
          factura_sin?: string | null
          reversa_de?: string | null
          motivo?: string | null
          autorizado_por?: string | null
          fecha_operativa?: string
          creado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_reversa_de_fkey"
            columns: ["reversa_de"]
            isOneToOne: true
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_sesion_caja_id_fkey"
            columns: ["sesion_caja_id"]
            isOneToOne: false
            referencedRelation: "sesiones_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: false
            referencedRelation: "tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones_caja: {
        Row: {
          id: string
          notaria_id: string
          cajero_id: string
          base_inicial: number
          abierta_en: string
          cerrada_en: string | null
          efectivo_contado: number | null
          efectivo_esperado: number | null
          diferencia: number | null
          aprobada_por: string | null
          aprobada_en: string | null
          fecha_operativa: string
        }
        Insert: {
          id?: string
          notaria_id: string
          cajero_id: string
          base_inicial?: number
          abierta_en?: string
          cerrada_en?: string | null
          efectivo_contado?: number | null
          efectivo_esperado?: number | null
          diferencia?: number | null
          aprobada_por?: string | null
          aprobada_en?: string | null
          fecha_operativa?: string
        }
        Update: {
          id?: string
          notaria_id?: string
          cajero_id?: string
          base_inicial?: number
          abierta_en?: string
          cerrada_en?: string | null
          efectivo_contado?: number | null
          efectivo_esperado?: number | null
          diferencia?: number | null
          aprobada_por?: string | null
          aprobada_en?: string | null
          fecha_operativa?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_caja_aprobada_por_fkey"
            columns: ["aprobada_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_caja_cajero_id_fkey"
            columns: ["cajero_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_caja_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes: {
        Row: {
          id: string
          notaria_id: string
          conversacion_id: string | null
          tipo: string
          tramite_codigo: string | null
          nombre: string
          telefono: string
          detalle: string | null
          preferencia_horario: string | null
          autoriza_datos: boolean
          autorizado_en: string
          codigo_seguimiento: string
          estado: string
          nota_interna: string | null
          tramite_id: string | null
          creado_en: string
          fecha_operativa: string
        }
        Insert: {
          id?: string
          notaria_id: string
          conversacion_id?: string | null
          tipo: string
          tramite_codigo?: string | null
          nombre: string
          telefono: string
          detalle?: string | null
          preferencia_horario?: string | null
          autoriza_datos: boolean
          autorizado_en?: string
          codigo_seguimiento?: string
          estado?: string
          nota_interna?: string | null
          tramite_id?: string | null
          creado_en?: string
          fecha_operativa?: string
        }
        Update: {
          id?: string
          notaria_id?: string
          conversacion_id?: string | null
          tipo?: string
          tramite_codigo?: string | null
          nombre?: string
          telefono?: string
          detalle?: string | null
          preferencia_horario?: string | null
          autoriza_datos?: boolean
          autorizado_en?: string
          codigo_seguimiento?: string
          estado?: string
          nota_interna?: string | null
          tramite_id?: string | null
          creado_en?: string
          fecha_operativa?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: true
            referencedRelation: "tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      tramite_eventos: {
        Row: {
          id: string
          notaria_id: string
          tramite_id: string
          tipo: string
          estado_anterior: string | null
          estado_nuevo: string | null
          detalle: string | null
          visible_ciudadano: boolean
          autor_id: string | null
          creado_en: string
        }
        Insert: {
          id?: string
          notaria_id: string
          tramite_id: string
          tipo: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          detalle?: string | null
          visible_ciudadano?: boolean
          autor_id?: string | null
          creado_en?: string
        }
        Update: {
          id?: string
          notaria_id?: string
          tramite_id?: string
          tipo?: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          detalle?: string | null
          visible_ciudadano?: boolean
          autor_id?: string | null
          creado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "tramite_eventos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramite_eventos_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramite_eventos_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: false
            referencedRelation: "tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      tramite_partes: {
        Row: {
          id: string
          notaria_id: string
          tramite_id: string
          nombre: string
          tipo_documento: string
          documento: string | null
          telefono: string | null
          rol: string
          autoriza_datos: boolean
          recibe_avisos: boolean
          creado_por: string | null
          creado_en: string
        }
        Insert: {
          id?: string
          notaria_id: string
          tramite_id: string
          nombre: string
          tipo_documento?: string
          documento?: string | null
          telefono?: string | null
          rol: string
          autoriza_datos?: boolean
          recibe_avisos?: boolean
          creado_por?: string | null
          creado_en?: string
        }
        Update: {
          id?: string
          notaria_id?: string
          tramite_id?: string
          nombre?: string
          tipo_documento?: string
          documento?: string | null
          telefono?: string | null
          rol?: string
          autoriza_datos?: boolean
          recibe_avisos?: boolean
          creado_por?: string | null
          creado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "tramite_partes_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramite_partes_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramite_partes_tramite_id_fkey"
            columns: ["tramite_id"]
            isOneToOne: false
            referencedRelation: "tramites"
            referencedColumns: ["id"]
          },
        ]
      }
      tramites: {
        Row: {
          id: string
          notaria_id: string
          radicado: string
          codigo_consulta: string
          tipo_tramite: string
          empleado_id: string
          estado: string
          fecha_operativa: string
          creado_en: string
        }
        Insert: {
          id?: string
          notaria_id: string
          radicado: string
          codigo_consulta?: string
          tipo_tramite: string
          empleado_id: string
          estado?: string
          fecha_operativa?: string
          creado_en?: string
        }
        Update: {
          id?: string
          notaria_id?: string
          radicado?: string
          codigo_consulta?: string
          tipo_tramite?: string
          empleado_id?: string
          estado?: string
          fecha_operativa?: string
          creado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "tramites_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tramites_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          id: string
          notaria_id: string
          nombre: string
          rol: string
          activo: boolean
        }
        Insert: {
          id: string
          notaria_id: string
          nombre: string
          rol: string
          activo?: boolean
        }
        Update: {
          id?: string
          notaria_id?: string
          nombre?: string
          rol?: string
          activo?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_notaria_id_fkey"
            columns: ["notaria_id"]
            isOneToOne: false
            referencedRelation: "notarias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      abrir_caja: {
        Args: { p_base?: number }
        Returns: string
      }
      agregar_nota: {
        Args: { p_tramite: string; p_texto: string }
        Returns: string
      }
      agregar_parte: {
        Args: { p_tramite: string; p_nombre: string; p_rol: string; p_tipo_documento?: string; p_documento?: string; p_telefono?: string; p_autoriza_datos?: boolean; p_recibe_avisos?: boolean }
        Returns: string
      }
      aprobar_sesion: {
        Args: { p_sesion: string }
        Returns: undefined
      }
      atender_solicitud: {
        Args: { p_solicitud: string; p_estado: string; p_nota?: string }
        Returns: undefined
      }
      calcular_hash: {
        Args: { p_prev: string; p_tabla: string; p_accion: string; p_registro: string; p_usuario: string; p_antes: Json; p_despues: Json; p_creado: string }
        Returns: string
      }
      cambiar_estado: {
        Args: { p_tramite: string; p_estado: string; p_detalle?: string }
        Returns: string
      }
      cerrar_caja: {
        Args: { p_contado: number }
        Returns: undefined
      }
      convertir_solicitud: {
        Args: { p_solicitud: string }
        Returns: string
      }
      devolver_al_bot: {
        Args: { p_conversacion: string }
        Returns: undefined
      }
      mi_notaria: {
        Args: never
        Returns: string
      }
      mi_rol: {
        Args: never
        Returns: string
      }
      normalizar_telefono: {
        Args: { p: string }
        Returns: string
      }
      radicar_tramite: {
        Args: { p_tipo: string }
        Returns: string
      }
      registrar_pago: {
        Args: { p_tramite: string; p_metodo: string; p_factura_sin: string; p_monto?: number }
        Returns: string
      }
      registrar_respuesta_empleado: {
        Args: { p_conversacion: string; p_texto: string }
        Returns: string
      }
      reversar_pago: {
        Args: { p_pago: string; p_motivo: string }
        Returns: string
      }
      sello_del_dia: {
        Args: { p_notaria: string; p_fecha: string }
        Returns: string
      }
      siguiente_radicado: {
        Args: { p_notaria: string }
        Returns: string
      }
      tomar_conversacion: {
        Args: { p_conversacion: string }
        Returns: undefined
      }
      tramites_del_telefono: {
        Args: { p_notaria: string; p_telefono: string }
        Returns: Json
      }
      verificar_cadena: {
        Args: { p_notaria: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])> =
  (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never
