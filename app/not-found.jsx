import { redirect } from 'next/navigation';

// Qualquer rota desconhecida volta para a Central (equivalente ao "*" do router).
export default function NotFound() {
  redirect('/');
}
