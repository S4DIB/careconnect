// Landing page - redirect to signin
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/auth/signin');
}

