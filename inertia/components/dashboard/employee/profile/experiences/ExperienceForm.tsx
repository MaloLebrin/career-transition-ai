import { Form } from '@inertiajs/react';
import { useMemo } from 'react';
import Experience from '../../../../../../app/models/experience';

interface ExperienceFormProps {
  experience: Experience
}

export const ExperienceForm = ({ experience }: ExperienceFormProps) => {
  const experienceData = useMemo(() => ({
    id: experience.id,
    title: experience.title,
    company: experience.company,
    location: experience.location,
    startDate: experience.startDate,
    endDate: experience.endDate,
    description: experience.description,
  }), [experience])

  return (
    <Form route={experienceData.id ? 'experiences.update' : 'experiences.store'} routeParams={{ id: experienceData?.id }}>
      {({ errors, isDirty }) => (
        <>
          <div>
            <label htmlFor="title">Post title</label>
            <input type="text" name="title" id="title" defaultValue={experienceData.title} />
            {errors.title && <div>{errors.title}</div>}
          </div>

          <div>
            <label htmlFor="company">Company</label>
            <input type="text" name="company" id="company" defaultValue={experienceData.company} />
            {errors.company && <div>{errors.company}</div>}
          </div>

          <div>
            <label htmlFor="location">Location</label>
            <input type="text" name="location" id="location" defaultValue={experienceData.location} />
            {errors.location && <div>{errors.location}</div>}
          </div>

          <div>
            <label htmlFor="startDate">Start date</label>
            <input type="date" name="startDate" id="startDate" defaultValue={experienceData.startDate} />
            {errors.startDate && <div>{errors.startDate}</div>}
          </div>

          <div>
            <label htmlFor="endDate">End date</label>
            <input type="date" name="endDate" id="endDate" defaultValue={experienceData.endDate} />
            {errors.endDate && <div>{errors.endDate}</div>}
          </div>

          <div>
            <label htmlFor="description">Description</label>
            <textarea name="description" id="description" defaultValue={experienceData.description} />
            {errors.description && <div>{errors.description}</div>}
          </div>

          <button type="submit" disabled={!isDirty}>Update post</button>
        </>
      )}
    </Form>
  );
};
