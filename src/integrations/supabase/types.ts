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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agentes: {
        Row: {
          activo: boolean
          created_at: string
          fecha_inicio: string
          id_agente: string
          nombre: string
          porcentaje_asesor: number
          porcentaje_empresa: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          fecha_inicio?: string
          id_agente: string
          nombre: string
          porcentaje_asesor?: number
          porcentaje_empresa?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          fecha_inicio?: string
          id_agente?: string
          nombre?: string
          porcentaje_asesor?: number
          porcentaje_empresa?: number
          updated_at?: string
        }
        Relationships: []
      }
      pagos_comision: {
        Row: {
          created_at: string
          fecha_pago: string
          id_pago: string
          monto: number
          nota: string | null
          tipo_pago: string | null
          venta_id: string
        }
        Insert: {
          created_at?: string
          fecha_pago: string
          id_pago?: string
          monto?: number
          nota?: string | null
          tipo_pago?: string | null
          venta_id: string
        }
        Update: {
          created_at?: string
          fecha_pago?: string
          id_pago?: string
          monto?: number
          nota?: string | null
          tipo_pago?: string | null
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_comision_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id_venta"]
          },
        ]
      }
      ventas: {
        Row: {
          asistencia_agente_id: string | null
          balance_pendiente_comision: number | null
          captador_id: string | null
          cliente: string
          comision_bruta: number
          creado_por: string | null
          created_at: string
          email: string | null
          estado_pago_comision: string | null
          estado_venta: string | null
          fecha_cierre: string | null
          fecha_pago_1: string | null
          fecha_pago_2: string | null
          fecha_reserva: string | null
          habitaciones: number | null
          id_venta: string
          m2_total: number | null
          metraje: number | null
          monto_asistencia_agente: number | null
          monto_asistencia_empresa: number | null
          monto_captador_agente: number | null
          monto_captador_empresa: number | null
          monto_empresa_total: number | null
          monto_pagado_comision: number | null
          monto_referido: number | null
          monto_total_comision_a_pagar: number | null
          monto_vendedor_agente: number | null
          monto_vendedor_empresa: number | null
          notas: string | null
          notas_pago_comision: string | null
          override_split_captador: boolean | null
          override_split_vendedor: boolean | null
          porcentaje_asistencia: number | null
          porcentaje_captador: number | null
          porcentaje_comision: number
          porcentaje_pagado_comision: number | null
          precio_m2: number | null
          precio_rd: number
          precio_usd: number
          proyecto: string | null
          referido_nombre: string | null
          referido_porcentaje: number | null
          split_captador_asesor_aplicado: number | null
          split_captador_empresa_aplicado: number | null
          split_vendedor_asesor_aplicado: number | null
          split_vendedor_empresa_aplicado: number | null
          tasa: number
          telefono: string | null
          tipo_ingreso: string | null
          tipo_inmueble: string | null
          tipo_pago_comision: string | null
          unidad: string | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          asistencia_agente_id?: string | null
          balance_pendiente_comision?: number | null
          captador_id?: string | null
          cliente: string
          comision_bruta?: number
          creado_por?: string | null
          created_at?: string
          email?: string | null
          estado_pago_comision?: string | null
          estado_venta?: string | null
          fecha_cierre?: string | null
          fecha_pago_1?: string | null
          fecha_pago_2?: string | null
          fecha_reserva?: string | null
          habitaciones?: number | null
          id_venta?: string
          m2_total?: number | null
          metraje?: number | null
          monto_asistencia_agente?: number | null
          monto_asistencia_empresa?: number | null
          monto_captador_agente?: number | null
          monto_captador_empresa?: number | null
          monto_empresa_total?: number | null
          monto_pagado_comision?: number | null
          monto_referido?: number | null
          monto_total_comision_a_pagar?: number | null
          monto_vendedor_agente?: number | null
          monto_vendedor_empresa?: number | null
          notas?: string | null
          notas_pago_comision?: string | null
          override_split_captador?: boolean | null
          override_split_vendedor?: boolean | null
          porcentaje_asistencia?: number | null
          porcentaje_captador?: number | null
          porcentaje_comision?: number
          porcentaje_pagado_comision?: number | null
          precio_m2?: number | null
          precio_rd?: number
          precio_usd?: number
          proyecto?: string | null
          referido_nombre?: string | null
          referido_porcentaje?: number | null
          split_captador_asesor_aplicado?: number | null
          split_captador_empresa_aplicado?: number | null
          split_vendedor_asesor_aplicado?: number | null
          split_vendedor_empresa_aplicado?: number | null
          tasa?: number
          telefono?: string | null
          tipo_ingreso?: string | null
          tipo_inmueble?: string | null
          tipo_pago_comision?: string | null
          unidad?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          asistencia_agente_id?: string | null
          balance_pendiente_comision?: number | null
          captador_id?: string | null
          cliente?: string
          comision_bruta?: number
          creado_por?: string | null
          created_at?: string
          email?: string | null
          estado_pago_comision?: string | null
          estado_venta?: string | null
          fecha_cierre?: string | null
          fecha_pago_1?: string | null
          fecha_pago_2?: string | null
          fecha_reserva?: string | null
          habitaciones?: number | null
          id_venta?: string
          m2_total?: number | null
          metraje?: number | null
          monto_asistencia_agente?: number | null
          monto_asistencia_empresa?: number | null
          monto_captador_agente?: number | null
          monto_captador_empresa?: number | null
          monto_empresa_total?: number | null
          monto_pagado_comision?: number | null
          monto_referido?: number | null
          monto_total_comision_a_pagar?: number | null
          monto_vendedor_agente?: number | null
          monto_vendedor_empresa?: number | null
          notas?: string | null
          notas_pago_comision?: string | null
          override_split_captador?: boolean | null
          override_split_vendedor?: boolean | null
          porcentaje_asistencia?: number | null
          porcentaje_captador?: number | null
          porcentaje_comision?: number
          porcentaje_pagado_comision?: number | null
          precio_m2?: number | null
          precio_rd?: number
          precio_usd?: number
          proyecto?: string | null
          referido_nombre?: string | null
          referido_porcentaje?: number | null
          split_captador_asesor_aplicado?: number | null
          split_captador_empresa_aplicado?: number | null
          split_vendedor_asesor_aplicado?: number | null
          split_vendedor_empresa_aplicado?: number | null
          tasa?: number
          telefono?: string | null
          tipo_ingreso?: string | null
          tipo_inmueble?: string | null
          tipo_pago_comision?: string | null
          unidad?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_asistencia_agente_id_fkey"
            columns: ["asistencia_agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id_agente"]
          },
          {
            foreignKeyName: "ventas_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id_agente"]
          },
          {
            foreignKeyName: "ventas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id_agente"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
