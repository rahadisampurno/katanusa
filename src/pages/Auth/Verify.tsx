import { useEffect } from 'react';
import { useLoaderData, useNavigate } from 'react-router';

const Verify: React.FC = () => {
  const verifyData = useLoaderData();
  const navigate = useNavigate();

  useEffect(() => {
    if (verifyData?.isVerified) {
      navigate('/auth/login');
    }
  }, [verifyData, navigate]);

  return (
    <div>
      <h1>Loading...</h1>
    </div>
  );
};

export default Verify;
