import { Composition } from 'remotion'
import {
  AccessHeroAmbient,
  HERO_DURATION_FRAMES,
} from './AccessHeroAmbient'
import {
  AccessHowItWorks,
  HOW_IT_WORKS_DURATION_FRAMES,
} from './AccessHowItWorks'
import {
  AccessProductScene,
  PRODUCT_DURATION_FRAMES,
  type AccessProductSceneProps,
} from './AccessProductScene'
import { VIDEO } from './theme'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AccessHeroAmbient"
        component={AccessHeroAmbient}
        durationInFrames={HERO_DURATION_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="AccessProductScene"
        component={AccessProductScene}
        durationInFrames={PRODUCT_DURATION_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{ scene: 'home' satisfies AccessProductSceneProps['scene'] }}
      />
      <Composition
        id="AccessHowItWorks"
        component={AccessHowItWorks}
        durationInFrames={HOW_IT_WORKS_DURATION_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  )
}
