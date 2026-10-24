import auth from '../../../libs/auth';
import { redirect } from 'react-router';

export const protectedLoader = async (): Promise<Response | null> => {
  const session = await auth.fetchSession();
  if (!session?.user) return redirect('/auth/login');
  return null;
};

export const expertLoader = async (): Promise<Response | null> => {
  const protectedResult = await protectedLoader();
  if (protectedResult) return protectedResult;
  const caps = auth.getCapabilities();
  const isExpert = caps.includes('expert_verified') || auth.getUserData()?.role === 'pakar';
  const hasAal2 = ['AAL2', 'AAL3'].includes(auth.getUserData()?.assuranceLevel ?? 'AAL1');

  if (!isExpert) return redirect('/dashboard');
  if (!hasAal2) return redirect('/dashboard/profil?setup=mfa&notice=expert-mfa-required');
  return null;
};

export const reviewerLoader = async (): Promise<Response | null> => {
  const protectedResult = await protectedLoader();
  if (protectedResult) return protectedResult;
  const caps = auth.getCapabilities();
  const isReviewer = caps.some((c) =>
    ['credential_reviewer', 'cultural_reviewer'].includes(c)
  );
  const hasAal2 = ['AAL2', 'AAL3'].includes(auth.getUserData()?.assuranceLevel ?? 'AAL1');

  if (!isReviewer || !hasAal2) return redirect('/dashboard');
  return null;
};

export const adminLoader = async (): Promise<Response | null> => {
  const protectedResult = await protectedLoader();
  if (protectedResult) return protectedResult;
  const caps = auth.getCapabilities();
  const isAdmin = caps.includes('admin') || auth.getUserData()?.role === 'admin';
  const hasAal2 = ['AAL2', 'AAL3'].includes(auth.getUserData()?.assuranceLevel ?? 'AAL1');

  if (!isAdmin || !hasAal2) return redirect('/dashboard');
  return null;
};

export const staffLoader = reviewerLoader;

export default protectedLoader;
