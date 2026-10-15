import { Quote } from 'lucide-react'
import React from 'react'
import type { Testimonial } from '#shared/constants/team'
import Card from '~/components/ui/Card'

export interface TestimonialCardProps {
  testimonial: Testimonial
  className?: string
}

/** Avis d'une personne qui a fait le parcours : citation, prénom et situation. Pas de note. */
export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  testimonial,
  className = '',
}) => (
  <Card padding="md" className={`h-full ${className}`.trim()}>
    <figure className="flex h-full flex-col gap-4">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint-sun text-tint-sun-ink"
        aria-hidden="true"
      >
        <Quote size={20} />
      </span>
      <blockquote className="flex-1">
        <p className="text-base leading-relaxed text-ink">{testimonial.quote}</p>
      </blockquote>
      <figcaption className="space-y-0.5">
        <p className="font-semibold text-ink">{testimonial.author}</p>
        <p className="text-sm text-muted">{testimonial.context}</p>
      </figcaption>
    </figure>
  </Card>
)
