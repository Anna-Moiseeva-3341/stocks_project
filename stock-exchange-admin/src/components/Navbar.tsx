import { Link } from 'react-router-dom';

const Navbar = () => {
  const navStyle = {
    background: '#333',
    padding: '10px',
    display: 'flex',
    gap: '20px',
  };
  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '18px',
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={linkStyle}>
        Брокеры
      </Link>
      <Link to="/stocks" style={linkStyle}>
        Акции
      </Link>
      <Link to="/simulation" style={linkStyle}>
        Симуляция
      </Link>
    </nav>
  );
};

export default Navbar;
