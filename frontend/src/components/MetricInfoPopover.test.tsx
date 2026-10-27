import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricInfoPopover from './MetricInfoPopover';

describe('MetricInfoPopover Component', () => {
  it('renders info icon for lipinski metric', () => {
    render(<MetricInfoPopover metricKey="lipinski" />);
    const button = screen.getByRole('button', { name: /information about lipinski/i });
    expect(button).toBeInTheDocument();
  });

  it('renders info icon for qed metric', () => {
    render(<MetricInfoPopover metricKey="qed" />);
    const button = screen.getByRole('button', { name: /information about quantitative estimate of drug-likeness/i });
    expect(button).toBeInTheDocument();
  });
});
