import type React from 'react';
import { useState, useEffect } from 'react';
import type { GitHubServer } from '@extension/storage';
import { useI18n } from '@extension/i18n';
import { Button } from '../atoms';

interface ServerFormCardProps {
  mode: 'create' | 'edit';
  server?: GitHubServer; // undefined for create mode
  existingServers?: GitHubServer[]; // List of existing servers to check for duplicates
  onSave: (server: GitHubServer) => Promise<void>;
  onCancel: () => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
  className?: string;
}

interface FormData {
  id: string;
  name: string;
  apiUrl: string;
  webUrl: string;
}

interface FormErrors {
  id?: string;
  name?: string;
  apiUrl?: string;
  webUrl?: string;
}

const ServerFormCard: React.FC<ServerFormCardProps> = ({
  mode,
  server,
  existingServers = [],
  onSave,
  onCancel,
  onToast,
  className = '',
}) => {
  const { t } = useI18n();
  const isEditMode = mode === 'edit';

  const [formData, setFormData] = useState<FormData>({
    id: server?.id || '',
    name: server?.name || '',
    apiUrl: server?.apiUrl || '',
    webUrl: server?.webUrl || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when server prop changes
  useEffect(() => {
    if (server) {
      setFormData({
        id: server.id,
        name: server.name,
        apiUrl: server.apiUrl,
        webUrl: server.webUrl,
      });
    }
  }, [server]);

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t('serverNameRequired');
    } else {
      // Check for duplicate server names (exclude current server in edit mode)
      const duplicateName = existingServers.find(
        s => s.name.toLowerCase() === formData.name.trim().toLowerCase() && (!isEditMode || s.id !== server?.id),
      );
      if (duplicateName) {
        newErrors.name = t('serverNameDuplicate');
      }
    }

    // API URL validation
    if (!formData.apiUrl.trim()) {
      newErrors.apiUrl = t('apiUrlRequired');
    } else if (!isValidUrl(formData.apiUrl)) {
      newErrors.apiUrl = t('invalidUrlFormat');
    } else {
      // Check for duplicate API URLs (exclude current server in edit mode)
      const duplicateApiUrl = existingServers.find(
        s => s.apiUrl.toLowerCase() === formData.apiUrl.trim().toLowerCase() && (!isEditMode || s.id !== server?.id),
      );
      if (duplicateApiUrl) {
        newErrors.apiUrl = t('apiUrlDuplicate');
      }
    }

    // Web URL validation
    if (!formData.webUrl.trim()) {
      newErrors.webUrl = t('webUrlRequired');
    } else if (!isValidUrl(formData.webUrl)) {
      newErrors.webUrl = t('invalidUrlFormat');
    } else {
      // Check for duplicate Web URLs (exclude current server in edit mode)
      const duplicateWebUrl = existingServers.find(
        s => s.webUrl.toLowerCase() === formData.webUrl.trim().toLowerCase() && (!isEditMode || s.id !== server?.id),
      );
      if (duplicateWebUrl) {
        newErrors.webUrl = t('webUrlDuplicate');
      }
    }

    return newErrors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const generateIdFromName = (name: string): string => {
    // Generate ID from name with timestamp to ensure uniqueness
    const baseId = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40); // Leave room for timestamp

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36); // Convert to base36 for shorter string
    return `${baseId}-${timestamp}`;
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate ID from name in create mode (always update when name changes)
    if (!isEditMode && field === 'name' && value.trim()) {
      const generatedId = generateIdFromName(value);
      setFormData(prev => ({
        ...prev,
        id: generatedId,
      }));
    }

    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: formData.id.trim(),
        name: formData.name.trim(),
        apiUrl: formData.apiUrl.trim(),
        webUrl: formData.webUrl.trim(),
      });
      onToast(isEditMode ? t('serverUpdatedSuccess') : t('serverAddedSuccess'), 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('serverDeleteError');
      onToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Conditional styling based on mode
  const containerClasses =
    mode === 'create'
      ? `border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50 ${className}`
      : `bg-white border border-gray-200 rounded-lg p-4 ${className}`;

  const titleColor = mode === 'create' ? 'text-blue-900' : 'text-gray-900';

  return (
    <div className={containerClasses}>
      {/* Header with action buttons */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${titleColor}`}>{isEditMode ? t('editServer') : t('addServer')}</h3>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isSubmitting} className="text-xs">
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="text-xs">
            {isSubmitting ? t('saving') : isEditMode ? t('updateServer') : t('save')}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Server Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('serverName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={e => handleFieldChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('githubEnterpriseServerPlaceholder')}
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* API URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('apiUrl')} <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.apiUrl}
            onChange={e => handleFieldChange('apiUrl', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
              errors.apiUrl ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('githubApiUrlPlaceholder')}
            disabled={isSubmitting}
          />
          {errors.apiUrl && <p className="text-red-500 text-xs mt-1">{errors.apiUrl}</p>}
          <p className="mt-1 text-xs text-gray-500">{t('apiUrlHelpText')}</p>
        </div>

        {/* Web URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('webUrl')} <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.webUrl}
            onChange={e => handleFieldChange('webUrl', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
              errors.webUrl ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://github.company.com"
            disabled={isSubmitting}
          />
          {errors.webUrl && <p className="text-red-500 text-xs mt-1">{errors.webUrl}</p>}
          <p className="mt-1 text-xs text-gray-500">{t('webUrlHelpText')}</p>
        </div>
      </form>
    </div>
  );
};

export default ServerFormCard;
