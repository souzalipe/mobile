/**
 * Tipos TypeScript gerados manualmente a partir de supabase/schema_contas.sql.
 * Se o schema mudar, atualize este arquivo (ou substitua por
 * `supabase gen types typescript` quando o projeto Supabase estiver linkado).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type FrequenciaConta = 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'unica';
export type StatusConta = 'pendente' | 'pago' | 'atrasado' | 'cancelado';
export type CanalNotificacao = 'push' | 'email' | 'ambos';
export type CanalEnvio = 'push' | 'email';
export type TipoNotificacao = 'aviso_previo' | 'vencimento_hoje' | 'atrasado';
export type PlataformaDevice = 'ios' | 'android';
export type UrgenciaConta = 'atrasado' | 'vence_hoje' | 'proximo' | 'normal';

export type Database = {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string;
          user_id: string | null;
          nome: string;
          cor: string;
          icone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          nome: string;
          cor?: string;
          icone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          nome?: string;
          cor?: string;
          icone?: string;
          created_at?: string;
        };
      };
      contas: {
        Row: {
          id: string;
          user_id: string;
          categoria_id: string | null;
          nome: string;
          descricao: string | null;
          valor_estimado: number | null;
          valor_real: number | null;
          recorrente: boolean;
          frequencia: FrequenciaConta;
          dia_vencimento: number | null;
          data_vencimento: string | null;
          dias_antecedencia: number | null;
          status: StatusConta;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          categoria_id?: string | null;
          nome: string;
          descricao?: string | null;
          valor_estimado?: number | null;
          valor_real?: number | null;
          recorrente?: boolean;
          frequencia?: FrequenciaConta;
          dia_vencimento?: number | null;
          data_vencimento?: string | null;
          dias_antecedencia?: number | null;
          status?: StatusConta;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          categoria_id?: string | null;
          nome?: string;
          descricao?: string | null;
          valor_estimado?: number | null;
          valor_real?: number | null;
          recorrente?: boolean;
          frequencia?: FrequenciaConta;
          dia_vencimento?: number | null;
          data_vencimento?: string | null;
          dias_antecedencia?: number | null;
          status?: StatusConta;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      pagamentos: {
        Row: {
          id: string;
          conta_id: string;
          user_id: string;
          valor_pago: number;
          data_pagamento: string;
          data_vencimento_referencia: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conta_id: string;
          user_id: string;
          valor_pago: number;
          data_pagamento?: string;
          data_vencimento_referencia?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conta_id?: string;
          user_id?: string;
          valor_pago?: number;
          data_pagamento?: string;
          data_vencimento_referencia?: string | null;
          created_at?: string;
        };
      };
      preferencias_usuario: {
        Row: {
          user_id: string;
          dias_antecedencia_padrao: number;
          canal_notificacao: CanalNotificacao;
          horario_envio: string;
          notificar_dia_vencimento: boolean;
          notificar_atraso: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          dias_antecedencia_padrao?: number;
          canal_notificacao?: CanalNotificacao;
          horario_envio?: string;
          notificar_dia_vencimento?: boolean;
          notificar_atraso?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          dias_antecedencia_padrao?: number;
          canal_notificacao?: CanalNotificacao;
          horario_envio?: string;
          notificar_dia_vencimento?: boolean;
          notificar_atraso?: boolean;
          updated_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          device_id: string;
          platform: PlataformaDevice | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_push_token: string;
          device_id: string;
          platform?: PlataformaDevice | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expo_push_token?: string;
          device_id?: string;
          platform?: PlataformaDevice | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notificacoes_enviadas: {
        Row: {
          id: string;
          conta_id: string;
          user_id: string;
          tipo: TipoNotificacao;
          data_envio: string;
          canal: CanalEnvio;
          created_at: string;
        };
        Insert: {
          id?: string;
          conta_id: string;
          user_id: string;
          tipo: TipoNotificacao;
          data_envio?: string;
          canal: CanalEnvio;
          created_at?: string;
        };
        Update: {
          id?: string;
          conta_id?: string;
          user_id?: string;
          tipo?: TipoNotificacao;
          data_envio?: string;
          canal?: CanalEnvio;
          created_at?: string;
        };
      };
    };
    Views: {
      vw_proximas_contas: {
        Row: {
          id: string;
          user_id: string;
          categoria_id: string | null;
          nome: string;
          descricao: string | null;
          valor_estimado: number | null;
          valor_real: number | null;
          recorrente: boolean;
          frequencia: FrequenciaConta;
          dia_vencimento: number | null;
          data_vencimento: string | null;
          dias_antecedencia: number | null;
          status: StatusConta;
          ativo: boolean;
          created_at: string;
          updated_at: string;
          categoria_nome: string | null;
          categoria_cor: string | null;
          categoria_icone: string | null;
          antecedencia_efetiva: number;
          urgencia: UrgenciaConta;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Aliases de conveniência, para não precisar escrever Database['public']['Tables'][...] toda hora.
export type Categoria = Database['public']['Tables']['categorias']['Row'];
export type CategoriaInsert = Database['public']['Tables']['categorias']['Insert'];
export type CategoriaUpdate = Database['public']['Tables']['categorias']['Update'];

export type Conta = Database['public']['Tables']['contas']['Row'];
export type ContaInsert = Database['public']['Tables']['contas']['Insert'];
export type ContaUpdate = Database['public']['Tables']['contas']['Update'];

export type Pagamento = Database['public']['Tables']['pagamentos']['Row'];
export type PagamentoInsert = Database['public']['Tables']['pagamentos']['Insert'];
export type PagamentoUpdate = Database['public']['Tables']['pagamentos']['Update'];

export type PreferenciasUsuario = Database['public']['Tables']['preferencias_usuario']['Row'];
export type PreferenciasUsuarioInsert = Database['public']['Tables']['preferencias_usuario']['Insert'];
export type PreferenciasUsuarioUpdate = Database['public']['Tables']['preferencias_usuario']['Update'];

export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row'];
export type PushSubscriptionInsert = Database['public']['Tables']['push_subscriptions']['Insert'];
export type PushSubscriptionUpdate = Database['public']['Tables']['push_subscriptions']['Update'];

export type NotificacaoEnviada = Database['public']['Tables']['notificacoes_enviadas']['Row'];
export type NotificacaoEnviadaInsert = Database['public']['Tables']['notificacoes_enviadas']['Insert'];

export type ProximaConta = Database['public']['Views']['vw_proximas_contas']['Row'];
