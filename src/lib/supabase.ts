// JurisAcompanha — Cliente de Integração com Supabase
// Conecta com a instância PostgreSQL / Supabase Auth ou provê camada de desenvolvimento segura

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = 
  Boolean(supabaseUrl) && 
  Boolean(supabaseAnonKey) && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder');

export const isMockFallbackEnabled = 
  import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true' || !isConfigured;

// Instância do cliente Supabase quando configurado
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isConfigured) {
  console.info(
    '%c[JurisAcompanha] Rodando em modo de simulação segura multi-tenant (Mock Fallback). Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para conectar ao Supabase real.',
    'color: #1E3E62; font-weight: bold;'
  );
}
