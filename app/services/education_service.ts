import Education from '#models/education'

type CreateEducationData = Pick<
  Education,
  'degree' | 'school' | 'startDate' | 'endDate' | 'isCurrent' | 'description' | 'employeeId'
>

export class EducationService {
  async create(data: CreateEducationData) {
    return Education.create(data)
  }

  async update(id: number, data: Omit<CreateEducationData, 'employeeId'>) {
    const education = await Education.findOrFail(id)

    education.merge(data)
    await education.save()

    return education
  }

  async delete(id: number) {
    const education = await Education.findOrFail(id)
    await education.delete()
  }

  async findById(id: number) {
    return Education.findOrFail(id)
  }

  async findAllByUserId(userId: number) {
    return Education.query().where('user_id', userId).orderBy('start_date', 'desc')
  }
}
