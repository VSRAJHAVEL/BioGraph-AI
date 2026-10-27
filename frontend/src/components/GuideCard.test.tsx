import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GuideCard from './GuideCard';

describe('GuideCard Component', () => {
  it('renders guidance title and steps for predict page', () => {
    render(<GuideCard pageKey="predict" />);
    expect(screen.getByText(/How to Predict Molecular Properties/i)).toBeInTheDocument();
    expect(screen.getByText(/What am I looking at\?/i)).toBeInTheDocument();
  });

  it('triggers onTryExample when Try Example button is clicked', () => {
    const onTryExample = vi.fn();
    render(<GuideCard pageKey="predict" onTryExample={onTryExample} />);
    const tryButton = screen.getByRole('button', { name: /try example/i });
    expect(tryButton).toBeInTheDocument();
    fireEvent.click(tryButton);
    expect(onTryExample).toHaveBeenCalledWith('CC(C)CC1=CC=C(C=C1)C(C)C(=O)O');
  });
});
