const Logo = (props) => (
  <img
    alt="Logo"
    // src="/static/sampleLogo.png"
    src="/static/logo.svg"
    {...props}
    style={{ height: '60px', width: '65px' }}
  />
);

export default Logo;
