const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="text-center text-sm text-gray-500 mt-8">
      ©{year} FooQoo All rights reserved.
    </footer>
  );
};

export default Footer;
