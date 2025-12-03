import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChartModal from '../components/ChartModal';

describe('ChartModal Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(<ChartModal isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render chart options when isOpen is true', () => {
    render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Astrology Charts')).toBeInTheDocument();
    expect(screen.getByText('Choose a chart to generate')).toBeInTheDocument();

    // Check all 4 chart options are displayed
    expect(screen.getByText('Birth Chart')).toBeInTheDocument();
    expect(screen.getByText('Navamsa Chart')).toBeInTheDocument();
    expect(screen.getByText('Porutham')).toBeInTheDocument();
    expect(screen.getByText('Behavior Analysis')).toBeInTheDocument();
  });

  it('should display chart subtitles', () => {
    render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Rasi Chart (D1)')).toBeInTheDocument();
    expect(screen.getByText('D9 Chart')).toBeInTheDocument();
    expect(screen.getByText('Compatibility')).toBeInTheDocument();
    expect(screen.getByText('Predictions')).toBeInTheDocument();
  });

  it('should display chart descriptions', () => {
    render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Generate comprehensive birth chart/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyze navamsa divisional chart/i)).toBeInTheDocument();
    expect(screen.getByText(/Calculate marriage compatibility/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate personality and behavior predictions/i)).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /×/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close modal when backdrop is clicked', () => {
    const { container } = render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    const backdrop = container.querySelector('.bg-black\\/60');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show Birth Chart form when Birth Chart option is clicked', () => {
    render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    const birthChartButton = screen.getByRole('button', { name: /Birth Chart/i });
    fireEvent.click(birthChartButton);

    // Header should change
    expect(screen.getByText('Birth Chart')).toBeInTheDocument();
    expect(screen.getByText('Enter birth details')).toBeInTheDocument();

    // Back button should appear
    expect(screen.getByRole('button', { name: /← Back/i })).toBeInTheDocument();
  });

  it('should show Navamsa Chart form when Navamsa option is clicked', () => {
    render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    const navamsaButton = screen.getByRole('button', { name: /Navamsa Chart/i });
    fireEvent.click(navamsaButton);

    expect(screen.getByText('Navamsa Chart')).toBeInTheDocument();
    expect(screen.getByText('Enter birth details')).toBeInTheDocument();
  });

  it('should show Porutham form when Porutham option is clicked', () => {
    render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    const poruthamButton = screen.getByRole('button', { name: /Porutham/i });
    fireEvent.click(poruthamButton);

    expect(screen.getByText('Porutham')).toBeInTheDocument();
    expect(screen.getByText('Enter birth details')).toBeInTheDocument();
  });

  it('should show Behavior Analysis form when Behavior option is clicked', () => {
    render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    const behaviorButton = screen.getByRole('button', { name: /Behavior Analysis/i });
    fireEvent.click(behaviorButton);

    expect(screen.getByText('Behavior Analysis')).toBeInTheDocument();
    expect(screen.getByText('Enter birth details')).toBeInTheDocument();
  });

  it('should go back to chart selection when back button is clicked', () => {
    render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    // Select a chart
    const birthChartButton = screen.getByRole('button', { name: /Birth Chart/i });
    fireEvent.click(birthChartButton);

    // Click back button
    const backButton = screen.getByRole('button', { name: /← Back/i });
    fireEvent.click(backButton);

    // Should be back at chart selection
    expect(screen.getByText('Astrology Charts')).toBeInTheDocument();
    expect(screen.getByText('Choose a chart to generate')).toBeInTheDocument();
  });

  it('should have proper z-index for modal overlay', () => {
    const { container } = render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    const modalContainer = container.firstChild;
    expect(modalContainer).toHaveClass('z-[200]');
  });

  it('should apply gradient backgrounds to chart option cards', () => {
    const { container } = render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    const gradients = container.querySelectorAll('.bg-gradient-to-br');
    expect(gradients.length).toBeGreaterThan(0);
  });

  it('should display emojis for each chart option', () => {
    render(<ChartModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('🌟')).toBeInTheDocument(); // Birth Chart
    expect(screen.getByText('✨')).toBeInTheDocument(); // Navamsa
    expect(screen.getByText('💑')).toBeInTheDocument(); // Porutham
    expect(screen.getByText('🧠')).toBeInTheDocument(); // Behavior
  });
});
