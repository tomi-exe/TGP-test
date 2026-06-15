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

### 1. Escala: 500 requests en 1 segundo

Si el endpoint recibiera 500 requests en 1 segundo, probablemente se saturaria primero la dependencia con el LLM por latencia y rate limits; despues podria saturarse el pool de PostgreSQL si cada request escribe inmediatamente. Para escalarlo, separaria la recepcion del lead de la generacion del correo: `POST /leads` validaria, guardaria el lead en estado `pending` y responderia `202 Accepted`; luego una cola procesaria los leads con workers, limites de concurrencia, rate limiting, timeouts, retries con backoff y cache para evitar regenerar correos repetidos.

### 2. Prompt injection

El riesgo principal es que campos externos como `nombre_empresa` o `cargo_contacto` incluyan instrucciones maliciosas y el modelo las interprete como parte del prompt. Para mitigarlo se validan tipos, largos maximos y formato, se detectan patrones sospechosos basicos, se delimitan los datos en `<lead_data>` como informacion externa no confiable y se usa un system prompt defensivo; no dependeria solo de una blacklist porque siempre pueden aparecer nuevas formas de escribir una instruccion maliciosa.

### 3. Resiliencia y costo del LLM

En produccion manejaria las llamadas al LLM con timeouts, maximo 3 reintentos y backoff para no insistir inmediatamente ante errores temporales o rate limits. Para controlar costos, limitaria el tamano del input, los tokens de salida y la temperatura; ademas registraria tokens usados, costo estimado, modelo utilizado y cantidad de intentos, evaluando cache o modelos mas baratos para tareas simples.

### 4. Observabilidad y calidad

Registraria por cada llamada un `request_id`, `company_id`, version del prompt, modelo usado, cantidad de intentos, latencia, estado final, tokens de entrada y salida, y si la respuesta paso validaciones minimas de calidad. Para evitar exponer datos sensibles, guardaria prompts completos solo cuando sea necesario o usaria versiones sanitizadas; tambien monitorearia latencia, respuestas rechazadas y casos sospechosos de baja calidad o alucinacion.

### 5. Produccion en AWS

Para desplegarlo en AWS usaria ECS Fargate para correr la API y workers sin administrar servidores, RDS PostgreSQL para la base de datos, SQS para desacoplar la generacion de correos, Secrets Manager o Parameter Store para credenciales, CloudWatch para logs y metricas, Application Load Balancer para exponer la API, autoscaling para crecer segun carga y una dead-letter queue para mensajes fallidos.
