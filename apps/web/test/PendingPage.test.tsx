import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PendingPage } from '../src/pages/PendingPage';

describe('PendingPage', () => {
  it('names the screen and its tracking ticket', () => {
    render(<PendingPage title="Purchase requests" ticket="BF-021" />);
    expect(screen.getByRole('heading', { name: 'Purchase requests' })).toBeInTheDocument();
    expect(screen.getByText('BF-021')).toBeInTheDocument();
  });
});
