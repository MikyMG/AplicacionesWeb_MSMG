import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginContainer from './LoginContainer';

test('muestra error si campos obligatorios están vacíos', () => {
  render(<LoginContainer />);

  const boton = screen.getByRole('button', { name: /ingresar/i });
  fireEvent.click(boton);

  expect(screen.getByText(/Todos los campos son obligatorios/i)).toBeInTheDocument();
});