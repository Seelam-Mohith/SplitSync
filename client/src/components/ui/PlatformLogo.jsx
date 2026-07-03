import netflixLogo from '../../assets/logos/netflix.webp';
import spotifyLogo from '../../assets/logos/spotify.svg';
import youtubeLogo from '../../assets/logos/youtube.svg';
import jiohotstarLogo from '../../assets/logos/jiohotstar.svg';
import hboLogo from '../../assets/logos/hbo.svg';
import amazonLogo from '../../assets/logos/primevideo.png';
import appleLogo from '../../assets/logos/apple.svg';
import otherLogo from '../../assets/logos/other.svg';

const logos = {
  netflix: netflixLogo,
  spotify: spotifyLogo,
  youtube: youtubeLogo,
  jiohotstar: jiohotstarLogo,
  hbo: hboLogo,
  amazon: amazonLogo,
  apple: appleLogo,
  other: otherLogo,
};

const colors = {
  netflix: 'bg-black',
  spotify: 'bg-[#1db954]',
  youtube: 'bg-[#ff0000]',
  jiohotstar: 'bg-[#e03b3b]',
  hbo: 'bg-[#5822b4]',
  amazon: 'bg-[#1a242f]',
  apple: 'bg-[#555555]',
  other: 'bg-surface-lighter',
};

export default function PlatformLogo({ type, size = 'md', className = '' }) {
  const src = logos[type] || otherLogo;
  const color = colors[type] || 'bg-surface-lighter';
  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };

  return (
    <div
      className={`${sizes[size]} ${color} rounded-lg flex items-center justify-center shrink-0 ${className}`}
    >
      <img src={src} alt={type || 'logo'} className={`${type === 'netflix' || type === 'amazon' ? 'w-full h-full object-contain rounded-lg' : 'w-6 h-6 object-contain'}`} />
    </div>
  );
}
