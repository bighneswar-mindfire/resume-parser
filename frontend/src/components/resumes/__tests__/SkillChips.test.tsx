import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkillChips from '../SkillChips';

describe('SkillChips', () => {
  it('renders a dash placeholder when there are no skills', () => {
    render(<SkillChips skills={[]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders every skill when no previewCount is given', () => {
    render(<SkillChips skills={['React', 'Vue', 'Svelte']} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
    expect(screen.getByText('Svelte')).toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it('limits visible skills to previewCount and shows a "+N more" badge', () => {
    render(<SkillChips skills={['A', 'B', 'C', 'D', 'E']} previewCount={2} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('C')).not.toBeInTheDocument();
    expect(screen.getByText('+3 more')).toBeInTheDocument();
  });

  it('does not show a "+N more" badge when previewCount exceeds skill count', () => {
    render(<SkillChips skills={['A', 'B']} previewCount={5} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });
});
