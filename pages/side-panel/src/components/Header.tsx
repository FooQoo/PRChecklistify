import { t } from '@extension/i18n';

const Header = () => {
  return (
    <div className="flex justify-between items-center p-2 bg-gray-100 border-b border-gray-300 mb-4">
      <div className="cursor-pointer">
        <h1 className="text-lg font-bold">{t('extensionName')}</h1>
      </div>
    </div>
  );
};

export default Header;
