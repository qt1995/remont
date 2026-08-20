import { Section } from '@/components/ui/Section'
import { StageSlider } from '@/components/sections/StageSlider'

export function StageSliderSection() {
  return (
    <Section
      id="stages-compare"
      eyebrow="Этапы наглядно"
      title="Одна и та же комната на трёх этапах"
      lead="Потяните ползунок: слева комната уходит вперёд по этапам, справа остаётся то, что было. Так видно, за что именно платят на каждом шаге."
    >
      <StageSlider />
    </Section>
  )
}
