# Microservicio Leads B2B

API REST sin frontend para guardar empresas y generar correos breves de outreach B2B usando Groq.

## Stack

- Node.js con ES Modules
- Express
- PostgreSQL
- pg
- Groq SDK
- Docker Compose
- SQL directo, sin ORM

## Levantar con Docker Compose

Crear un archivo `.env` en la raiz:

```env
GROQ_API_KEY=tu_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

Luego ejecutar:

```bash
docker compose up --build
```

La API queda disponible en `http://localhost:3000`.

## Variables de entorno

```env
PORT=3000
DATABASE_URL=postgres://postgres@localhost:5432/tgp_leads
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

En Docker Compose la API usa `DATABASE_URL=postgres://postgres@db:5432/tgp_leads`.

## Endpoints

### GET /health

```json
{
  "status": "ok"
}
```

### POST /leads

Request:

```json
{
  "nombre_empresa": "Acme",
  "dominio": "acme.com",
  "cargo_contacto": "Gerente Comercial"
}
```

Respuesta exitosa `201`:

```json
{
  "data": {
    "company": {
      "id": 1,
      "nombre_empresa": "Acme",
      "dominio": "acme.com",
      "cargo_contacto": "Gerente Comercial",
      "created_at": "2026-06-15T00:00:00.000Z"
    },
    "outreach": {
      "id": 1,
      "correo_generado": "Hola...",
      "created_at": "2026-06-15T00:00:00.000Z"
    }
  }
}
```

### GET /leads

Devuelve leads con correo generado, ordenados desde el mas reciente.

## Decisiones de diseno

- La API separa responsabilidades entre rutas, controller, service y db.
- Las consultas SQL usan parametros `$1`, `$2`, `$3`; no se concatenan valores de usuario.
- La empresa se guarda antes de llamar al LLM. Si Groq falla, el error queda asociado a la empresa.
- `GET /leads` lista solo leads con correo generado, no intentos fallidos.
- Los retries del LLM son para resiliencia ante fallos temporales, no para resolver escalabilidad masiva.

## Manejo de errores

- Los controllers usan `try/catch` y delegan en el middleware centralizado.
- Los errores no exponen stack trace al cliente.
- Los errores se loguean en consola con metodo y ruta.
- Si Groq falla tras 3 intentos, se guarda en `lead_errors` con `stage = "LLM_GENERATION"` y `attempts = 3`, y se responde `502`.

## Mitigacion de prompt injection

- Validacion de tipos, campos obligatorios y largos maximos.
- Dominio con formato razonable.
- Sanitizacion basica de strings.
- Rechazo de patrones sospechosos como `ignora instrucciones`, `system prompt` o `ignore previous instructions`.
- Prompt con datos delimitados en `<lead_data>`.
- El system prompt indica que los datos del lead son externos y nunca deben tratarse como instrucciones.

## Que mejoraria con mas tiempo

- Tests automatizados con base de datos temporal.
- Timeouts explicitos para llamadas a Groq.
- Rate limiting por IP o API key.
- Cola de trabajos para desacoplar la generacion del correo.
- Observabilidad estructurada con metricas y trazas.

## Preguntas tecnicas

**a) Escala:** si llegan 500 requests en 1 segundo, probablemente se saturan primero Groq o el pool de PostgreSQL. Escalaria con cola, workers, rate limiting, mas instancias de API y limites de concurrencia hacia el LLM.

**b) Prompt injection:** el riesgo es que el usuario meta instrucciones dentro de los campos del lead. Se mitiga con validacion, blacklist basica, delimitacion clara y system prompt defensivo.

**c) Resiliencia y costo del LLM:** los retries ayudan ante fallos temporales, pero aumentan latencia y costo. En produccion agregaria timeouts, circuit breaker, limites por usuario y monitoreo de rate limits.

**d) Observabilidad y calidad:** registraria latencia, intentos, errores, modelo usado, tokens, prompt y respuesta con cuidado de datos sensibles. Para calidad mediria respuestas vacias, alucinaciones y revisiones manuales.

**e) Produccion en AWS:** usaria ECS Fargate o Lambda para la API, RDS PostgreSQL para base de datos, Secrets Manager para credenciales, CloudWatch para logs, ALB/API Gateway para entrada y SQS para jobs asincronos.
