export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      _migraciones: {
        Row: {
          aplicada_at: string;
          nombre: string;
        };
        ComputedFields: never;
        Insert: {
          aplicada_at?: string;
          nombre: string;
        };
        Update: {
          aplicada_at?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      configuracion: {
        Row: {
          created_at: string;
          direccion: string | null;
          email: string | null;
          horario: string | null;
          id: boolean;
          ig_token_encriptado: string | null;
          ig_token_vence_at: string | null;
          instagram_user: string | null;
          moderacion_automatica: boolean;
          nombre_taller: string;
          texto_aviso_calibracion: string | null;
          texto_aviso_listo: string | null;
          updated_at: string;
          whatsapp: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          direccion?: string | null;
          email?: string | null;
          horario?: string | null;
          id?: boolean;
          ig_token_encriptado?: string | null;
          ig_token_vence_at?: string | null;
          instagram_user?: string | null;
          moderacion_automatica?: boolean;
          nombre_taller?: string;
          texto_aviso_calibracion?: string | null;
          texto_aviso_listo?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          created_at?: string;
          direccion?: string | null;
          email?: string | null;
          horario?: string | null;
          id?: boolean;
          ig_token_encriptado?: string | null;
          ig_token_vence_at?: string | null;
          instagram_user?: string | null;
          moderacion_automatica?: boolean;
          nombre_taller?: string;
          texto_aviso_calibracion?: string | null;
          texto_aviso_listo?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      fotos_orden: {
        Row: {
          created_at: string;
          id: string;
          momento: Database["public"]["Enums"]["momento_foto"];
          orden: number;
          orden_id: string;
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          momento: Database["public"]["Enums"]["momento_foto"];
          orden?: number;
          orden_id: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          momento?: Database["public"]["Enums"]["momento_foto"];
          orden?: number;
          orden_id?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fotos_orden_orden_id_fkey";
            columns: ["orden_id"];
            isOneToOne: false;
            referencedRelation: "historial_publico";
            referencedColumns: ["orden_id"];
          },
          {
            foreignKeyName: "fotos_orden_orden_id_fkey";
            columns: ["orden_id"];
            isOneToOne: false;
            referencedRelation: "ordenes";
            referencedColumns: ["id"];
          },
        ];
      };
      fotos_publicacion: {
        Row: {
          created_at: string;
          id: string;
          orden: number;
          publicacion_id: string;
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          orden?: number;
          publicacion_id: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          orden?: number;
          publicacion_id?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fotos_publicacion_publicacion_id_fkey";
            columns: ["publicacion_id"];
            isOneToOne: false;
            referencedRelation: "historial_publico";
            referencedColumns: ["publicacion_id"];
          },
          {
            foreignKeyName: "fotos_publicacion_publicacion_id_fkey";
            columns: ["publicacion_id"];
            isOneToOne: false;
            referencedRelation: "instrumentos_publicos";
            referencedColumns: ["publicacion_id"];
          },
          {
            foreignKeyName: "fotos_publicacion_publicacion_id_fkey";
            columns: ["publicacion_id"];
            isOneToOne: false;
            referencedRelation: "publicaciones_venta";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fotos_publicacion_publicacion_id_fkey";
            columns: ["publicacion_id"];
            isOneToOne: false;
            referencedRelation: "vendedores_publicos";
            referencedColumns: ["publicacion_id"];
          },
        ];
      };
      instagram_posts: {
        Row: {
          caption: string | null;
          created_at: string;
          fecha: string;
          id: string;
          ig_id: string;
          media_url: string;
          permalink: string;
          thumbnail_url: string | null;
          tipo: Database["public"]["Enums"]["tipo_ig_post"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          caption?: string | null;
          created_at?: string;
          fecha: string;
          id?: string;
          ig_id: string;
          media_url: string;
          permalink: string;
          thumbnail_url?: string | null;
          tipo: Database["public"]["Enums"]["tipo_ig_post"];
          updated_at?: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          fecha?: string;
          id?: string;
          ig_id?: string;
          media_url?: string;
          permalink?: string;
          thumbnail_url?: string | null;
          tipo?: Database["public"]["Enums"]["tipo_ig_post"];
          updated_at?: string;
        };
        Relationships: [];
      };
      instrumentos: {
        Row: {
          action_agudos_mm: number | null;
          action_graves_mm: number | null;
          afinacion: string | null;
          anio: number | null;
          calibracion_cada_meses: number;
          calibre_cuerdas: string | null;
          created_at: string;
          dueno_id: string;
          en_venta: boolean;
          escala: string | null;
          foto_serie_url: string | null;
          foto_url: string | null;
          id: string;
          marca: string | null;
          modelo: string | null;
          numero_serie: string | null;
          proxima_revision: string | null;
          qr_token: string;
          tipo: Database["public"]["Enums"]["tipo_instrumento"];
          trastes_cantidad: number | null;
          trastes_material: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          action_agudos_mm?: number | null;
          action_graves_mm?: number | null;
          afinacion?: string | null;
          anio?: number | null;
          calibracion_cada_meses?: number;
          calibre_cuerdas?: string | null;
          created_at?: string;
          dueno_id: string;
          en_venta?: boolean;
          escala?: string | null;
          foto_serie_url?: string | null;
          foto_url?: string | null;
          id?: string;
          marca?: string | null;
          modelo?: string | null;
          numero_serie?: string | null;
          proxima_revision?: string | null;
          qr_token?: string;
          tipo: Database["public"]["Enums"]["tipo_instrumento"];
          trastes_cantidad?: number | null;
          trastes_material?: string | null;
          updated_at?: string;
        };
        Update: {
          action_agudos_mm?: number | null;
          action_graves_mm?: number | null;
          afinacion?: string | null;
          anio?: number | null;
          calibracion_cada_meses?: number;
          calibre_cuerdas?: string | null;
          created_at?: string;
          dueno_id?: string;
          en_venta?: boolean;
          escala?: string | null;
          foto_serie_url?: string | null;
          foto_url?: string | null;
          id?: string;
          marca?: string | null;
          modelo?: string | null;
          numero_serie?: string | null;
          proxima_revision?: string | null;
          qr_token?: string;
          tipo?: Database["public"]["Enums"]["tipo_instrumento"];
          trastes_cantidad?: number | null;
          trastes_material?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instrumentos_dueno_id_fkey";
            columns: ["dueno_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ordenes: {
        Row: {
          avisar_cliente: boolean;
          cliente_id: string;
          created_at: string;
          cuerdas_puestas: string | null;
          detalle_realizado: string | null;
          estado: Database["public"]["Enums"]["estado_orden"];
          fecha_cierre: string | null;
          fecha_estimada: string | null;
          fecha_ingreso: string;
          id: string;
          importe: number | null;
          instrumento_id: string;
          notas_internas: string | null;
          numero: number;
          pedido_cliente: string | null;
          presupuesto: number | null;
          presupuesto_aprobado_at: string | null;
          proxima_revision: string | null;
          publicar_en_portfolio: boolean;
          tipo_trabajo_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avisar_cliente?: boolean;
          cliente_id: string;
          created_at?: string;
          cuerdas_puestas?: string | null;
          detalle_realizado?: string | null;
          estado?: Database["public"]["Enums"]["estado_orden"];
          fecha_cierre?: string | null;
          fecha_estimada?: string | null;
          fecha_ingreso?: string;
          id?: string;
          importe?: number | null;
          instrumento_id: string;
          notas_internas?: string | null;
          numero?: number;
          pedido_cliente?: string | null;
          presupuesto?: number | null;
          presupuesto_aprobado_at?: string | null;
          proxima_revision?: string | null;
          publicar_en_portfolio?: boolean;
          tipo_trabajo_id: string;
          updated_at?: string;
        };
        Update: {
          avisar_cliente?: boolean;
          cliente_id?: string;
          created_at?: string;
          cuerdas_puestas?: string | null;
          detalle_realizado?: string | null;
          estado?: Database["public"]["Enums"]["estado_orden"];
          fecha_cierre?: string | null;
          fecha_estimada?: string | null;
          fecha_ingreso?: string;
          id?: string;
          importe?: number | null;
          instrumento_id?: string;
          notas_internas?: string | null;
          numero?: number;
          pedido_cliente?: string | null;
          presupuesto?: number | null;
          presupuesto_aprobado_at?: string | null;
          proxima_revision?: string | null;
          publicar_en_portfolio?: boolean;
          tipo_trabajo_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ordenes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ordenes_instrumento_id_fkey";
            columns: ["instrumento_id"];
            isOneToOne: false;
            referencedRelation: "instrumentos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ordenes_tipo_trabajo_id_fkey";
            columns: ["tipo_trabajo_id"];
            isOneToOne: false;
            referencedRelation: "tipos_trabajo";
            referencedColumns: ["id"];
          },
        ];
      };
      perfiles: {
        Row: {
          avatar_url: string | null;
          canal_preferido: Database["public"]["Enums"]["canal_aviso"];
          created_at: string;
          email: string | null;
          id: string;
          nombre: string;
          rol: Database["public"]["Enums"]["rol_perfil"];
          updated_at: string;
          user_id: string | null;
          whatsapp: string | null;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          canal_preferido?: Database["public"]["Enums"]["canal_aviso"];
          created_at?: string;
          email?: string | null;
          id?: string;
          nombre: string;
          rol?: Database["public"]["Enums"]["rol_perfil"];
          updated_at?: string;
          user_id?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          canal_preferido?: Database["public"]["Enums"]["canal_aviso"];
          created_at?: string;
          email?: string | null;
          id?: string;
          nombre?: string;
          rol?: Database["public"]["Enums"]["rol_perfil"];
          updated_at?: string;
          user_id?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      publicaciones_venta: {
        Row: {
          acepta_permuta: boolean;
          con_estuche: boolean;
          created_at: string;
          descripcion: string | null;
          destacada: boolean;
          estado: Database["public"]["Enums"]["estado_publicacion"];
          estado_instrumento: Database["public"]["Enums"]["estado_instrumento_venta"];
          id: string;
          instrumento_id: string;
          moneda: string;
          mostrar_historial: boolean;
          pide_revision: boolean;
          precio: number;
          revisado_at: string | null;
          revisado_por_taller: boolean;
          revision_orden_id: string | null;
          titulo: string;
          updated_at: string;
          vendedor_id: string;
        };
        ComputedFields: never;
        Insert: {
          acepta_permuta?: boolean;
          con_estuche?: boolean;
          created_at?: string;
          descripcion?: string | null;
          destacada?: boolean;
          estado?: Database["public"]["Enums"]["estado_publicacion"];
          estado_instrumento: Database["public"]["Enums"]["estado_instrumento_venta"];
          id?: string;
          instrumento_id: string;
          moneda?: string;
          mostrar_historial?: boolean;
          pide_revision?: boolean;
          precio: number;
          revisado_at?: string | null;
          revisado_por_taller?: boolean;
          revision_orden_id?: string | null;
          titulo: string;
          updated_at?: string;
          vendedor_id: string;
        };
        Update: {
          acepta_permuta?: boolean;
          con_estuche?: boolean;
          created_at?: string;
          descripcion?: string | null;
          destacada?: boolean;
          estado?: Database["public"]["Enums"]["estado_publicacion"];
          estado_instrumento?: Database["public"]["Enums"]["estado_instrumento_venta"];
          id?: string;
          instrumento_id?: string;
          moneda?: string;
          mostrar_historial?: boolean;
          pide_revision?: boolean;
          precio?: number;
          revisado_at?: string | null;
          revisado_por_taller?: boolean;
          revision_orden_id?: string | null;
          titulo?: string;
          updated_at?: string;
          vendedor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "publicaciones_venta_instrumento_id_fkey";
            columns: ["instrumento_id"];
            isOneToOne: false;
            referencedRelation: "instrumentos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publicaciones_venta_revision_orden_id_fkey";
            columns: ["revision_orden_id"];
            isOneToOne: false;
            referencedRelation: "historial_publico";
            referencedColumns: ["orden_id"];
          },
          {
            foreignKeyName: "publicaciones_venta_revision_orden_id_fkey";
            columns: ["revision_orden_id"];
            isOneToOne: false;
            referencedRelation: "ordenes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publicaciones_venta_vendedor_id_fkey";
            columns: ["vendedor_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      recordatorios: {
        Row: {
          canal: Database["public"]["Enums"]["canal_aviso"];
          cliente_id: string;
          created_at: string;
          enviado_at: string | null;
          estado: Database["public"]["Enums"]["estado_recordatorio"];
          fecha_programada: string;
          id: string;
          instrumento_id: string;
          tipo: Database["public"]["Enums"]["tipo_recordatorio"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          canal: Database["public"]["Enums"]["canal_aviso"];
          cliente_id: string;
          created_at?: string;
          enviado_at?: string | null;
          estado?: Database["public"]["Enums"]["estado_recordatorio"];
          fecha_programada: string;
          id?: string;
          instrumento_id: string;
          tipo?: Database["public"]["Enums"]["tipo_recordatorio"];
          updated_at?: string;
        };
        Update: {
          canal?: Database["public"]["Enums"]["canal_aviso"];
          cliente_id?: string;
          created_at?: string;
          enviado_at?: string | null;
          estado?: Database["public"]["Enums"]["estado_recordatorio"];
          fecha_programada?: string;
          id?: string;
          instrumento_id?: string;
          tipo?: Database["public"]["Enums"]["tipo_recordatorio"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recordatorios_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recordatorios_instrumento_id_fkey";
            columns: ["instrumento_id"];
            isOneToOne: false;
            referencedRelation: "instrumentos";
            referencedColumns: ["id"];
          },
        ];
      };
      tipos_trabajo: {
        Row: {
          activo: boolean;
          created_at: string;
          detalle_sugerido: string | null;
          id: string;
          meses_hasta_revision: number;
          nombre: string;
          orden: number;
          precio_base: number | null;
          requiere_presupuesto: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          activo?: boolean;
          created_at?: string;
          detalle_sugerido?: string | null;
          id?: string;
          meses_hasta_revision?: number;
          nombre: string;
          orden?: number;
          precio_base?: number | null;
          requiere_presupuesto?: boolean;
          updated_at?: string;
        };
        Update: {
          activo?: boolean;
          created_at?: string;
          detalle_sugerido?: string | null;
          id?: string;
          meses_hasta_revision?: number;
          nombre?: string;
          orden?: number;
          precio_base?: number | null;
          requiere_presupuesto?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      trabajos_portfolio: {
        Row: {
          created_at: string;
          descripcion: string | null;
          destacado: boolean;
          fecha: string;
          foto_antes_url: string | null;
          foto_despues_url: string | null;
          id: string;
          instrumento_tipo: Database["public"]["Enums"]["tipo_instrumento"];
          orden_id: string;
          tipo_trabajo_id: string | null;
          titulo: string;
          updated_at: string;
          visible: boolean;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          descripcion?: string | null;
          destacado?: boolean;
          fecha?: string;
          foto_antes_url?: string | null;
          foto_despues_url?: string | null;
          id?: string;
          instrumento_tipo: Database["public"]["Enums"]["tipo_instrumento"];
          orden_id: string;
          tipo_trabajo_id?: string | null;
          titulo: string;
          updated_at?: string;
          visible?: boolean;
        };
        Update: {
          created_at?: string;
          descripcion?: string | null;
          destacado?: boolean;
          fecha?: string;
          foto_antes_url?: string | null;
          foto_despues_url?: string | null;
          id?: string;
          instrumento_tipo?: Database["public"]["Enums"]["tipo_instrumento"];
          orden_id?: string;
          tipo_trabajo_id?: string | null;
          titulo?: string;
          updated_at?: string;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "trabajos_portfolio_orden_id_fkey";
            columns: ["orden_id"];
            isOneToOne: true;
            referencedRelation: "historial_publico";
            referencedColumns: ["orden_id"];
          },
          {
            foreignKeyName: "trabajos_portfolio_orden_id_fkey";
            columns: ["orden_id"];
            isOneToOne: true;
            referencedRelation: "ordenes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trabajos_portfolio_tipo_trabajo_id_fkey";
            columns: ["tipo_trabajo_id"];
            isOneToOne: false;
            referencedRelation: "tipos_trabajo";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      configuracion_publica: {
        Row: {
          direccion: string | null;
          email: string | null;
          horario: string | null;
          instagram_user: string | null;
          nombre_taller: string | null;
          whatsapp: string | null;
        };
        ComputedFields: never;
        Insert: {
          direccion?: string | null;
          email?: string | null;
          horario?: string | null;
          instagram_user?: string | null;
          nombre_taller?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          direccion?: string | null;
          email?: string | null;
          horario?: string | null;
          instagram_user?: string | null;
          nombre_taller?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      historial_publico: {
        Row: {
          detalle_realizado: string | null;
          fecha_cierre: string | null;
          orden_id: string | null;
          publicacion_id: string | null;
          tipo_trabajo: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      instrumentos_publicos: {
        Row: {
          action_agudos_mm: number | null;
          action_graves_mm: number | null;
          afinacion: string | null;
          anio: number | null;
          calibre_cuerdas: string | null;
          escala: string | null;
          marca: string | null;
          modelo: string | null;
          proxima_revision: string | null;
          publicacion_id: string | null;
          tipo: Database["public"]["Enums"]["tipo_instrumento"] | null;
          trastes_cantidad: number | null;
          trastes_material: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      vendedores_publicos: {
        Row: {
          nombre: string | null;
          publicacion_id: string | null;
          whatsapp: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      fn_es_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      fn_perfil_id: { Args: Record<PropertyKey, never>; Returns: string };
      fn_transicion_valida: {
        Args: {
          desde: Database["public"]["Enums"]["estado_orden"];
          hacia: Database["public"]["Enums"]["estado_orden"];
          salta_presupuesto: boolean;
        };
        Returns: boolean;
      };
    };
    Enums: {
      canal_aviso: "whatsapp" | "email";
      estado_instrumento_venta: "excelente" | "muy_bueno" | "bueno" | "regular";
      estado_orden:
        "recibido" | "presupuestado" | "aprobado" | "en_proceso" | "listo" | "entregado" | "cancelado";
      estado_publicacion: "borrador" | "publicada" | "pausada" | "vendida";
      estado_recordatorio: "pendiente" | "enviado" | "pausado" | "cancelado";
      momento_foto: "antes" | "despues";
      rol_perfil: "cliente" | "admin";
      tipo_ig_post: "imagen" | "video" | "carrusel";
      tipo_instrumento: "electrica" | "acustica" | "criolla" | "bajo" | "otro";
      tipo_recordatorio: "calibracion" | "cuerdas" | "otro";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      canal_aviso: ["whatsapp", "email"],
      estado_instrumento_venta: ["excelente", "muy_bueno", "bueno", "regular"],
      estado_orden: [
        "recibido",
        "presupuestado",
        "aprobado",
        "en_proceso",
        "listo",
        "entregado",
        "cancelado",
      ],
      estado_publicacion: ["borrador", "publicada", "pausada", "vendida"],
      estado_recordatorio: ["pendiente", "enviado", "pausado", "cancelado"],
      momento_foto: ["antes", "despues"],
      rol_perfil: ["cliente", "admin"],
      tipo_ig_post: ["imagen", "video", "carrusel"],
      tipo_instrumento: ["electrica", "acustica", "criolla", "bajo", "otro"],
      tipo_recordatorio: ["calibracion", "cuerdas", "otro"],
    },
  },
} as const;
