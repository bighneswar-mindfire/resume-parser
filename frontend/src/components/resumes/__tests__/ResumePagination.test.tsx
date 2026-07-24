import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumePagination from '../ResumePagination';

function setup(overrides: Partial<ComponentProps<typeof ResumePagination>> = {}) {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  render(
    <ResumePagination
      page={1}
      limit={20}
      total={100}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      {...overrides}
    />
  );
  return { onPageChange, onPageSizeChange };
}

describe('ResumePagination', () => {
  it('shows the current range and total', () => {
    setup({ page: 2, limit: 20, total: 100 });
    const matches = screen.getAllByText((_, node) => node?.textContent === 'Showing 21–40 of 100');
    expect(matches.length).toBeGreaterThan(0);
    expect(screen.getByText(/Page/).textContent).toContain('Page 2 of 5');
  });

  it('disables Prev on the first page and Next on the last page', () => {
    const { rerender } = render(
      <ResumePagination
        page={1}
        limit={20}
        total={20}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();

    rerender(
      <ResumePagination
        page={2}
        limit={20}
        total={100}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /prev/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });

  it('calls onPageChange with the next page number when Next is clicked', async () => {
    const user = userEvent.setup();
    const { onPageChange } = setup({ page: 2, total: 100, limit: 20 });

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with the previous page number when Prev is clicked', async () => {
    const user = userEvent.setup();
    const { onPageChange } = setup({ page: 3, total: 100, limit: 20 });

    await user.click(screen.getByRole('button', { name: /prev/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageSizeChange when the per-page select changes', async () => {
    const user = userEvent.setup();
    const { onPageSizeChange } = setup();

    await user.selectOptions(screen.getByLabelText(/results per page/i), '50');
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('renders "No results" when total is zero', () => {
    setup({ total: 0, limit: 20, page: 1 });
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });
});
