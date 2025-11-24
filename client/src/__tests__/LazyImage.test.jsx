import LazyImage from '../components/ui/LazyImage';
import { render, screen, waitFor } from '@testing-library/react';

describe('LazyImage Component', () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {
        // Simulate intersection
        setTimeout(() => {
          this.callback([{ isIntersecting: true }]);
        }, 0);
      }
      disconnect() {}
      unobserve() {}
    };
  });

  test('renders with placeholder initially', () => {
    render(<LazyImage src="test.jpg" alt="Test Image" />);

    // Placeholder should be visible
    const container = screen.getByAltText('Test Image').parentElement;
    expect(container).toBeInTheDocument();
  });

  test('loads image when in viewport', async () => {
    render(<LazyImage src="test.jpg" alt="Test Image" className="test-class" />);

    const img = screen.getByAltText('Test Image');

    await waitFor(() => {
      expect(img).toHaveAttribute('src', 'test.jpg');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  test('applies custom className', () => {
    render(<LazyImage src="test.jpg" alt="Test Image" className="custom-class" />);

    const container = screen.getByAltText('Test Image').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  test('calls onLoad callback when image loads', async () => {
    const onLoadMock = jest.fn();
    render(<LazyImage src="test.jpg" alt="Test Image" onLoad={onLoadMock} />);

    const img = screen.getByAltText('Test Image');

    // Simulate image load
    fireEvent.load(img);

    await waitFor(() => {
      expect(onLoadMock).toHaveBeenCalled();
    });
  });
});
