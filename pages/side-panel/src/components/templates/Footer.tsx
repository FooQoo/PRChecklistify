import { useI18n } from '@extension/i18n';

const Footer = () => {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="text-center text-sm text-gray-500 mt-8">
      ©{year}{' '}
      <a href="https://github.com/FooQoo" target="_blank" rel="noopener noreferrer">
        FooQoo
      </a>{' '}
      {t('allRightsReserved')}
    </footer>
  );
};

export default Footer;
