/**
 * @jest-environment jsdom
 */
test('use jsdom in this test file', () => {
    const element = document.createElement('div');
    expect(element).not.toBeNull();
  });

import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Cleanup after each test
afterEach(cleanup);

