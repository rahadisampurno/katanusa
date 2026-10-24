import auth from '../../../libs/auth';
import { redirect } from 'react-router';

const publicLoader = async (): Promise<Response | null> => {
  const session = await auth.fetchSession();
  if (session?.user) return redirect('/dashboard');
  return null;
};

export default publicLoader;
