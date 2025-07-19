import { useI18n } from '@extension/i18n';

const Footer = () => {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const { author } = __FOOTER_CONFIG__.footer;

  return (
    <footer className="text-center text-sm text-gray-500 mt-8">
      ©{year}{' '}
      <a href={author.url} target="_blank" rel="noopener noreferrer">
        {author.name}
      </a>{' '}
      {t('allRightsReserved')}
    </footer>
  );
};

export default Footer;
