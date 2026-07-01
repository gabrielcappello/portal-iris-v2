// Tipos gerados do schema Supabase. NAO editar a mao.
// Regerar: MCP generate_typescript_types (projeto udizowyfjnhuhgxkeayk).

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
      agendamentos: {
        Row: {
          atualizado_em: string | null
          calendar_id: string | null
          clinica_id: string | null
          criado_em: string | null
          data: string | null
          dentista_nome: string | null
          documento: string | null
          event_id: string | null
          horario: string | null
          id: string
          lembrete_24h_enviado: boolean | null
          lembrete_2h_enviado: boolean | null
          nome: string | null
          paciente_id: string | null
          procedimento: string | null
          procedimento_id: string | null
          status: string | null
          telefone: string | null
          tipo_documento: string | null
        }
        Insert: {
          atualizado_em?: string | null
          calendar_id?: string | null
          clinica_id?: string | null
          criado_em?: string | null
          data?: string | null
          dentista_nome?: string | null
          documento?: string | null
          event_id?: string | null
          horario?: string | null
          id?: string
          lembrete_24h_enviado?: boolean | null
          lembrete_2h_enviado?: boolean | null
          nome?: string | null
          paciente_id?: string | null
          procedimento?: string | null
          procedimento_id?: string | null
          status?: string | null
          telefone?: string | null
          tipo_documento?: string | null
        }
        Update: {
          atualizado_em?: string | null
          calendar_id?: string | null
          clinica_id?: string | null
          criado_em?: string | null
          data?: string | null
          dentista_nome?: string | null
          documento?: string | null
          event_id?: string | null
          horario?: string | null
          id?: string
          lembrete_24h_enviado?: boolean | null
          lembrete_2h_enviado?: boolean | null
          nome?: string | null
          paciente_id?: string | null
          procedimento?: string | null
          procedimento_id?: string | null
          status?: string | null
          telefone?: string | null
          tipo_documento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_perfis: {
        Row: {
          atualizado_em: string
          campos: Json
          perfil: string
        }
        Insert: {
          atualizado_em?: string
          campos?: Json
          perfil: string
        }
        Update: {
          atualizado_em?: string
          campos?: Json
          perfil?: string
        }
        Relationships: []
      }
      clinicas: {
        Row: {
          anamnese_override: Json | null
          assistentes: Json
          ativo: boolean | null
          automatizacoes: Json | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          config_financeiro: Json
          criado_em: string | null
          dentistas: Json | null
          email: string
          email_clinica: string | null
          endereco: string | null
          estado: string | null
          fuso_horario: string | null
          horario_funcionamento: Json | null
          id: string
          idioma: string | null
          maps_link: string | null
          max_dentistas: number | null
          nome: string
          nome_agente: string | null
          pais: string | null
          pais_codigo: string | null
          personalidade: string | null
          plano: string | null
          precios: Json | null
          primeiro_acesso: boolean | null
          referencia: string | null
          responsavel: string | null
          sala: string | null
          senha_hash: string | null
          slug: string
          telefone: string | null
          telefone_agente: string | null
          whatsapp_admin: string | null
          whatsapp_instancia: string | null
          whatsapp_status: string | null
        }
        Insert: {
          anamnese_override?: Json | null
          assistentes?: Json
          ativo?: boolean | null
          automatizacoes?: Json | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          config_financeiro?: Json
          criado_em?: string | null
          dentistas?: Json | null
          email: string
          email_clinica?: string | null
          endereco?: string | null
          estado?: string | null
          fuso_horario?: string | null
          horario_funcionamento?: Json | null
          id?: string
          idioma?: string | null
          maps_link?: string | null
          max_dentistas?: number | null
          nome: string
          nome_agente?: string | null
          pais?: string | null
          pais_codigo?: string | null
          personalidade?: string | null
          plano?: string | null
          precios?: Json | null
          primeiro_acesso?: boolean | null
          referencia?: string | null
          responsavel?: string | null
          sala?: string | null
          senha_hash?: string | null
          slug: string
          telefone?: string | null
          telefone_agente?: string | null
          whatsapp_admin?: string | null
          whatsapp_instancia?: string | null
          whatsapp_status?: string | null
        }
        Update: {
          anamnese_override?: Json | null
          assistentes?: Json
          ativo?: boolean | null
          automatizacoes?: Json | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          config_financeiro?: Json
          criado_em?: string | null
          dentistas?: Json | null
          email?: string
          email_clinica?: string | null
          endereco?: string | null
          estado?: string | null
          fuso_horario?: string | null
          horario_funcionamento?: Json | null
          id?: string
          idioma?: string | null
          maps_link?: string | null
          max_dentistas?: number | null
          nome?: string
          nome_agente?: string | null
          pais?: string | null
          pais_codigo?: string | null
          personalidade?: string | null
          plano?: string | null
          precios?: Json | null
          primeiro_acesso?: boolean | null
          referencia?: string | null
          responsavel?: string | null
          sala?: string | null
          senha_hash?: string | null
          slug?: string
          telefone?: string | null
          telefone_agente?: string | null
          whatsapp_admin?: string | null
          whatsapp_instancia?: string | null
          whatsapp_status?: string | null
        }
        Relationships: []
      }
      clinicas_eventos_conexao: {
        Row: {
          created_at: string
          estado: string
          id: string
          instancia: string
          raw_data: Json | null
          status_code: number | null
        }
        Insert: {
          created_at?: string
          estado: string
          id?: string
          instancia: string
          raw_data?: Json | null
          status_code?: number | null
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          instancia?: string
          raw_data?: Json | null
          status_code?: number | null
        }
        Relationships: []
      }
      comandos_remarcacao: {
        Row: {
          atualizado_em: string | null
          clinica_id: string
          comando_id: string
          criado_em: string | null
          data_alvo: string
          dentista_nome: string | null
          dentista_token: string
          escopo_tipo: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          mensagem_template: string | null
          motivo: string | null
          solicitante_id: string | null
          solicitante_perfil: string
          status: string
          total_pacientes: number | null
          versao: string
        }
        Insert: {
          atualizado_em?: string | null
          clinica_id: string
          comando_id: string
          criado_em?: string | null
          data_alvo: string
          dentista_nome?: string | null
          dentista_token: string
          escopo_tipo: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          mensagem_template?: string | null
          motivo?: string | null
          solicitante_id?: string | null
          solicitante_perfil: string
          status?: string
          total_pacientes?: number | null
          versao?: string
        }
        Update: {
          atualizado_em?: string | null
          clinica_id?: string
          comando_id?: string
          criado_em?: string | null
          data_alvo?: string
          dentista_nome?: string | null
          dentista_token?: string
          escopo_tipo?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          mensagem_template?: string | null
          motivo?: string | null
          solicitante_id?: string | null
          solicitante_perfil?: string
          status?: string
          total_pacientes?: number | null
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "comandos_remarcacao_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas_manuais: {
        Row: {
          ativo: boolean
          clinica_id: string
          fim: string | null
          id: string
          inicio: string
          operador: string | null
          telefone: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          fim?: string | null
          id?: string
          inicio?: string
          operador?: string | null
          telefone: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          fim?: string | null
          id?: string
          inicio?: string
          operador?: string | null
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversas_manuais_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      especialidades_catalogo: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome_ar: string
          nome_de: string
          nome_en: string
          nome_es: string
          nome_fr: string
          nome_it: string
          nome_pt: string
          nome_ru: string
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id: string
          nome_ar: string
          nome_de: string
          nome_en: string
          nome_es: string
          nome_fr: string
          nome_it: string
          nome_pt: string
          nome_ru: string
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome_ar?: string
          nome_de?: string
          nome_en?: string
          nome_es?: string
          nome_fr?: string
          nome_it?: string
          nome_pt?: string
          nome_ru?: string
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financeiro_lancamentos: {
        Row: {
          categoria: string | null
          clinica_id: string
          criado_em: string | null
          criado_por: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          dentista_nome: string | null
          descricao: string | null
          forma_pagamento: string | null
          id: string
          origem_id: string | null
          origem_tipo: string | null
          paciente_id: string | null
          paciente_nome: string | null
          pagamento_observacao: string | null
          pago_por: string | null
          ref_dente: string | null
          status: string
          tipo: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          clinica_id: string
          criado_em?: string | null
          criado_por?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          dentista_nome?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          origem_id?: string | null
          origem_tipo?: string | null
          paciente_id?: string | null
          paciente_nome?: string | null
          pagamento_observacao?: string | null
          pago_por?: string | null
          ref_dente?: string | null
          status?: string
          tipo?: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          clinica_id?: string
          criado_em?: string | null
          criado_por?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          dentista_nome?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          origem_id?: string | null
          origem_tipo?: string | null
          paciente_id?: string | null
          paciente_nome?: string | null
          pagamento_observacao?: string | null
          pago_por?: string | null
          ref_dente?: string | null
          status?: string
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      financeiro_orcamento_itens: {
        Row: {
          criado_em: string | null
          dente: string | null
          descricao: string | null
          id: string
          orcamento_id: string
          origem_id: string | null
          origem_tipo: string | null
          valor: number
        }
        Insert: {
          criado_em?: string | null
          dente?: string | null
          descricao?: string | null
          id?: string
          orcamento_id: string
          origem_id?: string | null
          origem_tipo?: string | null
          valor?: number
        }
        Update: {
          criado_em?: string | null
          dente?: string | null
          descricao?: string | null
          id?: string
          orcamento_id?: string
          origem_id?: string | null
          origem_tipo?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "financeiro_orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_orcamentos: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          clinica_id: string
          criado_em: string | null
          criado_por: string | null
          desconto: number
          id: string
          observacoes: string | null
          paciente_id: string | null
          plano_tratamento_id: string | null
          status: string
          titulo: string | null
          valor_final: number
          valor_total: number
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          clinica_id: string
          criado_em?: string | null
          criado_por?: string | null
          desconto?: number
          id?: string
          observacoes?: string | null
          paciente_id?: string | null
          plano_tratamento_id?: string | null
          status?: string
          titulo?: string | null
          valor_final?: number
          valor_total?: number
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          clinica_id?: string
          criado_em?: string | null
          criado_por?: string | null
          desconto?: number
          id?: string
          observacoes?: string | null
          paciente_id?: string | null
          plano_tratamento_id?: string | null
          status?: string
          titulo?: string | null
          valor_final?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_orcamentos_plano_tratamento_id_fkey"
            columns: ["plano_tratamento_id"]
            isOneToOne: false
            referencedRelation: "planos_tratamento"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_fila: {
        Row: {
          created_at: string
          id: string
          id_mensagem: string
          instancia: string
          mensagem: string
          processada: boolean
          recebido_em: string
          telefone: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_mensagem: string
          instancia: string
          mensagem: string
          processada?: boolean
          recebido_em?: string
          telefone: string
        }
        Update: {
          created_at?: string
          id?: string
          id_mensagem?: string
          instancia?: string
          mensagem?: string
          processada?: boolean
          recebido_em?: string
          telefone?: string
        }
        Relationships: []
      }
      mensagens_manuais: {
        Row: {
          clinica_id: string
          conteudo: string
          criado_em: string
          id: string
          origem: string
          telefone: string
        }
        Insert: {
          clinica_id: string
          conteudo: string
          criado_em?: string
          id?: string
          origem: string
          telefone: string
        }
        Update: {
          clinica_id?: string
          conteudo?: string
          criado_em?: string
          id?: string
          origem?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_manuais_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          created_at: string | null
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      odontograma_achados_catalogo: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          categoria: string
          criado_em: string | null
          id: string
          nome_ar: string | null
          nome_de: string | null
          nome_en: string | null
          nome_es: string | null
          nome_fr: string | null
          nome_it: string | null
          nome_pt: string
          nome_ru: string | null
          ordem: number | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria: string
          criado_em?: string | null
          id: string
          nome_ar?: string | null
          nome_de?: string | null
          nome_en?: string | null
          nome_es?: string | null
          nome_fr?: string | null
          nome_it?: string | null
          nome_pt: string
          nome_ru?: string | null
          ordem?: number | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria?: string
          criado_em?: string | null
          id?: string
          nome_ar?: string | null
          nome_de?: string | null
          nome_en?: string | null
          nome_es?: string | null
          nome_fr?: string | null
          nome_it?: string | null
          nome_pt?: string
          nome_ru?: string | null
          ordem?: number | null
        }
        Relationships: []
      }
      odontograma_consultas: {
        Row: {
          agendamento_id: string | null
          clinica_id: string
          criado_em: string | null
          criado_por: string | null
          data_consulta: string
          dentista_nome: string | null
          id: string
          observacoes_gerais: string | null
          paciente_id: string
        }
        Insert: {
          agendamento_id?: string | null
          clinica_id: string
          criado_em?: string | null
          criado_por?: string | null
          data_consulta?: string
          dentista_nome?: string | null
          id?: string
          observacoes_gerais?: string | null
          paciente_id: string
        }
        Update: {
          agendamento_id?: string | null
          clinica_id?: string
          criado_em?: string | null
          criado_por?: string | null
          data_consulta?: string
          dentista_nome?: string | null
          id?: string
          observacoes_gerais?: string | null
          paciente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontograma_consultas_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_consultas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_consultas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_consultas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      odontograma_dentes: {
        Row: {
          arcada: string
          atualizado_em: string | null
          clinica_id: string
          criado_em: string | null
          estado: string
          estado_atualizado_em: string | null
          estado_atualizado_por: string | null
          id: string
          lado: string
          numero_iso: string
          observacoes: string | null
          paciente_id: string
          tipo_dente: string
        }
        Insert: {
          arcada: string
          atualizado_em?: string | null
          clinica_id: string
          criado_em?: string | null
          estado?: string
          estado_atualizado_em?: string | null
          estado_atualizado_por?: string | null
          id?: string
          lado: string
          numero_iso: string
          observacoes?: string | null
          paciente_id: string
          tipo_dente: string
        }
        Update: {
          arcada?: string
          atualizado_em?: string | null
          clinica_id?: string
          criado_em?: string | null
          estado?: string
          estado_atualizado_em?: string | null
          estado_atualizado_por?: string | null
          id?: string
          lado?: string
          numero_iso?: string
          observacoes?: string | null
          paciente_id?: string
          tipo_dente?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontograma_dentes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_dentes_estado_atualizado_por_fkey"
            columns: ["estado_atualizado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_dentes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      odontograma_observacoes: {
        Row: {
          achado_id: string
          clinica_id: string
          consulta_id: string | null
          criado_em: string | null
          criado_por: string | null
          dente_id: string
          detalhes: Json
          id: string
          observacao_substituta_id: string | null
          observacoes: string | null
          paciente_id: string
          resolvido_em: string | null
          resolvido_por: string | null
          status: string
          zonas: string[]
        }
        Insert: {
          achado_id: string
          clinica_id: string
          consulta_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          dente_id: string
          detalhes?: Json
          id?: string
          observacao_substituta_id?: string | null
          observacoes?: string | null
          paciente_id: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string
          zonas?: string[]
        }
        Update: {
          achado_id?: string
          clinica_id?: string
          consulta_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          dente_id?: string
          detalhes?: Json
          id?: string
          observacao_substituta_id?: string | null
          observacoes?: string | null
          paciente_id?: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string
          zonas?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "odontograma_observacoes_achado_id_fkey"
            columns: ["achado_id"]
            isOneToOne: false
            referencedRelation: "odontograma_achados_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_observacoes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_observacoes_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "odontograma_consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_observacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_observacoes_dente_id_fkey"
            columns: ["dente_id"]
            isOneToOne: false
            referencedRelation: "odontograma_dentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_observacoes_obs_substituta_id_fkey"
            columns: ["observacao_substituta_id"]
            isOneToOne: false
            referencedRelation: "odontograma_observacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_observacoes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_observacoes_resolvido_por_fkey"
            columns: ["resolvido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      odontograma_periodontal: {
        Row: {
          clinica_id: string
          consulta_id: string | null
          criado_em: string | null
          criado_por: string | null
          data_exame: string
          dente_id: string
          furcacao: number | null
          id: string
          margem_disto_lingual: number | null
          margem_disto_vestibular: number | null
          margem_lingual: number | null
          margem_mesio_lingual: number | null
          margem_mesio_vestibular: number | null
          margem_vestibular: number | null
          mobilidade: number | null
          paciente_id: string
          placa: boolean | null
          profundidade_disto_lingual: number | null
          profundidade_disto_vestibular: number | null
          profundidade_lingual: number | null
          profundidade_mesio_lingual: number | null
          profundidade_mesio_vestibular: number | null
          profundidade_vestibular: number | null
          sangramento: boolean | null
          supuracao: boolean | null
          tartaro: boolean | null
        }
        Insert: {
          clinica_id: string
          consulta_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_exame?: string
          dente_id: string
          furcacao?: number | null
          id?: string
          margem_disto_lingual?: number | null
          margem_disto_vestibular?: number | null
          margem_lingual?: number | null
          margem_mesio_lingual?: number | null
          margem_mesio_vestibular?: number | null
          margem_vestibular?: number | null
          mobilidade?: number | null
          paciente_id: string
          placa?: boolean | null
          profundidade_disto_lingual?: number | null
          profundidade_disto_vestibular?: number | null
          profundidade_lingual?: number | null
          profundidade_mesio_lingual?: number | null
          profundidade_mesio_vestibular?: number | null
          profundidade_vestibular?: number | null
          sangramento?: boolean | null
          supuracao?: boolean | null
          tartaro?: boolean | null
        }
        Update: {
          clinica_id?: string
          consulta_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_exame?: string
          dente_id?: string
          furcacao?: number | null
          id?: string
          margem_disto_lingual?: number | null
          margem_disto_vestibular?: number | null
          margem_lingual?: number | null
          margem_mesio_lingual?: number | null
          margem_mesio_vestibular?: number | null
          margem_vestibular?: number | null
          mobilidade?: number | null
          paciente_id?: string
          placa?: boolean | null
          profundidade_disto_lingual?: number | null
          profundidade_disto_vestibular?: number | null
          profundidade_lingual?: number | null
          profundidade_mesio_lingual?: number | null
          profundidade_mesio_vestibular?: number | null
          profundidade_vestibular?: number | null
          sangramento?: boolean | null
          supuracao?: boolean | null
          tartaro?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "odontograma_periodontal_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_periodontal_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "odontograma_consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_periodontal_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_periodontal_dente_id_fkey"
            columns: ["dente_id"]
            isOneToOne: false
            referencedRelation: "odontograma_dentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_periodontal_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          anamnese: Json | null
          atualizado_em: string | null
          calendar_id: string | null
          clinica_id: string | null
          criado_em: string | null
          data_nascimento: string | null
          dentista_nome: string | null
          documento: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          primeira_consulta: string | null
          procedimento: string | null
          responsavel: string | null
          telefone: string | null
          tipo_documento: string | null
          total_consultas: number | null
          ultima_consulta: string | null
        }
        Insert: {
          anamnese?: Json | null
          atualizado_em?: string | null
          calendar_id?: string | null
          clinica_id?: string | null
          criado_em?: string | null
          data_nascimento?: string | null
          dentista_nome?: string | null
          documento?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          primeira_consulta?: string | null
          procedimento?: string | null
          responsavel?: string | null
          telefone?: string | null
          tipo_documento?: string | null
          total_consultas?: number | null
          ultima_consulta?: string | null
        }
        Update: {
          anamnese?: Json | null
          atualizado_em?: string | null
          calendar_id?: string | null
          clinica_id?: string | null
          criado_em?: string | null
          data_nascimento?: string | null
          dentista_nome?: string | null
          documento?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          primeira_consulta?: string | null
          procedimento?: string | null
          responsavel?: string | null
          telefone?: string | null
          tipo_documento?: string | null
          total_consultas?: number | null
          ultima_consulta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      paises_config: {
        Row: {
          codigo: string
          ddd_por_estado: Json | null
          ddi: string
          digitos_documento: number | null
          digitos_telefone: number | null
          idioma: string
          moeda: string | null
          moeda_codigo: string | null
          nome: string
          tem_estado: boolean | null
          tipo_documento: string | null
        }
        Insert: {
          codigo: string
          ddd_por_estado?: Json | null
          ddi: string
          digitos_documento?: number | null
          digitos_telefone?: number | null
          idioma: string
          moeda?: string | null
          moeda_codigo?: string | null
          nome: string
          tem_estado?: boolean | null
          tipo_documento?: string | null
        }
        Update: {
          codigo?: string
          ddd_por_estado?: Json | null
          ddi?: string
          digitos_documento?: number | null
          digitos_telefone?: number | null
          idioma?: string
          moeda?: string | null
          moeda_codigo?: string | null
          nome?: string
          tem_estado?: boolean | null
          tipo_documento?: string | null
        }
        Relationships: []
      }
      password_resets: {
        Row: {
          criado_em: string
          expira_em: string
          id: string
          token_hash: string
          usado: boolean
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          expira_em: string
          id?: string
          token_hash: string
          usado?: boolean
          usuario_id: string
        }
        Update: {
          criado_em?: string
          expira_em?: string
          id?: string
          token_hash?: string
          usado?: boolean
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_resets_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_tratamento: {
        Row: {
          clinica_id: string
          criado_em: string | null
          criado_por: string | null
          id: string
          paciente_id: string
          status: string
          titulo: string | null
        }
        Insert: {
          clinica_id: string
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          paciente_id: string
          status?: string
          titulo?: string | null
        }
        Update: {
          clinica_id?: string
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          paciente_id?: string
          status?: string
          titulo?: string | null
        }
        Relationships: []
      }
      procedimentos_catalogo: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          especialidade_id: string
          id: string
          nome_ar: string
          nome_de: string
          nome_en: string
          nome_es: string
          nome_fr: string
          nome_it: string
          nome_pt: string
          nome_ru: string
          ordem: number | null
          perfil_anamnese: string | null
          tempo_padrao: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          especialidade_id: string
          id: string
          nome_ar: string
          nome_de: string
          nome_en: string
          nome_es: string
          nome_fr: string
          nome_it: string
          nome_pt: string
          nome_ru: string
          ordem?: number | null
          perfil_anamnese?: string | null
          tempo_padrao: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          especialidade_id?: string
          id?: string
          nome_ar?: string
          nome_de?: string
          nome_en?: string
          nome_es?: string
          nome_fr?: string
          nome_it?: string
          nome_pt?: string
          nome_ru?: string
          ordem?: number | null
          perfil_anamnese?: string | null
          tempo_padrao?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedimentos_catalogo_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades_catalogo"
            referencedColumns: ["id"]
          },
        ]
      }
      remarcacoes_pendentes: {
        Row: {
          agendamento_id: string | null
          atualizado_em: string | null
          calendar_id_antigo: string | null
          clinica_id: string
          comando_id: string
          comando_remarcacao_id: string
          criado_em: string | null
          data_antiga: string | null
          dentista_nome: string | null
          enviado_em: string | null
          event_id_antigo: string | null
          expira_em: string
          horario_antigo: string | null
          id: string
          nome: string | null
          paciente_id: string | null
          procedimento: string | null
          remarcado_em: string | null
          respondido_em: string | null
          status: string
          telefone: string
        }
        Insert: {
          agendamento_id?: string | null
          atualizado_em?: string | null
          calendar_id_antigo?: string | null
          clinica_id: string
          comando_id: string
          comando_remarcacao_id: string
          criado_em?: string | null
          data_antiga?: string | null
          dentista_nome?: string | null
          enviado_em?: string | null
          event_id_antigo?: string | null
          expira_em?: string
          horario_antigo?: string | null
          id?: string
          nome?: string | null
          paciente_id?: string | null
          procedimento?: string | null
          remarcado_em?: string | null
          respondido_em?: string | null
          status?: string
          telefone: string
        }
        Update: {
          agendamento_id?: string | null
          atualizado_em?: string | null
          calendar_id_antigo?: string | null
          clinica_id?: string
          comando_id?: string
          comando_remarcacao_id?: string
          criado_em?: string | null
          data_antiga?: string | null
          dentista_nome?: string | null
          enviado_em?: string | null
          event_id_antigo?: string | null
          expira_em?: string
          horario_antigo?: string | null
          id?: string
          nome?: string | null
          paciente_id?: string | null
          procedimento?: string | null
          remarcado_em?: string | null
          respondido_em?: string | null
          status?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "remarcacoes_pendentes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remarcacoes_pendentes_comando_remarcacao_id_fkey"
            columns: ["comando_remarcacao_id"]
            isOneToOne: false
            referencedRelation: "comandos_remarcacao"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          clinica_id: string
          criado_em: string | null
          email: string
          id: string
          primeiro_acesso: boolean
          senha_hash: string
        }
        Insert: {
          clinica_id: string
          criado_em?: string | null
          email: string
          id?: string
          primeiro_acesso?: boolean
          senha_hash: string
        }
        Update: {
          clinica_id?: string
          criado_em?: string | null
          email?: string
          id?: string
          primeiro_acesso?: boolean
          senha_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_presenca: {
        Row: {
          created_at: string
          id: string
          instancia: string
          last_change_at: string | null
          last_status: string | null
          lid: string
          status_presenca: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instancia: string
          last_change_at?: string | null
          last_status?: string | null
          lid: string
          status_presenca: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instancia?: string
          last_change_at?: string | null
          last_status?: string | null
          lid?: string
          status_presenca?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_anamnese: {
        Args: { p_anamnese: Json; p_clinica_id: string; p_paciente_id: string }
        Returns: Json
      }
      atualizar_cor_dentista: {
        Args: { p_clinica_id: string; p_cor: string; p_token_acesso: string }
        Returns: Json
      }
      atualizar_estado_dente: {
        Args: {
          p_atualizado_por?: string
          p_dente_id: string
          p_estado: string
          p_observacoes?: string
        }
        Returns: {
          arcada: string
          atualizado_em: string | null
          clinica_id: string
          criado_em: string | null
          estado: string
          estado_atualizado_em: string | null
          estado_atualizado_por: string | null
          id: string
          lado: string
          numero_iso: string
          observacoes: string | null
          paciente_id: string
          tipo_dente: string
        }
        SetofOptions: {
          from: "*"
          to: "odontograma_dentes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      buscar_agendamentos_confirmados_dentista_dia: {
        Args: { p_clinica_id: string; p_data: string; p_dentista_token: string }
        Returns: Json
      }
      buscar_odontograma_completo: {
        Args: { p_paciente_id: string }
        Returns: Json
      }
      buscar_sondagem_periodontal: {
        Args: { p_paciente_id: string }
        Returns: Json
      }
      criar_consulta_odontograma: {
        Args: {
          p_agendamento_id?: string
          p_clinica_id: string
          p_criado_por?: string
          p_data_consulta?: string
          p_dentista_nome?: string
          p_observacoes_gerais?: string
          p_paciente_id: string
        }
        Returns: {
          agendamento_id: string | null
          clinica_id: string
          criado_em: string | null
          criado_por: string | null
          data_consulta: string
          dentista_nome: string | null
          id: string
          observacoes_gerais: string | null
          paciente_id: string
        }
        SetofOptions: {
          from: "*"
          to: "odontograma_consultas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      inicializar_odontograma: {
        Args: { p_clinica_id: string; p_paciente_id: string }
        Returns: {
          arcada: string
          atualizado_em: string | null
          clinica_id: string
          criado_em: string | null
          estado: string
          estado_atualizado_em: string | null
          estado_atualizado_por: string | null
          id: string
          lado: string
          numero_iso: string
          observacoes: string | null
          paciente_id: string
          tipo_dente: string
        }[]
        SetofOptions: {
          from: "*"
          to: "odontograma_dentes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      processar_fila_mensagens: {
        Args: { p_id_mensagem: string; p_instancia: string; p_telefone: string }
        Returns: {
          mensagem_agrupada: string
          total: number
        }[]
      }
      registrar_achado_odontograma: {
        Args: {
          p_achado_id: string
          p_clinica_id: string
          p_consulta_id?: string
          p_criado_por?: string
          p_dente_id: string
          p_detalhes?: Json
          p_observacoes?: string
          p_paciente_id: string
          p_zonas: string[]
        }
        Returns: {
          achado_id: string
          clinica_id: string
          consulta_id: string | null
          criado_em: string | null
          criado_por: string | null
          dente_id: string
          detalhes: Json
          id: string
          observacao_substituta_id: string | null
          observacoes: string | null
          paciente_id: string
          resolvido_em: string | null
          resolvido_por: string | null
          status: string
          zonas: string[]
        }
        SetofOptions: {
          from: "*"
          to: "odontograma_observacoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_observacao_odontograma: {
        Args: {
          p_achado_id: string
          p_clinica_id: string
          p_consulta_id?: string
          p_criado_por?: string
          p_dente_id: string
          p_detalhes?: Json
          p_observacoes?: string
          p_paciente_id: string
          p_zonas: string[]
        }
        Returns: {
          achado_id: string
          clinica_id: string
          consulta_id: string | null
          criado_em: string | null
          criado_por: string | null
          dente_id: string
          detalhes: Json
          id: string
          observacao_substituta_id: string | null
          observacoes: string | null
          paciente_id: string
          resolvido_em: string | null
          resolvido_por: string | null
          status: string
          zonas: string[]
        }
        SetofOptions: {
          from: "*"
          to: "odontograma_observacoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_sondagem_periodontal: {
        Args: {
          p_clinica_id: string
          p_consulta_id?: string
          p_criado_por?: string
          p_data_exame?: string
          p_dente_id: string
          p_furcacao?: number
          p_marg_dl?: number
          p_marg_dv?: number
          p_marg_l?: number
          p_marg_ml?: number
          p_marg_mv?: number
          p_marg_v?: number
          p_mobilidade?: number
          p_paciente_id: string
          p_placa?: boolean
          p_prof_dl?: number
          p_prof_dv?: number
          p_prof_l?: number
          p_prof_ml?: number
          p_prof_mv?: number
          p_prof_v?: number
          p_sangramento?: boolean
          p_supuracao?: boolean
          p_tartaro?: boolean
        }
        Returns: string
      }
      resolver_achado_odontograma: {
        Args: {
          p_evento_id: string
          p_evento_substituto_id?: string
          p_resolvido_por?: string
          p_status: string
        }
        Returns: {
          achado_id: string
          clinica_id: string
          consulta_id: string | null
          criado_em: string | null
          criado_por: string | null
          dente_id: string
          detalhes: Json
          id: string
          observacao_substituta_id: string | null
          observacoes: string | null
          paciente_id: string
          resolvido_em: string | null
          resolvido_por: string | null
          status: string
          zonas: string[]
        }
        SetofOptions: {
          from: "*"
          to: "odontograma_observacoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolver_observacao_odontograma: {
        Args: {
          p_observacao_id: string
          p_observacao_substituta_id?: string
          p_resolvido_por?: string
          p_status: string
        }
        Returns: {
          achado_id: string
          clinica_id: string
          consulta_id: string | null
          criado_em: string | null
          criado_por: string | null
          dente_id: string
          detalhes: Json
          id: string
          observacao_substituta_id: string | null
          observacoes: string | null
          paciente_id: string
          resolvido_em: string | null
          resolvido_por: string | null
          status: string
          zonas: string[]
        }
        SetofOptions: {
          from: "*"
          to: "odontograma_observacoes"
          isOneToOne: true
          isSetofReturn: false
        }
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
