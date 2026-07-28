// Icon.jsx is plain JS (ported as-is from starter-react-app); without these
// types TS infers every prop as required and flags normal usage.
export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
  className?: string;
}

declare function Icon(props: IconProps): JSX.Element | null;
export default Icon;
