import { redirect } from 'next/navigation';
import { SITE_ROUTES } from '../../../src/shared/config/constants';

export default function SearchPage() {
    redirect(SITE_ROUTES.PRODUCTS);
}
