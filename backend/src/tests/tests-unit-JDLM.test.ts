/**
 * TDD Test Suite — ATS LTI: validateCandidateData()
 * Framework: Jest + ts-jest
 * Capa: Unitaria | Sin DB, sin red
 */

import { validateCandidateData } from '../application/validator';

// ─────────────────────────────────────────────
// SECCIÓN 1 — TESTS UNITARIOS
// Capa: validateCandidateData() | Sin DB, sin red
// ─────────────────────────────────────────────

describe('validateCandidateData()', () => {

  describe('HU-01 — Happy path: payload mínimo válido', () => {
    it('AC-01: no debe lanzar error con firstName, lastName y email válidos', () => {
      const payload = { firstName: 'Juan', lastName: 'García', email: 'juan@example.com' };

      expect(() => validateCandidateData(payload)).not.toThrow();
    });
  });

  describe('HU-02 — Happy path: payload completo con relaciones', () => {
    it('AC-02: no debe lanzar error con todos los campos opcionales válidos', () => {
      const payload = {
        firstName: 'Ana', lastName: 'López', email: 'ana@example.com',
        phone: '612345678', address: 'Calle Mayor 1',
        educations: [{ institution: 'UPM', title: 'Ingeniería Informática', startDate: '2015-09-01', endDate: '2020-06-30' }],
        workExperiences: [{ company: 'Acme', position: 'Developer', startDate: '2020-07-01' }],
        cv: { filePath: '/uploads/cv.pdf', fileType: 'pdf' },
      };

      expect(() => validateCandidateData(payload)).not.toThrow();
    });
  });

  describe('HU-03 — Rechazo por campo obligatorio ausente', () => {
    it('AC-03a: debe lanzar "Invalid name" cuando falta firstName', () => {
      expect(() => validateCandidateData({ lastName: 'García', email: 'juan@example.com' }))
        .toThrow('Invalid name');
    });

    it('AC-03b: debe lanzar "Invalid name" cuando falta lastName', () => {
      expect(() => validateCandidateData({ firstName: 'Juan', email: 'juan@example.com' }))
        .toThrow('Invalid name');
    });

    it('AC-03c: debe lanzar "Invalid email" cuando falta email', () => {
      expect(() => validateCandidateData({ firstName: 'Juan', lastName: 'García' }))
        .toThrow('Invalid email');
    });
  });

  describe('HU-04 — Rechazo por formato inválido', () => {
    const base = { firstName: 'Juan', lastName: 'García', email: 'juan@example.com' };

    it('AC-04a: debe lanzar "Invalid email" para email malformado', () => {
      expect(() => validateCandidateData({ ...base, email: 'not-an-email' }))
        .toThrow('Invalid email');
    });

    it('AC-04b: debe lanzar "Invalid phone" para teléfono que no cumple /^(6|7|9)\\d{8}$/', () => {
      expect(() => validateCandidateData({ ...base, phone: '123456789' }))
        .toThrow('Invalid phone');
    });

    it('AC-04c: debe lanzar "Invalid name" cuando firstName contiene números', () => {
      expect(() => validateCandidateData({ ...base, firstName: 'John123' }))
        .toThrow('Invalid name');
    });

    it('AC-04d: debe lanzar "Invalid name" cuando firstName tiene menos de 2 caracteres', () => {
      expect(() => validateCandidateData({ ...base, firstName: 'A' }))
        .toThrow('Invalid name');
    });

    it('AC-04e: debe lanzar "Invalid address" cuando address supera 100 caracteres', () => {
      expect(() => validateCandidateData({ ...base, address: 'A'.repeat(101) }))
        .toThrow('Invalid address');
    });

    it('AC-04f: debe lanzar "Invalid date" cuando educations[].startDate no es YYYY-MM-DD', () => {
      expect(() => validateCandidateData({
        ...base,
        educations: [{ institution: 'UPM', title: 'Ingeniería', startDate: '24-05-2026' }],
      })).toThrow('Invalid date');
    });

    it('AC-04g: debe lanzar "Invalid end date" cuando educations[].endDate no es YYYY-MM-DD', () => {
      expect(() => validateCandidateData({
        ...base,
        educations: [{ institution: 'UPM', title: 'Ingeniería', startDate: '2020-01-01', endDate: '2026/05/24' }],
      })).toThrow('Invalid end date');
    });

    it('AC-04h: debe lanzar "Invalid description" cuando workExperiences[].description supera 200 chars', () => {
      expect(() => validateCandidateData({
        ...base,
        workExperiences: [{ company: 'Acme', position: 'Dev', startDate: '2020-01-01', description: 'X'.repeat(201) }],
      })).toThrow('Invalid description');
    });

    it('AC-04i: debe lanzar "Invalid CV data" cuando cv.filePath está vacío', () => {
      expect(() => validateCandidateData({ ...base, cv: { filePath: '', fileType: 'pdf' } }))
        .toThrow('Invalid CV data');
    });
  });

  describe('HU-06 — Modo actualización implícita (payload con id)', () => {
    it('AC-06: debe omitir todas las validaciones cuando el payload incluye id', () => {
      expect(() => validateCandidateData({ id: 1 })).not.toThrow();
    });
  });

  // ── Casos límite: campos opcionales vacíos/nulos ──
  describe('Campos opcionales — casos límite', () => {
    const base = { firstName: 'Juan', lastName: 'García', email: 'juan@example.com' };

    it('CL-01: educations como array vacío [] no debe lanzar error', () => {
      expect(() => validateCandidateData({ ...base, educations: [] })).not.toThrow();
    });

    it('CL-02: workExperiences como array vacío [] no debe lanzar error', () => {
      expect(() => validateCandidateData({ ...base, workExperiences: [] })).not.toThrow();
    });

    it('CL-03: cv como objeto vacío {} no debe lanzar error (se ignora)', () => {
      expect(() => validateCandidateData({ ...base, cv: {} })).not.toThrow();
    });

    it('CL-04: phone ausente (undefined) no debe lanzar error', () => {
      expect(() => validateCandidateData({ ...base })).not.toThrow();
    });

    it('CL-05: address ausente (undefined) no debe lanzar error', () => {
      expect(() => validateCandidateData({ ...base })).not.toThrow();
    });

    it('CL-06: debe lanzar "Invalid CV data" cuando cv tiene filePath pero falta fileType', () => {
      expect(() => validateCandidateData({ ...base, cv: { filePath: '/uploads/cv.pdf' } }))
        .toThrow('Invalid CV data');
    });

    it('CL-07: debe lanzar "Invalid CV data" cuando cv tiene fileType pero falta filePath', () => {
      expect(() => validateCandidateData({ ...base, cv: { fileType: 'pdf' } }))
        .toThrow('Invalid CV data');
    });
  });
});
