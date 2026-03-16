import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'onboarding.submit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.impersonate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'dashboardEmployeeProfile': { paramsTuple?: []; params?: {} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.save_draft_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.store_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'dashboard.candidat_onboarding': { paramsTuple?: []; params?: {} }
    'auth.update_profile_candidat': { paramsTuple?: []; params?: {} }
    'experiences.post': { paramsTuple?: []; params?: {} }
    'experiences.put': { paramsTuple?: []; params?: {} }
    'experiences.delete': { paramsTuple?: []; params?: {} }
    'auth.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'bulk_jobs.index': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_conseiller_exercise_self': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.store_from_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update_from_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_profile_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.download_dossier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.exercise_list_conseiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_exercise_result_conseiller': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'dashboard.exercises.motivation.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.motivation.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.values.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.values.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.personality.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.personality.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.life_curve.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.life_curve.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.targeting.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.targeting.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.disc.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.disc.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.skill_mapping.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.skill_mapping.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.circle_of_control.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.circle_of_control.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'organizations.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'organizations.store_advisor_from_dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.store_organization': { paramsTuple?: []; params?: {} }
    'super_admin.destroy_organization': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.update_user_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'dashboardEmployeeProfile': { paramsTuple?: []; params?: {} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'dashboard.candidat_onboarding': { paramsTuple?: []; params?: {} }
    'bulk_jobs.index': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_conseiller_exercise_self': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_profile_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.download_dossier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.exercise_list_conseiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_exercise_result_conseiller': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'dashboardEmployeeProfile': { paramsTuple?: []; params?: {} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'dashboard.candidat_onboarding': { paramsTuple?: []; params?: {} }
    'bulk_jobs.index': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_conseiller_exercise_self': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_profile_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.download_dossier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.exercise_list_conseiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_exercise_result_conseiller': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'onboarding.submit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.impersonate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.save_draft_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.store_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'experiences.post': { paramsTuple?: []; params?: {} }
    'employees.store_from_dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.exercises.motivation.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.motivation.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.values.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.values.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.personality.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.personality.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.life_curve.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.life_curve.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.targeting.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.targeting.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.disc.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.disc.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.skill_mapping.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.skill_mapping.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.circle_of_control.draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.exercises.circle_of_control.result': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.store_advisor_from_dashboard': { paramsTuple?: []; params?: {} }
    'super_admin.store_organization': { paramsTuple?: []; params?: {} }
    'super_admin.update_user_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'auth.update_profile_candidat': { paramsTuple?: []; params?: {} }
    'experiences.put': { paramsTuple?: []; params?: {} }
    'auth.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'employees.update_from_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.update_from_dashboard': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'experiences.delete': { paramsTuple?: []; params?: {} }
    'super_admin.destroy_organization': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}