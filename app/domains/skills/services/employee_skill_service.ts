import EmployeeSkill from '#models/employee_skill'

export class EmployeeSkillService {
  async updateEmployeeSkillLevel({
    employeeId,
    skillId,
    level,
  }: {
    employeeId: number
    skillId: number
    level: number
  }) {
    const employeeSkill = await EmployeeSkill.updateOrCreate(
      {
        employeeId,
        skillId,
      },
      {
        level,
      }
    )

    return employeeSkill
  }

  async syncSkills(employeeId: number, skills: { skillId: number; level: number }[]) {
    for (const skill of skills) {
      await this.updateEmployeeSkillLevel({
        employeeId,
        skillId: skill.skillId,
        level: skill.level,
      })
    }
  }
}

