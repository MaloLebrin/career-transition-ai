import React from 'react';
import logoFull from '~/assets/images/logo-with-name.png';
import logoIcon from '~/assets/images/logo-without-name.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /**
   * Quand true: logo complet (icône + texte intégrés dans l'image).
   * Quand false: icône seule (utilisée dans certains blocs UI).
   */
  showText?: boolean;
}

const heightMap: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 28,
  md: 40,
  lg: 52,
};

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const height = heightMap[size];
  const src = showText ? logoFull : logoIcon;
  const alt = 'France Transition Carrière';

  return (
    <div className="inline-flex items-center bg-transparent">
      <img
        src={src}
        alt={alt}
        style={{ height, width: 'auto' }}
        className="object-contain pointer-events-none select-none"
      />
    </div>
  );
};

export default Logo;

