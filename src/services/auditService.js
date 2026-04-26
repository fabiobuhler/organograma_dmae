/**
 * Serviço de Auditoria para o sistema DMAE Organograma.
 * Centraliza as operações de escrita na tabela 'audit_logs'.
 */

/**
 * Constrói o payload padronizado para um log de auditoria.
 */
export function buildAuditLogPayload({
  userName,
  action,
  entityType,
  entityName,
  details
}) {
  return {
    user_name: userName || "Sistema",
    action: action || "Ação não informada",
    entity_type: entityType || null,
    entity_name: entityName || null,
    details: details || {}
  };
}

/**
 * Insere um registro na tabela 'audit_logs'.
 */
export async function insertAuditLog(supabase, payload) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("audit_logs")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Atalho para construir e inserir um log de auditoria em uma única operação.
 */
export async function writeAuditLog(supabase, {
  userName,
  action,
  entityType,
  entityName,
  details
}) {
  const payload = buildAuditLogPayload({
    userName,
    action,
    entityType,
    entityName,
    details
  });

  return insertAuditLog(supabase, payload);
}
