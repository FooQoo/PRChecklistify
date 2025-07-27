import type React from 'react';
import { useI18n } from '@extension/i18n';

export type ServerStatus = 'configured' | 'no-token' | 'disabled';

interface ServerStatusIndicatorProps {
  status: ServerStatus;
  className?: string;
}

const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({ status, className = '' }) => {
  const { t } = useI18n();

  const getStatusConfig = (status: ServerStatus) => {
    switch (status) {
      case 'configured':
        return {
          icon: '●',
          label: t('configured'),
          iconColor: 'text-green-500',
          badgeColor: 'bg-green-100 text-green-800',
        };
      case 'no-token':
        return {
          icon: '⚠',
          label: t('noToken'),
          iconColor: 'text-orange-500',
          badgeColor: 'bg-orange-100 text-orange-800',
        };
      case 'disabled':
        return {
          icon: '●',
          label: t('disabled'),
          iconColor: 'text-gray-400',
          badgeColor: 'bg-gray-100 text-gray-600',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={`text-sm ${config.iconColor}`} aria-hidden="true">
        {config.icon}
      </span>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.badgeColor}`}
        aria-label={`Status: ${config.label}`}>
        {config.label}
      </span>
    </div>
  );
};

export default ServerStatusIndicator;
