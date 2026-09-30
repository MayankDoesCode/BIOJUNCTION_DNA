import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-navy-800/60 flex items-center justify-center text-cyan-400/80 mb-4">
        <FileQuestion className="w-8 h-8 text-cyan-300" />
      </div>
      <h2 className="text-xl font-bold text-cyan-50">Field Route Not Found</h2>
      <p className="text-sm text-cyan-400/80 max-w-sm mt-1 mb-6">
        The requested module or screen does not exist on this field terminal.
      </p>
      <Button
        variant="primary"
        onClick={() => navigate('/dashboard')}
        leftIcon={<Home className="w-4 h-4" />}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};
