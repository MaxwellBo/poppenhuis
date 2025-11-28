import { Item } from '../data/manifest';
import { ModelSize, ModelViewerWrapper } from './ModelViewerWrapper';
import { SplatRenderer } from './SplatRenderer';

export function UnifiedModelRenderer(props: { item: Item; size?: ModelSize; }) {
  const { item } = props;
  
  // Check if the model is a Gaussian splat (.spz or .splat)
  const isSplat = item.model.endsWith('.spz') || item.model.endsWith('.splat');
  
  if (isSplat) {
    return <SplatRenderer {...props} />;
  } else {
    return <ModelViewerWrapper {...props} />;
  }
}