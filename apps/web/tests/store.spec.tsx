import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import StorePage, { getServerSideProps } from '../pages/store/[slug]';

describe('Store Page SSR', () => {
  const mockVendor = {
    _id: 'vendor-123',
    name: 'Test Store',
    email: 'test@store.com',
    slug: 'test-store',
    logoUrl: 'https://example.com/logo.png',
    planTier: 'Pro',
    description: 'Welcome to Test Store',
  };

  const mockProducts = [
    {
      _id: 'prod-1',
      name: 'Product 1',
      slug: 'product-1',
      price: 100,
      currency: 'INR',
      description: 'Test product 1',
    },
    {
      _id: 'prod-2',
      name: 'Product 2',
      slug: 'product-2',
      price: 200,
      currency: 'INR',
      description: 'Test product 2',
    },
  ];

  const mockServices = [
    {
      _id: 'svc-1',
      name: 'Service 1',
      slug: 'service-1',
      price: 500,
      currency: 'INR',
      description: 'Test service 1',
    },
  ];

  const mockClassifieds = [
    {
      _id: 'class-1',
      name: 'Classified 1',
      slug: 'classified-1',
      price: 1000,
      currency: 'INR',
      description: 'Test classified 1',
    },
  ];

  const mockProps = {
    vendor: mockVendor,
    products: mockProducts,
    services: mockServices,
    classifieds: mockClassifieds,
    productsMeta: { total: 2, page: 1, limit: 12, totalPages: 1 },
    servicesMeta: { total: 1, page: 1, limit: 12, totalPages: 1 },
    classifiedsMeta: { total: 1, page: 1, limit: 12, totalPages: 1 },
    currentTab: 'products' as const,
    currentPage: 1,
  };

  it('renders the vendor name and description', () => {
    const { getByText } = render(<StorePage {...mockProps} />);
    expect(getByText('Test Store')).toBeInTheDocument();
    expect(getByText('Welcome to Test Store')).toBeInTheDocument();
  });

  it('renders the products tab by default', () => {
    const { getByText } = render(<StorePage {...mockProps} />);
    expect(getByText('Product 1')).toBeInTheDocument();
    expect(getByText('Product 2')).toBeInTheDocument();
  });

  it('shows the correct tab counts', () => {
    const { getByText } = render(<StorePage {...mockProps} />);
    expect(getByText(/Products \(2\)/)).toBeInTheDocument();
    expect(getByText(/Services \(1\)/)).toBeInTheDocument();
    expect(getByText(/Classifieds \(1\)/)).toBeInTheDocument();
  });

  it('renders pagination controls when total pages > 1', () => {
    const propsWithPagination = {
      ...mockProps,
      productsMeta: { total: 25, page: 2, limit: 12, totalPages: 3 },
      currentPage: 2,
    };
    const { getByText } = render(<StorePage {...propsWithPagination} />);
    expect(getByText('Previous')).toBeInTheDocument();
    expect(getByText('Next')).toBeInTheDocument();
    expect(getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('does not render pagination when total pages is 1', () => {
    const { queryByText } = render(<StorePage {...mockProps} />);
    expect(queryByText('Previous')).not.toBeInTheDocument();
    expect(queryByText('Next')).not.toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    const emptyProps = {
      ...mockProps,
      products: [],
      productsMeta: { total: 0, page: 1, limit: 12, totalPages: 0 },
    };
    const { getByText } = render(<StorePage {...emptyProps} />);
    expect(getByText(/No products available/)).toBeInTheDocument();
  });

  it('renders services tab content correctly', () => {
    const servicesProps = {
      ...mockProps,
      currentTab: 'services' as const,
    };
    const { getByText } = render(<StorePage {...servicesProps} />);
    expect(getByText('Service 1')).toBeInTheDocument();
  });

  it('getServerSideProps returns correct props structure', async () => {
    // Mock fetch to return sample data
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockVendor,
      }),
    ) as jest.Mock;

    const context = {
      params: { slug: 'test-store' },
      query: {},
    } as any;

    const result = await getServerSideProps(context);

    expect(result).toHaveProperty('props');
    expect((result as any).props).toHaveProperty('vendor');
    expect((result as any).props).toHaveProperty('products');
    expect((result as any).props).toHaveProperty('services');
    expect((result as any).props).toHaveProperty('classifieds');
    expect((result as any).props).toHaveProperty('currentTab');
    expect((result as any).props).toHaveProperty('currentPage');
  });

  it('getServerSideProps returns notFound when vendor not found', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      }),
    ) as jest.Mock;

    const context = {
      params: { slug: 'nonexistent' },
      query: {},
    } as any;

    const result = await getServerSideProps(context);

    expect(result).toEqual({ notFound: true });
  });
});
