import { redirect } from 'next/navigation';

// Login is now handled inline via SignInModal on the landing page.
export default function LoginPage() {
  redirect('/');
}
