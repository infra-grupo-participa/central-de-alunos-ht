import { supabaseAdmin } from './supabase-admin.js';

// Acesso ao schema `ht` pela Data API do Supabase (PostgREST), usando o
// service_role: ele tem GRANT no schema ht e bypassa a RLS. O anon NAO tem
// grant no ht (fica bloqueado), entao o schema segue "privado" ao backend
// mesmo estando exposto na API. Ver DEPLOY.md.
export const ht = supabaseAdmin.schema('ht');

// supabase-js retorna { data, error } em vez de lancar. Este helper propaga o
// erro para o try/catch do route handler (que responde 500 com log).
export function unwrap({ data, error }) {
  if (error) throw new Error(error.message || 'erro_supabase');
  return data;
}

// Le a tabela INTEIRA, pagina a pagina. O PostgREST corta a resposta no
// max-rows (1000 por padrao) e nao avisa: uma leitura ingenua de
// lesson_progress (alunos x aulas) passaria desse teto e as metricas sairiam
// silenciosamente subestimadas. `apply` recebe o select e devolve o mesmo
// builder com os filtros/ordem desejados.
export async function selectAll(table, columns, apply = (q) => q, pageSize = 1000) {
  const linhas = [];
  for (let inicio = 0; ; inicio += pageSize) {
    const pagina = unwrap(
      await apply(ht.from(table).select(columns)).range(inicio, inicio + pageSize - 1)
    );
    linhas.push(...(pagina || []));
    if (!pagina || pagina.length < pageSize) return linhas;
  }
}
