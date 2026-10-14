import { ProductHero, productIcon } from './ProductHero';
import { safeImageUrl } from '../../utils/urls';

export function GameHero({ game, children }) {
  const screenshots = [...new Set((game.screenshots || []).map(safeImageUrl).filter(Boolean))];
  const background = safeImageUrl(game.heroImage) || safeImageUrl(game.coverImage);
  const icon = safeImageUrl(productIcon(game.microsoftStore));
  return <ProductHero title={game.title} icon={icon} images={screenshots.length ? screenshots : background ? [background] : []}>{children}</ProductHero>;
}
