import { validarCedula, validarEmail, validarTelefono, validarNombre, validarNumeroPositivo, validarPassword, validarRangoFechas } from './validators';

test('validarCedula valida bien', () => {
  expect(validarCedula('0123456789')).toBe(true);
  expect(validarCedula('123')).toBe(false);
  expect(validarCedula('abcdefghij')).toBe(false);
});

test('validarEmail', () => {
  expect(validarEmail('a@b.com')).toBe(true);
  expect(validarEmail('not-an-email')).toBe(false);
});

test('validarTelefono', () => {
  expect(validarTelefono('+593 9 123 4567')).toBe(true);
  expect(validarTelefono('abc')).toBe(false);
});

test('validarNombre', () => {
  expect(validarNombre('Juan Pérez')).toBe(true);
  expect(validarNombre('X')).toBe(false);
});

test('validarNumeroPositivo', () => {
  expect(validarNumeroPositivo('123.45')).toBe(true);
  expect(validarNumeroPositivo('0')).toBe(false);
  expect(validarNumeroPositivo('')).toBe(false);
});

test('validarPassword', () => {
  expect(validarPassword('Abc12345!')).toBe(true);
  expect(validarPassword('abc')).toBe(false);
});

test('validarRangoFechas', () => {
  expect(validarRangoFechas('2020-01-01', '2020-01-02')).toBe(true);
  expect(validarRangoFechas('2020-01-02', '2020-01-01')).toBe(false);
});