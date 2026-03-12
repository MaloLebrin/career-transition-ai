import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'onboarding.submit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'employees.store': { paramsTuple?: []; params?: {} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.save_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.fetch_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.current': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.index_advisors': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.store_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bulk_jobs.store_emails': { paramsTuple?: []; params?: {} }
    'bulk_jobs.store_pdfs': { paramsTuple?: []; params?: {} }
    'bulk_jobs.index': { paramsTuple?: []; params?: {} }
    'bulk_jobs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.impersonate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'auth.update_profile_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.save_draft_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.store_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'auth.update_from_dashboard': { paramsTuple?: []; params?: {} }
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
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.store_organization': { paramsTuple?: []; params?: {} }
    'super_admin.destroy_organization': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.update_user_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.current': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.index_advisors': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bulk_jobs.index': { paramsTuple?: []; params?: {} }
    'bulk_jobs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.show_dashboard_conseiller_exercise_self': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_profile_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.download_dossier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.exercise_list_conseiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_exercise_result_conseiller': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.current': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.index_advisors': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bulk_jobs.index': { paramsTuple?: []; params?: {} }
    'bulk_jobs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.show_dashboard_conseiller_exercise_self': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_profile_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.download_dossier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.exercise_list_conseiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_exercise_result_conseiller': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'onboarding.submit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'employees.store': { paramsTuple?: []; params?: {} }
    'exercise_results.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.save_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.fetch_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.store_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bulk_jobs.store_emails': { paramsTuple?: []; params?: {} }
    'bulk_jobs.store_pdfs': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.impersonate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'exercise_results.save_draft_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.store_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
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
  }
  PUT: {
    'employees.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.update_profile_candidat': { paramsTuple?: []; params?: {} }
    'auth.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'employees.update_from_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.update_from_dashboard': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'super_admin.destroy_organization': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}