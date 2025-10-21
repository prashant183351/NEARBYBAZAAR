import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuppliersPage from '../pages/dropship/Suppliers';
import MappingsPage from '../pages/dropship/Mappings';
import PerformancePage from '../pages/dropship/Performance';

describe('Dropship pages smoke test', () => {
    it('renders Suppliers page', () => {
        render(<SuppliersPage />);
        expect(screen.getByText('Suppliers')).toBeInTheDocument();
    });
    it('renders Mappings page', () => {
        render(<MappingsPage />);
        expect(screen.getByText('SKU Mappings')).toBeInTheDocument();
    });
    it('renders Performance page', () => {
        render(<PerformancePage />);
        expect(screen.getByText('Performance')).toBeInTheDocument();
    });
});
