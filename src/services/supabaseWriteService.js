/**
 * Serviço de escrita para o Supabase.
 * Centraliza as operações de INSERT, UPDATE, UPSERT e DELETE.
 */

/**
 * Persiste ou atualiza uma pessoa na tabela 'persons'.
 */
export async function upsertPerson(supabase, payload) {
  if (!supabase) return payload; // Fallback para desenvolvimento sem supabase
  const { data, error } = await supabase
    .from('persons')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data || payload;
}

/**
 * Exclui uma pessoa da tabela 'persons' pelo ID.
 */
export async function deletePersonById(supabase, id) {
  if (!supabase) return true;
  const { error } = await supabase
    .from('persons')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Persiste ou atualiza uma caixa/estrutura na tabela 'nodes'.
 */
export async function upsertNode(supabase, payload) {
  if (!supabase) return payload;
  const { data, error } = await supabase
    .from('nodes')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data || payload;
}

/**
 * Exclui uma caixa/estrutura da tabela 'nodes' pelo ID.
 */
export async function deleteNodeById(supabase, id) {
  if (!supabase) return true;
  const { error } = await supabase
    .from('nodes')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Persiste ou atualiza um ativo na tabela 'assets'.
 */
export async function upsertAsset(supabase, payload) {
  if (!supabase) return payload;
  const { data, error } = await supabase
    .from('assets')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data || payload;
}

/**
 * Exclui um ativo da tabela 'assets' pelo ID.
 */
export async function deleteAssetById(supabase, id) {
  if (!supabase) return true;
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
