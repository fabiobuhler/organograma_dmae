/**
 * Supabase Read Services
 * Extraído do App.jsx na Fase 7A.
 * Centraliza as consultas de leitura (SELECT) do banco de dados.
 */

/**
 * Função utilitária interna para buscar todos os registros de uma tabela 
 * lidando com a paginação automática do Supabase (limite de 1000 por request).
 */
async function fetchAll(supabase, tableName) {
  let allData = [];
  let from = 0;
  let to = 999;
  let finished = false;

  while (!finished) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, to);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      if (data.length < 1000) {
        finished = true;
      } else {
        from += 1000;
        to += 1000;
      }
    } else {
      finished = true;
    }
  }
  return allData;
}

export async function fetchNodes(supabase) {
  return await fetchAll(supabase, 'nodes');
}

export async function fetchPersons(supabase) {
  return await fetchAll(supabase, 'persons');
}

export async function fetchAssets(supabase) {
  return await fetchAll(supabase, 'assets');
}

export async function fetchContracts(supabase) {
  return await fetchAll(supabase, 'contracts');
}

export async function fetchUsers(supabase) {
  return await fetchAll(supabase, 'users');
}

export async function fetchAssetTypes(supabase) {
  return await fetchAll(supabase, 'asset_types');
}

/**
 * Busca os logs de auditoria mais recentes.
 */
export async function fetchAuditLogs(supabase, limit = 500) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
