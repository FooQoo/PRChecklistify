const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="text-center text-sm text-gray-500 mt-8">
      ©{year}{' '}
      <a href="https://github.com/FooQoo" target="_blank" rel="noopener noreferrer">
        FooQoo
      </a>{' '}
      All rights reserved.
    </footer>
  );
};

export default Footer;
