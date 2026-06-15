import { ApiError } from '../middlewares/error.middleware.js';
import { createLead, getLeads } from '../services/lead.service.js';
import { validateLeadPayload } from '../validators/lead.validator.js';

export async function createLeadController(req, res, next) {
  try {
    const validation = validateLeadPayload(req.body);

    if (validation.error) {
      throw new ApiError(validation.error, 400);
    }

    const result = await createLead(validation.value);

    res.status(201).json({
      data: {
        company: result.company,
        outreach: {
          id: result.outreach.id,
          correo_generado: result.outreach.email,
          created_at: result.outreach.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listLeadsController(req, res, next) {
  try {
    const leads = await getLeads();

    res.status(200).json({
      data: leads,
    });
  } catch (error) {
    next(error);
  }
}
