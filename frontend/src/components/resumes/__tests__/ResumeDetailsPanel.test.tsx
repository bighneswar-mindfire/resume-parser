import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResumeDetailsPanel from '../ResumeDetailsPanel';
import { makeResume } from '../../../test/fixtures';

function renderPanel(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>
        <tr>{ui}</tr>
      </tbody>
    </table>
  );
}

describe('ResumeDetailsPanel', () => {
  it('shows the error message for a FAILED resume', () => {
    renderPanel(
      <ResumeDetailsPanel
        resume={makeResume({ status: 'FAILED', errorMessage: 'OCR timed out' })}
      />
    );
    expect(screen.getByText(/processing failed/i)).toBeInTheDocument();
    expect(screen.getByText(/OCR timed out/)).toBeInTheDocument();
  });

  it('shows a generic error when a FAILED resume has no message', () => {
    renderPanel(
      <ResumeDetailsPanel resume={makeResume({ status: 'FAILED', errorMessage: undefined })} />
    );
    expect(screen.getByText(/unknown error/i)).toBeInTheDocument();
  });

  it('renders the skill count and all skills', () => {
    renderPanel(<ResumeDetailsPanel resume={makeResume()} />);
    expect(screen.getByText('All Skills (3)')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders "None detected" when there are no skills', () => {
    renderPanel(<ResumeDetailsPanel resume={makeResume({ skills: [] })} />);
    expect(screen.getByText('All Skills (0)')).toBeInTheDocument();
    expect(screen.getAllByText('None detected').length).toBeGreaterThan(0);
  });

  it('renders education entries', () => {
    renderPanel(<ResumeDetailsPanel resume={makeResume()} />);
    expect(screen.getByText('BSc Computer Science')).toBeInTheDocument();
    expect(screen.getByText(/MIT/)).toBeInTheDocument();
    expect(screen.getByText(/2018/)).toBeInTheDocument();
  });

  it('renders role matches with their scores', () => {
    renderPanel(<ResumeDetailsPanel resume={makeResume()} />);
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('shows "Not scored yet" when there are no matched roles', () => {
    renderPanel(<ResumeDetailsPanel resume={makeResume({ matchedRoles: [] })} />);
    expect(screen.getByText('Not scored yet')).toBeInTheDocument();
  });

  it('renders the document id in the footer', () => {
    renderPanel(<ResumeDetailsPanel resume={makeResume({ _id: 'doc-999' })} />);
    expect(screen.getByText(/doc-999/)).toBeInTheDocument();
  });
});
