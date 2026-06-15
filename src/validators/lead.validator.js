import { hasSuspiciousPromptInjectionPattern } from '../security/promptInjectionGuard.js';

const fieldRules = {
  nombre_empresa: { maxLength: 100, label: 'nombre_empresa' },
  dominio: { maxLength: 255, label: 'dominio' },
  cargo_contacto: { maxLength: 100, label: 'cargo_contacto' },
};

const domainRegex = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;

function sanitizeString(value) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateStringField(body, fieldName) {
  const value = body[fieldName];
  const rules = fieldRules[fieldName];

  if (typeof value !== 'string') {
    return { error: `${rules.label} es obligatorio y debe ser string` };
  }

  const sanitized = sanitizeString(value);

  if (!sanitized) {
    return { error: `${rules.label} no puede estar vacio` };
  }

  if (sanitized.length > rules.maxLength) {
    return { error: `${rules.label} no puede superar ${rules.maxLength} caracteres` };
  }

  if (hasSuspiciousPromptInjectionPattern(sanitized)) {
    return { error: `${rules.label} contiene un patron no permitido` };
  }

  return { value: sanitized };
}

export function validateLeadPayload(body) {
  const nombreEmpresaResult = validateStringField(body, 'nombre_empresa');
  if (nombreEmpresaResult.error) return { error: nombreEmpresaResult.error };

  const dominioResult = validateStringField(body, 'dominio');
  if (dominioResult.error) return { error: dominioResult.error };

  const cargoContactoResult = validateStringField(body, 'cargo_contacto');
  if (cargoContactoResult.error) return { error: cargoContactoResult.error };

  const normalizedDomain = dominioResult.value.toLowerCase();

  if (normalizedDomain.includes('://') || normalizedDomain.includes('/') || !domainRegex.test(normalizedDomain)) {
    return { error: 'dominio debe tener un formato valido, por ejemplo empresa.com' };
  }

  return {
    value: {
      nombre_empresa: nombreEmpresaResult.value,
      dominio: normalizedDomain,
      cargo_contacto: cargoContactoResult.value,
    },
  };
}
