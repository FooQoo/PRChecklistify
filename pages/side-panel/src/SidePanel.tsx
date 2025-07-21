import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import AppRouter from './views/AppRoutes';
import { useI18n } from '@extension/i18n';
import { useCurrentPage } from './hooks/useCurrentPage';

const Loading = () => {
  const { t } = useI18n();
  return <div>{t('loading')}</div>;
};

const ErrorFallback = () => {
  const { t } = useI18n();
  return <div>{t('error')}</div>;
};

const SidePanel = () => {
  // Initialize i18n
  const { t } = useI18n();
  const { loading } = useCurrentPage();

  if (loading) {
    return <div>{t('loading')}</div>;
  }

  return <AppRouter />;
};

export default withErrorBoundary(withSuspense(SidePanel, <Loading />), <ErrorFallback />);
