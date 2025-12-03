import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      setToken(token);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [searchParams, setToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-haunted-darker">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-haunted-purple mx-auto"></div>
        <p className="mt-4 text-gray-400">Authenticating...</p>
      </div>
    </div>
  );
}
