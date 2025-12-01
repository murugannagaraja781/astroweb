import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MobileHome from '../pages/mobile/MobileHome';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('MobileHome Component', () => {
  const mockAstrologers = [
    {
      _id: '1',
      name: 'John Doe',
      profile: {
        isOnline: true,
        ratePerMinute: 50,
        specialties: ['Vedic Astrology', 'Numerology'],
      },
    },
    {
      _id: '2',
      name: 'Jane Smith',
      profile: {
        isOnline: false,
        ratePerMinute: 60,
        specialties: ['Tarot Reading'],
      },
    },
  ];

  const defaultProps = {
    astrologers: mockAstrologers,
    loading: false,
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders MobileHome component', () => {
    render(
      <BrowserRouter>
        <MobileHome {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('AstroConnect')).toBeInTheDocument();
    expect(screen.getByText('Connect with celestial guidance ✨')).toBeInTheDocument();
  });

  test('displays online astrologers section when there are online astrologers', () => {
    render(
      <BrowserRouter>
        <MobileHome {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Online Now')).toBeInTheDocument();
  });

  test('displays astrologer names', () => {
    render(
      <BrowserRouter>
        <MobileHome {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('displays astrologer rates', () => {
    render(
      <BrowserRouter>
        <MobileHome {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('₹50/min')).toBeInTheDocument();
    expect(screen.getByText('₹60/min')).toBeInTheDocument();
  });

  test('shows loading skeleton when loading is true', () => {
    render(
      <BrowserRouter>
        <MobileHome astrologers={[]} loading={true} />
      </BrowserRouter>
    );

    // Check for skeleton loaders
    const skeletonCards = screen.getAllByTestId('skeleton-card');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  test('navigates to astrologer detail on card click', () => {
    render(
      <BrowserRouter>
        <MobileHome {...defaultProps} />
      </BrowserRouter>
    );

    const astrologerCard = screen.getAllByText('Connect')[0].closest('div').parentElement;
    fireEvent.click(astrologerCard);

    expect(mockNavigate).toHaveBeenCalledWith('/astrologer/1');
  });

  test('displays specialties for each astrologer', () => {
    render(
      <BrowserRouter>
        <MobileHome {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Vedic Astrology, Numerology')).toBeInTheDocument();
    expect(screen.getByText('Tarot Reading')).toBeInTheDocument();
  });

  test('shows Top Astrologers heading', () => {
    render(
      <BrowserRouter>
        <MobileHome {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Top Astrologers')).toBeInTheDocument();
  });

  test('renders connect buttons for all astrologers', () => {
    render(
      <BrowserRouter>
        <MobileHome {...defaultProps} />
      </BrowserRouter>
    );

    const connectButtons = screen.getAllByText('Connect');
    expect(connectButtons.length).toBe(mockAstrologers.length);
  });
});
