const verifyLoader = async (): Promise<{
  isVerified: boolean;
}> => {
  const email = localStorage.getItem('email');

  if (!email) {
    throw new Error('Email is not found');
  }

  return {
    isVerified: true,
  };
};

export default verifyLoader;
