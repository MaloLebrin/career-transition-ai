import Education from '#models/education'

type CreateEducationData = Pick<
  Education,
  'degree' | 'school' | 'startDate' | 'endDate' | 'isCurrent' | 'description' | 'employeeId'
>

export class EducationService {
  async create(data: CreateEducationData) {
    return Education.create(data)
  }

  /**
   * Toujours restreint au profil `employeeId` : l'identifiant vient du corps de
   * la requête, une formation d'un autre candidat doit rester introuvable (404).
   */
  async update(employeeId: number, id: number, data: Omit<CreateEducationData, 'employeeId'>) {
    const education = await this.findOwned(employeeId, id)

    education.merge(data)
    await education.save()

    return education
  }

  async delete(employeeId: number, id: number) {
    const education = await this.findOwned(employeeId, id)
    await education.delete()
  }

  private findOwned(employeeId: number, id: number) {
    return Education.query().where('id', id).where('employeeId', employeeId).firstOrFail()
  }

  async findById(id: number) {
    return Education.findOrFail(id)
  }
}
