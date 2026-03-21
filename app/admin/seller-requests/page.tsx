import { redirect } from 'next/navigation';

export default function SellerRequestsRedirect() {
  redirect('/admin/applications');
}
