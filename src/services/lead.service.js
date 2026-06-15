import {
  insertLeadError,
  insertLeadOutreach,
  listLeads,
  updateCompanyStatus,
  upsertCompany,
} from '../db/queries.js';
import { env } from '../config/env.js';
import { ApiError } from '../middlewares/error.middleware.js';
import { generateOutreachEmail } from './groq.service.js';
import { retryAsync } from './retry.service.js';

const maxGroqAttempts = 3;

export async function createLead(leadData) {
  const company = await upsertCompany(leadData);
  let generationAttempts = 0;

  try {
    const email = await retryAsync(
      (attempt) => {
        generationAttempts = attempt;
        return generateOutreachEmail(leadData);
      },
      maxGroqAttempts,
    );

    const outreach = await insertLeadOutreach({
      companyId: company.id,
      email,
      llmProvider: 'groq',
      llmModel: env.groqModel,
      status: 'generated',
      attempts: generationAttempts,
    });
    const processedCompany = await updateCompanyStatus(company.id, 'processed');

    return {
      company: processedCompany,
      outreach,
    };
  } catch (error) {
    await insertLeadError({
      companyId: company.id,
      stage: 'LLM_GENERATION',
      attempts: maxGroqAttempts,
      errorMessage: error.message,
    });
    await updateCompanyStatus(company.id, 'error');

    throw new ApiError('No fue posible generar el correo de outreach en este momento', 502);
  }
}

export async function getLeads() {
  return listLeads();
}
