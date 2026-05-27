# CLAUDE.md — ATS LTI: AI4Devs TDD

Proyecto de formación (módulo 7 — AI4Devs) centrado en aplicar **TDD** sobre un sistema ATS (Applicant Tracking System) existente. La rama de trabajo es `tests-JDLM`.

---

## Estructura del repositorio

```
AI4Devs-tdd-2603/
├── backend/                  # API REST — Node.js + TypeScript + Express + Prisma
│   ├── src/
│   │   ├── index.ts                            # Entry point, app Express, puerto 3010
│   │   ├── routes/candidateRoutes.ts           # Router: POST /candidates
│   │   ├── presentation/controllers/
│   │   │   └── candidateController.ts          # Re-exporta addCandidate
│   │   ├── application/
│   │   │   ├── validator.ts                    # Toda la lógica de validación (testeable unitariamente)
│   │   │   └── services/
│   │   │       ├── candidateService.ts         # Orquesta validación + persistencia
│   │   │       └── fileUploadService.ts        # Manejo de uploads (multer)
│   │   ├── domain/models/
│   │   │   ├── Candidate.ts                    # Modelo Prisma + método save()
│   │   │   ├── Education.ts
│   │   │   ├── WorkExperience.ts
│   │   │   └── Resume.ts
│   │   └── tests/
│   │       └── tests-JDLM.test.ts             # Suite TDD principal (Jest + ts-jest)
│   ├── prisma/schema.prisma                    # Schema PostgreSQL
│   ├── openspec.md                             # Especificación OpenSpec completa
│   ├── package.json                            # Scripts + config Jest
│   └── tsconfig.json                           # Types: jest, node
├── frontend/                 # React 18 + TypeScript (puerto 3000)
│   └── src/
│       ├── components/       # AddCandidateForm, FileUploader, RecruiterDashboard
│       └── services/candidateService.js
├── prompts/
│   └── prompts-JDLM.md      # Registro de prompts utilizados y sus respuestas
├── docker-compose.yml        # PostgreSQL via Docker
├── .env                      # Variables de entorno (no commitear)
└── CLAUDE.md                 # Este archivo
```

---

## Stack tecnológico

| Capa       | Tecnología                                  |
| :--------- | :------------------------------------------ |
| Runtime    | Node.js · TypeScript 4.9                    |
| Framework  | Express 4                                   |
| ORM        | Prisma 5 (client + migrations)              |
| Base datos | PostgreSQL (Docker)                         |
| Testing    | Jest 29 · ts-jest · supertest (pendiente)   |
| Frontend   | React 18 · Bootstrap 5 · react-router-dom 6 |

---

## Comandos esenciales

### Base de datos

```bash
# Levantar PostgreSQL
docker-compose up -d

# Regenerar cliente Prisma tras cambios en schema
cd backend && npm run prisma:generate
```

### Backend

```bash
cd backend
npm run dev       # Desarrollo con hot-reload (ts-node-dev), puerto 3010
npm run build     # Compilar a dist/
npm test          # Ejecutar suite Jest
```

### Frontend

```bash
cd frontend
npm start         # Puerto 3000
npm run build
```

---

## Variables de entorno (`.env` en raíz)

El `.env` está trackeado con cambios locales — no sobreescribir sin confirmar.

---

## Endpoints del backend

| Método | Ruta          | Descripción                                   |
| :----- | :------------ | :-------------------------------------------- |
| POST   | `/candidates` | Crear o actualizar candidato                  |
| POST   | `/upload`     | Subir CV (PDF o DOCX via multipart/form-data) |

CORS habilitado solo para `http://localhost:3000`.

---

## Arquitectura de flujo (POST /candidates)

```
candidateRoutes.ts
    └── addCandidate()          ← candidateService.ts
            ├── validateCandidateData()   ← validator.ts   [tests unitarios]
            └── Candidate.save()          ← domain/models/ [tests integración]
                    ├── Education.save()
                    ├── WorkExperience.save()
                    └── Resume.save()
```

**Comportamiento especial:** si el payload incluye `id`, `validateCandidateData()` retorna inmediatamente sin validar — actúa como actualización implícita.

---

## Suite de tests TDD

**Archivo:** `backend/src/tests/tests-JDLM.test.ts`

| Sección     | Tests  | Qué cubre                                             |
| :---------- | :----: | :---------------------------------------------------- |
| Unitarios   |   15   | `validateCandidateData()` — sin DB, sin red           |
| Integración |   9    | `POST /candidates` HTTP — supertest + Prisma mockeado |
| **Total**   | **24** | HU-01 a HU-06                                         |

Los tests de integración requieren instalar supertest:

```bash
cd backend && npm install --save-dev supertest @types/supertest
```

**Historias de usuario cubiertas:**

| ID    | Descripción                                       |
| :---- | :------------------------------------------------ |
| HU-01 | Creación exitosa con datos mínimos → HTTP 201     |
| HU-02 | Creación con relaciones anidadas → HTTP 201       |
| HU-03 | Campo obligatorio ausente → HTTP 400              |
| HU-04 | Formato inválido por tipo de campo → HTTP 400     |
| HU-05 | Email duplicado (Prisma P2002) → HTTP 400         |
| HU-06 | Payload con `id` omite validaciones (update mode) |

Especificación completa en `backend/openspec.md` (contratos, modelo de datos, criterios GIVEN/WHEN/THEN).

---

## Configuración de Jest (`backend/package.json`)

```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/*.test.ts"]
}
```

`tsconfig.json` incluye `"types": ["jest", "node"]` para que TypeScript reconozca los globals de Jest.

---

## Restricciones críticas de los tests (anti-Test Theater)

Estas reglas son **obligatorias** al escribir o revisar cualquier test en este proyecto:

1. **Prohibido el estado verde prematuro.** Cada test nuevo debe fallar al ejecutarse antes de que exista la implementación que lo satisfaga. Un test que pasa sin código de producción no tiene valor.

2. **Sin aserciones tautológicas.** Está prohibido escribir expectativas vacías o triviales como `expect(true).toBe(true)`, cuerpos de `it()` vacíos, o aserciones sobre variables locales estáticas que nunca pueden fallar.

3. **Sin código de producción en la fase de esqueleto.** Al generar el esqueleto de tests no se modifica ningún controlador, servicio ni ruta. Los tests definen el comportamiento esperado; el código de producción viene después.

---

## Convenciones del proyecto

- Los archivos de trabajo del alumno llevan el sufijo `-JDLM` (tests, prompts, openspec)
- Los prompts usados y sus respuestas se documentan en `prompts/prompts-JDLM.md`
- La rama de trabajo es `tests-JDLM`; la rama principal es `main`
- No commitear `.env` con credenciales reales
- Los tests deben pasar en verde antes de hacer merge a `main`
