import Experience from '#models/experience'

type TempExperience = Pick<
  Experience,
  'title' | 'company' | 'type' | 'startDate' | 'endDate' | 'isCurrent' | 'description'
>

export class ExperienceService {
  async create(data: TempExperience) {
    return Experience.create(data)
  }

  async update(id: number, data: TempExperience) {
    const experience = await Experience.findOrFail(id)

    experience.merge(data)
    await experience.save()

    return experience
  }

  async delete(id: number) {
    const experience = await Experience.findOrFail(id)
    await experience.delete()
  }

  async findById(id: number) {
    return Experience.findOrFail(id)
  }

  async findAllByUserId(userId: number) {
    return Experience.query().where('user_id', userId).orderBy('start_date', 'desc')
  }
}
