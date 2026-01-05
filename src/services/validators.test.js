import { validarCedula, validarEmail, validarTelefono, validarNombre, validarNumeroPositivo, validarPassword, validarRangoFechas } from './validators';

test('validarCedula valida bien', () => {
  // construir una cédula válida calculando el dígito verificador para 9 dígitos base
  const base = '012345678'; // 9 dígitos
  const digits = base.split('').map(d => Number(d));
  const coef = [2,1,2,1,2,1,2,1,2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    const prod = digits[i] * coef[i];
    suma += prod >= 10 ? prod - 9 : prod;
  }
  const modulo = suma % 10;
  const check = modulo === 0 ? 0 : 10 - modulo;
  const validCedula = base + String(check);

  expect(validarCedula(validCedula)).toBe(true);
  expect(validarCedula('123')).toBe(false);
  expect(validarCedula('abcdefghij')).toBe(false);
});

test('validarEmail', () => {
  expect(validarEmail('a@b.com')).toBe(true);
  expect(validarEmail('not-an-email')).toBe(false);
});

test('validarTelefono', () => {
  // número internacional con todos los dígitos
  expect(validarTelefono('+593912345678')).toBe(true);
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