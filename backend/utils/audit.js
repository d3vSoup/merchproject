/**
 * Audit logging for admin actions
 */
let supabaseRef = null;

function setSupabase(client) {
  supabaseRef = client;
}

async function logAudit(adminEmail, action, entityType, entityId, oldValue, newValue) {
  if (!supabaseRef) return;
  try {
    await supabaseRef.from('audit_log').insert({
      admin_email: adminEmail,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      old_value: oldValue || null,
      new_value: newValue || null,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { setSupabase, logAudit };
