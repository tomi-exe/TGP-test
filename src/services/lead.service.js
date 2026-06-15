import {
  insertLeadError,
  insertLeadOutreach,
  listLeads,
  upsertCompany,
} from '../db/queries.js';
import { ApiError } from '../middlewares/error.middleware.js';
import { generateOutreachEmail } from './groq.service.js';
import { retryAsync } from './retry.service.js';

const maxGroqAttempts = 3;

export async function createLead(leadData) {
  const company = await upsertCompany(leadData);

  try {
    const email = await retryAsync(
      () => generateOutreachEmail(leadData),
      maxGroqAttempts,
    );

    const outreach = await insertLeadOutreach({
      companyId: company.id,
      email,
    });

    return {
      company,
      outreach,
    };
  } catch (error) {
    await insertLeadError({
      companyId: company.id,
      stage: 'LLM_GENERATION',
      attempts: maxGroqAttempts,
      errorMessage: error.message,
    });

    throw new ApiError('No fue posible generar el correo de outreach en este momento', 502);
  }
}

export async function getLeads() {
  return listLeads();
}
