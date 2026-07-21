import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeFilterBar from '../ResumeFilterBar';
import { EMPTY_FILTERS, Filters } from '../types';

describe('ResumeFilterBar', () => {
  it('renders all filter inputs', () => {
    render(<ResumeFilterBar filters={EMPTY_FILTERS} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText(/keyword/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/location/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Any role' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Any score' })).toBeInTheDocument();
  });

  it('calls onChange with the updated keyword when typing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ResumeFilterBar filters={EMPTY_FILTERS} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText(/keyword/i), 'r');

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, keyword: 'r' });
  });

  it('calls onChange when a role is selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ResumeFilterBar filters={EMPTY_FILTERS} onChange={onChange} />);

    await user.selectOptions(screen.getByDisplayValue('Any role'), 'Backend Developer');

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, role: 'Backend Developer' });
  });

  it('calls onChange when a min score is selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ResumeFilterBar filters={EMPTY_FILTERS} onChange={onChange} />);

    await user.selectOptions(screen.getByDisplayValue('Any score'), '70');

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, minScore: '70' });
  });

  it('hides the clear button when no filters are active', () => {
    render(<ResumeFilterBar filters={EMPTY_FILTERS} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
  });

  it('shows the clear button when a filter is active and resets on click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const active: Filters = { ...EMPTY_FILTERS, keyword: 'react' };
    render(<ResumeFilterBar filters={active} onChange={onChange} />);

    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS);
  });
});
