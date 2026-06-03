import { AbsoluteFill, Sequence } from 'remotion'
import {
  AccessProductScene,
  PRODUCT_DURATION_FRAMES,
  type AccessProductSceneProps,
} from './AccessProductScene'

const SCENES: AccessProductSceneProps['scene'][] = ['home', 'guide', 'plans']

/** Condensed how-it-works reel — one clip for marketing embeds. */
const SEGMENT_FRAMES = Math.floor(PRODUCT_DURATION_FRAMES * 0.45)

export const HOW_IT_WORKS_DURATION_FRAMES = SEGMENT_FRAMES * SCENES.length

export const AccessHowItWorks: React.FC = () => {
  return (
    <AbsoluteFill>
      {SCENES.map((scene, index) => (
        <Sequence
          key={scene}
          from={index * SEGMENT_FRAMES}
          durationInFrames={SEGMENT_FRAMES}
          layout="none"
        >
          <AccessProductScene scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
