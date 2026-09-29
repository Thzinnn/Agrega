import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { JobCardSkeleton } from '../JobCardSkeleton';

describe('JobCardSkeleton Component', () => {
  it('renders successfully', () => {
    const { container } = render(<JobCardSkeleton />);
    
    // Check if the outer container has the animate-pulse class
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});
