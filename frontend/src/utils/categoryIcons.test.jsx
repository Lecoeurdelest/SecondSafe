import React from 'react';
import { render } from '@testing-library/react';
import CategoryIcon from './categoryIcons';

test.each(['books', 'fashion', 'electronics', 'home', 'beauty', 'sports', 'toys', 'pets'])('%s has a Phosphor icon', slug => {
  const { container } = render(<CategoryIcon slug={slug} />);
  expect(container.querySelector('svg[viewBox="0 0 256 256"]')).toBeInTheDocument();
});

test('an unknown category falls back to a generic tag icon', () => {
  const unknown = render(<CategoryIcon slug="vehicles" />).container.innerHTML;
  const books = render(<CategoryIcon slug="books" />).container.innerHTML;
  expect(unknown).toContain('<svg');
  expect(unknown).not.toBe(books);
});
