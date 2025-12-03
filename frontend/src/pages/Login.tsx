import { Ghost } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '../api/client';

export default function Login() {
  const handleLogin = async () => {
    try {
      const { data } = await apiClient.get('/auth/github/initiate');
      window.location.href = data.data.authUrl;
    } catch (error) {
      console.error('Failed to initiate login:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-haunted-darker">
      <div className="text-center">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <Ghost className="w-32 h-32 mx-auto text-haunted-purple" />
        </motion.div>
        
        <h1 className="text-5xl font-bold mt-8 mb-4 text-white">
          Code<span className="text-haunted-purple">Crypt</span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-8 max-w-md mx-auto">
          Where technical debt becomes literal hauntings
        </p>
        
        <button
          onClick={handleLogin}
          className="bg-haunted-purple hover:bg-haunted-purple-light px-8 py-4 rounded-lg text-white font-semibold transition-colors text-lg"
        >
          👻 Connect GitHub
        </button>
        
        <p className="text-sm text-gray-500 mt-8">
          Scan your repositories for ghosts, zombies, vampires, and more
        </p>
      </div>
    </div>
  );
}
