import Experience from '#models/experience'

type TempExperience = Pick<
  Experience,
  | 'title'
  | 'company'
  | 'type'
  | 'startDate'
  | 'endDate'
  | 'isCurrent'
  | 'description'
  | 'employeeId'
>

export class ExperienceService {
  async create(data: TempExperience) {
    return Experience.create(data)
  }

  /**
   * Toujours restreint au profil `employeeId` : l'identifiant vient du corps de
   * la requête, une expérience d'un autre candidat doit rester introuvable (404).
   */
  async update(employeeId: number, id: number, data: Omit<TempExperience, 'employeeId'>) {
    const experience = await this.findOwned(employeeId, id)

    experience.merge(data)
    await experience.save()

    return experience
  }

  async delete(employeeId: number, id: number) {
    const experience = await this.findOwned(employeeId, id)
    await experience.delete()
  }

  private findOwned(employeeId: number, id: number) {
    return Experience.query().where('id', id).where('employeeId', employeeId).firstOrFail()
  }

  async findById(id: number) {
    return Experience.findOrFail(id)
  }
}
