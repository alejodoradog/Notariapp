export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          accion: string
          antes: Json | null
          creado_en: string
          despues: Json | null
          hash: string
          hash_anterior: string | null
          notaria_id: string
          registro_id: string
          seq: number
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          antes?: Json | null
          creado_en: string
          despues?: Json | null
          hash: string
          hash_anterior?: string | null
          notaria_id: string
          registro_id: string
          seq?: never
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          antes?: Json | null
          creado_en?: string
          despues?: Json | null
          hash?: string
          hash_anterior?: string | null
          notaria_id?: string
          registro_id?: string
          seq?: never
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      catalogo_tramites: {
        Row: {
          activo: boolean
          casos_especiales: string[]
          codigo: string
          descripcion: string
          fuentes: string[]
          id: string
          nombre: string
          notaria_id: string | null
          notas: string[]
          requisitos: string[]
          sinonimos: string[]
          tarifa: Json
          validado_por_notaria: boolean
          vigencia_desde: string
        }
        Insert: {
          activo?: boolean
          casos_especiales?: string[]
          codigo: string
          descripcion: string
          fuentes?: string[]
          id?: string
          nombre: string
          notaria_id?: string | null
          notas?: string[]
          requisitos: string[]
          sinonimos?: string[]
          tarifa: Json
          validado_por_notaria?: boolean
          vigencia_desde: string
        }
        Update: {
          activo?: boolean
          casos_especiales?: string[]
          codigo?: string
          descripcion?: string
          fuentes?: string[]
          id?: string
          nombre?: string
          notaria_id?: string | null
          notas?: string[]
          requisitos?: string[]
          sinonimos?: string[]
          tarifa?: Json
          validado_por_notaria?: boolean
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
          anio: number
          notaria_id: string
          ultimo: number
        }
        Insert: {
          anio: number
          notaria_id: string
          ultimo: number
        }
        Update: {
          anio?: number
          notaria_id?: string
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
          atendida_por: string | null
          estado: string
          id: string
          iniciada_en: string
          nombre_perfil: string | null
          notaria_id: string
          telefono: string
          ultima_actividad: string
        }
        Insert: {
          atendida_por?: string | null
          estado?: string
          id?: string
          iniciada_en?: string
          nombre_perfil?: string | null
          notaria_id: string
          telefono: string
          ultima_actividad?: string
        }
        Update: {
          atendida_por?: string | null
          estado?: string
          id?: string
          iniciada_en?: string
          nombre_perfil?: string | null
          notaria_id?: string
          telefono?: string
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
          concepto: string
          creado_en: string
          id: string
          notaria_id: string
          tipo: string
          tramite_id: string
          valor: number
        }
        Insert: {
          concepto: string
          creado_en?: string
          id?: string
          notaria_id: string
          tipo: string
          tramite_id: string
          valor: number
        }
        Update: {
          concepto?: string
          creado_en?: string
          id?: string
          notaria_id?: string
          tipo?: string
          tramite_id?: string
          valor?: number
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
          autor: string
          contenido: string | null
          conversacion_id: string
          creado_en: string
          direccion: string
          empleado_id: string | null
          fecha_operativa: string
          herramientas: Json | null
          id: string
          intencion: string | null
          notaria_id: string
          tipo: string
          tramite_codigo: string | null
          wa_message_id: string | null
        }
        Insert: {
          autor: string
          contenido?: string | null
          conversacion_id: string
          creado_en?: string
          direccion: string
          empleado_id?: string | null
          fecha_operativa?: string
          herramientas?: Json | null
          id?: string
          intencion?: string | null
          notaria_id: string
          tipo?: string
          tramite_codigo?: string | null
          wa_message_id?: string | null
        }
        Update: {
          autor?: string
          contenido?: string | null
          conversacion_id?: string
          creado_en?: string
          direccion?: string
          empleado_id?: string | null
          fecha_operativa?: string
          herramientas?: Json | null
          id?: string
          intencion?: string | null
          notaria_id?: string
          tipo?: string
          tramite_codigo?: string | null
          wa_message_id?: string | null
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
          actualizado_en: string
          ciudad: string
          correo: string | null
          direccion: string | null
          horario: string | null
          mapa_url: string | null
          nombre_publico: string
          notaria_id: string
          politica_datos_url: string | null
          telefono: string | null
        }
        Insert: {
          actualizado_en?: string
          ciudad: string
          correo?: string | null
          direccion?: string | null
          horario?: string | null
          mapa_url?: string | null
          nombre_publico: string
          notaria_id: string
          politica_datos_url?: string | null
          telefono?: string | null
        }
        Update: {
          actualizado_en?: string
          ciudad?: string
          correo?: string | null
          direccion?: string | null
          horario?: string | null
          mapa_url?: string | null
          nombre_publico?: string
          notaria_id?: string
          politica_datos_url?: string | null
          telefono?: string | null
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
          codigo: string
          id: string
          nombre: string
        }
        Insert: {
          codigo: string
          id?: string
          nombre: string
        }
        Update: {
          codigo?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          creado_en: string
          detalle: string | null
          error: string | null
          estado: string
          evento_id: string
          id: string
          intentos: number
          motivo: string
          notaria_id: string
          parte_id: string
          procesada_en: string | null
          telefono: string
          tramite_id: string
          wa_message_id: string | null
        }
        Insert: {
          creado_en?: string
          detalle?: string | null
          error?: string | null
          estado?: string
          evento_id: string
          id?: string
          intentos?: number
          motivo: string
          notaria_id: string
          parte_id: string
          procesada_en?: string | null
          telefono: string
          tramite_id: string
          wa_message_id?: string | null
        }
        Update: {
          creado_en?: string
          detalle?: string | null
          error?: string | null
          estado?: string
          evento_id?: string
          id?: string
          intentos?: number
          motivo?: string
          notaria_id?: string
          parte_id?: string
          procesada_en?: string | null
          telefono?: string
          tramite_id?: string
          wa_message_id?: string | null
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
          autorizado_por: string | null
          creado_en: string
          factura_sin: string | null
          fecha_operativa: string
          id: string
          metodo: string
          monto: number
          motivo: string | null
          notaria_id: string
          registrado_por: string
          reversa_de: string | null
          sesion_caja_id: string
          tipo: string
          tramite_id: string
        }
        Insert: {
          autorizado_por?: string | null
          creado_en?: string
          factura_sin?: string | null
          fecha_operativa?: string
          id?: string
          metodo: string
          monto: number
          motivo?: string | null
          notaria_id: string
          registrado_por: string
          reversa_de?: string | null
          sesion_caja_id: string
          tipo: string
          tramite_id: string
        }
        Update: {
          autorizado_por?: string | null
          creado_en?: string
          factura_sin?: string | null
          fecha_operativa?: string
          id?: string
          metodo?: string
          monto?: number
          motivo?: string | null
          notaria_id?: string
          registrado_por?: string
          reversa_de?: string | null
          sesion_caja_id?: string
          tipo?: string
          tramite_id?: string
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
          abierta_en: string
          aprobada_en: string | null
          aprobada_por: string | null
          base_inicial: number
          cajero_id: string
          cerrada_en: string | null
          diferencia: number | null
          efectivo_contado: number | null
          efectivo_esperado: number | null
          fecha_operativa: string
          id: string
          notaria_id: string
        }
        Insert: {
          abierta_en?: string
          aprobada_en?: string | null
          aprobada_por?: string | null
          base_inicial?: number
          cajero_id: string
          cerrada_en?: string | null
          diferencia?: number | null
          efectivo_contado?: number | null
          efectivo_esperado?: number | null
          fecha_operativa?: string
          id?: string
          notaria_id: string
        }
        Update: {
          abierta_en?: string
          aprobada_en?: string | null
          aprobada_por?: string | null
          base_inicial?: number
          cajero_id?: string
          cerrada_en?: string | null
          diferencia?: number | null
          efectivo_contado?: number | null
          efectivo_esperado?: number | null
          fecha_operativa?: string
          id?: string
          notaria_id?: string
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
          autoriza_datos: boolean
          autorizado_en: string
          codigo_seguimiento: string
          conversacion_id: string | null
          creado_en: string
          detalle: string | null
          estado: string
          fecha_operativa: string
          id: string
          nombre: string
          nota_interna: string | null
          notaria_id: string
          preferencia_horario: string | null
          telefono: string
          tipo: string
          tramite_codigo: string | null
          tramite_id: string | null
        }
        Insert: {
          autoriza_datos: boolean
          autorizado_en?: string
          codigo_seguimiento?: string
          conversacion_id?: string | null
          creado_en?: string
          detalle?: string | null
          estado?: string
          fecha_operativa?: string
          id?: string
          nombre: string
          nota_interna?: string | null
          notaria_id: string
          preferencia_horario?: string | null
          telefono: string
          tipo: string
          tramite_codigo?: string | null
          tramite_id?: string | null
        }
        Update: {
          autoriza_datos?: boolean
          autorizado_en?: string
          codigo_seguimiento?: string
          conversacion_id?: string | null
          creado_en?: string
          detalle?: string | null
          estado?: string
          fecha_operativa?: string
          id?: string
          nombre?: string
          nota_interna?: string | null
          notaria_id?: string
          preferencia_horario?: string | null
          telefono?: string
          tipo?: string
          tramite_codigo?: string | null
          tramite_id?: string | null
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
          autor_id: string | null
          creado_en: string
          detalle: string | null
          estado_anterior: string | null
          estado_nuevo: string | null
          id: string
          notaria_id: string
          tipo: string
          tramite_id: string
          visible_ciudadano: boolean
        }
        Insert: {
          autor_id?: string | null
          creado_en?: string
          detalle?: string | null
          estado_anterior?: string | null
          estado_nuevo?: string | null
          id?: string
          notaria_id: string
          tipo: string
          tramite_id: string
          visible_ciudadano?: boolean
        }
        Update: {
          autor_id?: string | null
          creado_en?: string
          detalle?: string | null
          estado_anterior?: string | null
          estado_nuevo?: string | null
          id?: string
          notaria_id?: string
          tipo?: string
          tramite_id?: string
          visible_ciudadano?: boolean
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
          autoriza_datos: boolean
          creado_en: string
          creado_por: string | null
          documento: string | null
          id: string
          nombre: string
          notaria_id: string
          recibe_avisos: boolean
          rol: string
          telefono: string | null
          tipo_documento: string
          tramite_id: string
        }
        Insert: {
          autoriza_datos?: boolean
          creado_en?: string
          creado_por?: string | null
          documento?: string | null
          id?: string
          nombre: string
          notaria_id: string
          recibe_avisos?: boolean
          rol: string
          telefono?: string | null
          tipo_documento?: string
          tramite_id: string
        }
        Update: {
          autoriza_datos?: boolean
          creado_en?: string
          creado_por?: string | null
          documento?: string | null
          id?: string
          nombre?: string
          notaria_id?: string
          recibe_avisos?: boolean
          rol?: string
          telefono?: string | null
          tipo_documento?: string
          tramite_id?: string
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
          codigo_consulta: string
          creado_en: string
          empleado_id: string
          estado: string
          fecha_operativa: string
          id: string
          notaria_id: string
          radicado: string
          tipo_tramite: string
        }
        Insert: {
          codigo_consulta?: string
          creado_en?: string
          empleado_id: string
          estado?: string
          fecha_operativa?: string
          id?: string
          notaria_id: string
          radicado: string
          tipo_tramite: string
        }
        Update: {
          codigo_consulta?: string
          creado_en?: string
          empleado_id?: string
          estado?: string
          fecha_operativa?: string
          id?: string
          notaria_id?: string
          radicado?: string
          tipo_tramite?: string
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
          activo: boolean
          id: string
          nombre: string
          notaria_id: string
          rol: string
        }
        Insert: {
          activo?: boolean
          id: string
          nombre: string
          notaria_id: string
          rol: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
          notaria_id?: string
          rol?: string
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
      abrir_caja: { Args: { p_base?: number }; Returns: string }
      agregar_nota: {
        Args: { p_texto: string; p_tramite: string }
        Returns: string
      }
      agregar_parte: {
        Args: {
          p_autoriza_datos?: boolean
          p_documento?: string
          p_nombre: string
          p_recibe_avisos?: boolean
          p_rol: string
          p_telefono?: string
          p_tipo_documento?: string
          p_tramite: string
        }
        Returns: string
      }
      aprobar_sesion: { Args: { p_sesion: string }; Returns: undefined }
      atender_solicitud: {
        Args: { p_estado: string; p_nota?: string; p_solicitud: string }
        Returns: undefined
      }
      calcular_hash: {
        Args: {
          p_accion: string
          p_antes: Json
          p_creado: string
          p_despues: Json
          p_prev: string
          p_registro: string
          p_tabla: string
          p_usuario: string
        }
        Returns: string
      }
      cambiar_estado: {
        Args: { p_detalle?: string; p_estado: string; p_tramite: string }
        Returns: string
      }
      cerrar_caja: { Args: { p_contado: number }; Returns: undefined }
      convertir_solicitud: { Args: { p_solicitud: string }; Returns: string }
      devolver_al_bot: { Args: { p_conversacion: string }; Returns: undefined }
      mi_notaria: { Args: never; Returns: string }
      mi_rol: { Args: never; Returns: string }
      normalizar_telefono: { Args: { p: string }; Returns: string }
      radicar_tramite: { Args: { p_tipo: string }; Returns: string }
      registrar_pago: {
        Args: {
          p_factura_sin: string
          p_metodo: string
          p_monto?: number
          p_tramite: string
        }
        Returns: string
      }
      registrar_respuesta_empleado: {
        Args: { p_conversacion: string; p_texto: string }
        Returns: string
      }
      reversar_pago: {
        Args: { p_motivo: string; p_pago: string }
        Returns: string
      }
      sello_del_dia: {
        Args: { p_fecha: string; p_notaria: string }
        Returns: string
      }
      siguiente_radicado: { Args: { p_notaria: string }; Returns: string }
      tomar_conversacion: {
        Args: { p_conversacion: string }
        Returns: undefined
      }
      tramites_del_telefono: {
        Args: { p_notaria: string; p_telefono: string }
        Returns: Json
      }
      verificar_cadena: { Args: { p_notaria: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
