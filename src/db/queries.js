import { pool } from './pool.js';

export async function upsertCompany({ nombre_empresa, dominio, cargo_contacto }) {
  const result = await pool.query(
    `
      INSERT INTO companies (nombre_empresa, dominio, cargo_contacto)
      VALUES ($1, $2, $3)
      ON CONFLICT (dominio)
      DO UPDATE SET
        nombre_empresa = EXCLUDED.nombre_empresa,
        cargo_contacto = EXCLUDED.cargo_contacto
      RETURNING id, nombre_empresa, dominio, cargo_contacto, created_at
    `,
    [nombre_empresa, dominio, cargo_contacto],
  );

  return result.rows[0];
}

export async function insertLeadOutreach({ companyId, email }) {
  const result = await pool.query(
    `
      INSERT INTO lead_outreach (company_id, email)
      VALUES ($1, $2)
      RETURNING id, company_id, email, created_at
    `,
    [companyId, email],
  );

  return result.rows[0];
}

export async function insertLeadError({ companyId, stage, attempts, errorMessage }) {
  const result = await pool.query(
    `
      INSERT INTO lead_errors (company_id, stage, attempts, error_message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, company_id, stage, attempts, error_message, created_at
    `,
    [companyId, stage, attempts, errorMessage],
  );

  return result.rows[0];
}

export async function listLeads() {
  const result = await pool.query(
    `
      SELECT
        c.id AS company_id,
        c.nombre_empresa,
        c.dominio,
        c.cargo_contacto,
        o.id AS outreach_id,
        o.email AS correo_generado,
        o.created_at
      FROM lead_outreach o
      INNER JOIN companies c ON c.id = o.company_id
      ORDER BY o.created_at DESC
    `,
  );

  return result.rows;
}
