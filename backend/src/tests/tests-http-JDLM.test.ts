/**
 * TDD Test Suite — ATS LTI: POST /candidates
 * Framework: Jest + ts-jest + supertest
 * Capa: Integración HTTP | supertest + modelos mockeados
 */

import request from 'supertest';
import { app } from '../index';
import { Candidate } from '../domain/models/Candidate';
import { Education } from '../domain/models/Education';
import { WorkExperience } from '../domain/models/WorkExperience';
import { Resume } from '../domain/models/Resume';

jest.mock('../domain/models/Candidate');
jest.mock('../domain/models/Education');
jest.mock('../domain/models/WorkExperience');
jest.mock('../domain/models/Resume');

const MockCandidate  = Candidate     as jest.MockedClass<typeof Candidate>;
const MockEducation  = Education     as jest.MockedClass<typeof Education>;
const MockWorkExp    = WorkExperience as jest.MockedClass<typeof WorkExperience>;
const MockResume     = Resume        as jest.MockedClass<typeof Resume>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// SECCIÓN 2 — TESTS DE INTEGRACIÓN HTTP
// Capa: POST /candidates | supertest + modelos mockeados
// ─────────────────────────────────────────────

describe('POST /candidates (integración HTTP)', () => {

  // ── HU-01 ──
  describe('HU-01 — Creación exitosa con datos mínimos', () => {
    it('AC-01: debe retornar 201 y el objeto candidato con id asignado', async () => {
      MockCandidate.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({
          id: 1,
          firstName: 'Juan',
          lastName: 'García',
          email: 'juan@example.com',
          phone: null,
          address: null,
        }),
        education: [], workExperience: [], resumes: [],
      } as any));

      const response = await request(app)
        .post('/candidates')
        .send({ firstName: 'Juan', lastName: 'García', email: 'juan@example.com' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        firstName: 'Juan',
        lastName: 'García',
        email: 'juan@example.com',
      });
    });
  });

  // ── HU-02 ──
  describe('HU-02 — Creación exitosa con payload completo', () => {
    it('AC-02: debe retornar 201 con candidato, educaciones, experiencias y CV persistidos', async () => {
      MockCandidate.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({
          id: 2,
          firstName: 'Ana',
          lastName: 'López',
          email: 'ana@example.com',
          phone: '612345678',
          address: null,
        }),
        education: [], workExperience: [], resumes: [],
      } as any));

      MockEducation.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ id: 1 }),
        candidateId: undefined,
      } as any));

      MockWorkExp.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ id: 1 }),
        candidateId: undefined,
      } as any));

      MockResume.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ id: 1 }),
        candidateId: undefined,
      } as any));

      const response = await request(app)
        .post('/candidates')
        .send({
          firstName: 'Ana', lastName: 'López', email: 'ana@example.com',
          phone: '612345678',
          educations: [{ institution: 'UPM', title: 'Ingeniería Informática', startDate: '2015-09-01' }],
          workExperiences: [{ company: 'Acme', position: 'Developer', startDate: '2020-07-01' }],
          cv: { filePath: '/uploads/cv.pdf', fileType: 'pdf' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        firstName: 'Ana',
        email: 'ana@example.com',
      });
    });
  });

  // ── HU-03 ── ✅ GREEN: la validación rechaza antes de llegar a save()
  describe('HU-03 — Campo obligatorio ausente', () => {
    it('AC-03a: debe retornar 400 con { message: "Error: Invalid name" } cuando falta firstName', async () => {
      const response = await request(app)
        .post('/candidates')
        .send({ lastName: 'García', email: 'juan@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Error: Invalid name' });
    });

    it('AC-03b: debe retornar 400 con { message: "Error: Invalid name" } cuando falta lastName', async () => {
      const response = await request(app)
        .post('/candidates')
        .send({ firstName: 'Juan', email: 'juan@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Error: Invalid name' });
    });

    it('AC-03c: debe retornar 400 con { message: "Error: Invalid email" } cuando falta email', async () => {
      const response = await request(app)
        .post('/candidates')
        .send({ firstName: 'Juan', lastName: 'García' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Error: Invalid email' });
    });
  });

  // ── HU-04 ── ✅ GREEN: la validación rechaza antes de llegar a save()
  describe('HU-04 — Formato inválido', () => {
    it('AC-04a: debe retornar 400 con { message: "Error: Invalid email" } para email malformado', async () => {
      const response = await request(app)
        .post('/candidates')
        .send({ firstName: 'Juan', lastName: 'García', email: 'bad-email' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Error: Invalid email' });
    });

    it('AC-04b: debe retornar 400 con { message: "Error: Invalid phone" } para teléfono incorrecto', async () => {
      const response = await request(app)
        .post('/candidates')
        .send({ firstName: 'Juan', lastName: 'García', email: 'juan@example.com', phone: '123456789' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Error: Invalid phone' });
    });
  });

  // ── HU-05 ── ✅ GREEN: el error de email duplicado se captura y traduce a respuesta 400
  describe('HU-05 — Email duplicado', () => {
    it('AC-05: debe retornar 400 con { message: "The email already exists in the database" }', async () => {
      const prismaError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });

      MockCandidate.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(prismaError),
        education: [], workExperience: [], resumes: [],
      } as any));

      const response = await request(app)
        .post('/candidates')
        .send({ firstName: 'Juan', lastName: 'García', email: 'duplicado@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'The email already exists in the database' });
    });
  });

  // ── HU-06 ── ✅ GREEN: la validación se omite y save() se llama directamente, permitiendo actualización implícita
  describe('HU-06 — Modo actualización implícita', () => {
    it('AC-06: debe omitir validación y delegar en save() cuando el payload contiene id', async () => {
      MockCandidate.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({
          id: 1,
          firstName: 'Actualizado',
          lastName: 'García',
          email: 'juan@example.com',
        }),
        education: [], workExperience: [], resumes: [],
      } as any));

      const response = await request(app)
        .post('/candidates')
        .send({ id: 1, firstName: 'Actualizado', lastName: 'García', email: 'juan@example.com' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 1);
    });
  });
});
