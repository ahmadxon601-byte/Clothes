import { redirect } from 'next/navigation';
import { TELEGRAM_ROUTES } from '../../../src/shared/config/constants';

export default function TelegramSearchPage() {
    redirect(TELEGRAM_ROUTES.PRODUCTS);
}
