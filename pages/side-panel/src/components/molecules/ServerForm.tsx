import type React from 'react';
import { useState, useEffect } from 'react';
import type { GitHubServer } from '@extension/storage';
import { useI18n } from '@extension/i18n';
import { Button } from '../atoms';

interface ServerFormProps {
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

const ServerForm: React.FC<ServerFormProps> = ({
  server,
  existingServers = [],
  onSave,
  onCancel,
  onToast,
  className = '',
}) => {
  const { t } = useI18n();
  const isEditMode = !!server;

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

    // ID validation (only for create mode)
    if (!isEditMode) {
      if (!formData.id.trim()) {
        newErrors.id = t('serverIdRequired');
      } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.id)) {
        newErrors.id = t('serverIdInvalidFormat');
      }
    }

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
      newErrors.apiUrl = t('apiUrlInvalidFormat');
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
      newErrors.webUrl = t('webUrlInvalidFormat');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const message = error instanceof Error ? error.message : t('serverSaveError');
      onToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{isEditMode ? t('editServer') : t('addServer')}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode ? t('editServerDescription') : t('addServerDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Server ID is auto-generated and not displayed in the form */}

        {/* Server Name */}
        <div>
          <label htmlFor="server-name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('serverName')} <span className="text-red-500">*</span>
          </label>
          <input
            id="server-name"
            type="text"
            value={formData.name}
            onChange={e => handleFieldChange('name', e.target.value)}
            placeholder="GitHub Enterprise Server"
            className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm ${
              errors.name
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            aria-describedby={errors.name ? 'server-name-error' : undefined}
          />
          {errors.name && (
            <p id="server-name-error" className="mt-1 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        {/* API URL */}
        <div>
          <label htmlFor="api-url" className="block text-sm font-medium text-gray-700 mb-1">
            {t('apiUrl')} <span className="text-red-500">*</span>
          </label>
          <input
            id="api-url"
            type="url"
            value={formData.apiUrl}
            onChange={e => handleFieldChange('apiUrl', e.target.value)}
            placeholder="https://github.company.com/api/v3"
            className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm font-mono ${
              errors.apiUrl
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            aria-describedby={errors.apiUrl ? 'api-url-error' : undefined}
          />
          {errors.apiUrl && (
            <p id="api-url-error" className="mt-1 text-sm text-red-600">
              {errors.apiUrl}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">{t('apiUrlHelpText')}</p>
        </div>

        {/* Web URL */}
        <div>
          <label htmlFor="web-url" className="block text-sm font-medium text-gray-700 mb-1">
            {t('webUrl')} <span className="text-red-500">*</span>
          </label>
          <input
            id="web-url"
            type="url"
            value={formData.webUrl}
            onChange={e => handleFieldChange('webUrl', e.target.value)}
            placeholder="https://github.company.com"
            className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm font-mono ${
              errors.webUrl
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            aria-describedby={errors.webUrl ? 'web-url-error' : undefined}
          />
          {errors.webUrl && (
            <p id="web-url-error" className="mt-1 text-sm text-red-600">
              {errors.webUrl}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">{t('webUrlHelpText')}</p>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? t('saving') : isEditMode ? t('updateServer') : t('addServer')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ServerForm;
