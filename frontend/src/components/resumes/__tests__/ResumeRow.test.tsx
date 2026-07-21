import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeRow from '../ResumeRow';
import { makeResume } from '../../../test/fixtures';

function renderRow(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>{ui}</tbody>
    </table>
  );
}

describe('ResumeRow', () => {
  it('renders the candidate name, file name, email and phone', () => {
    renderRow(<ResumeRow resume={makeResume()} onToggle={vi.fn()} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane_doe_resume.pdf')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1 555 0100')).toBeInTheDocument();
  });

  it('falls back to a dash when the name is missing', () => {
    renderRow(<ResumeRow resume={makeResume({ name: null })} onToggle={vi.fn()} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows the experience in years when completed', () => {
    renderRow(<ResumeRow resume={makeResume({ experience: 7 })} onToggle={vi.fn()} />);
    expect(screen.getByText('7 yrs')).toBeInTheDocument();
  });

  it('shows a dash for experience when the resume is not completed', () => {
    renderRow(<ResumeRow resume={makeResume({ status: 'PROCESSING' })} onToggle={vi.fn()} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders the status badge text', () => {
    renderRow(<ResumeRow resume={makeResume({ status: 'FAILED' })} onToggle={vi.fn()} />);
    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  it('formats education as "degree — school (year)"', () => {
    renderRow(<ResumeRow resume={makeResume()} onToggle={vi.fn()} />);
    expect(screen.getByText('BSc Computer Science — MIT (2018)')).toBeInTheDocument();
  });

  it('shows a dash when there is no education', () => {
    renderRow(<ResumeRow resume={makeResume({ education: [] })} onToggle={vi.fn()} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calls onToggle when the row is clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderRow(<ResumeRow resume={makeResume()} onToggle={onToggle} />);

    await user.click(screen.getByText('Jane Doe'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
