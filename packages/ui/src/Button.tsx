// ...existing code...
import './theme.css';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => (
  <button className={`nbz-btn nbz-btn--${variant}`} {...props}>
    {children}
  </button>
);
