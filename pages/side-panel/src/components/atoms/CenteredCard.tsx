import type React from 'react';

interface CenteredCardProps {
  children: React.ReactNode;
  cardClassName?: string;
  containerClassName?: string;
}

const CenteredCard: React.FC<CenteredCardProps> = ({ children, cardClassName = '', containerClassName = '' }) => (
  <div className={`flex items-center justify-center min-h-screen p-6 bg-gray-50 ${containerClassName}`}>
    <div className={`bg-white p-6 rounded-lg shadow-lg w-full ${cardClassName}`}>{children}</div>
  </div>
);

export default CenteredCard;
