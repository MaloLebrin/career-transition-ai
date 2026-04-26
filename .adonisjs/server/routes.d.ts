import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.impersonate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'onboarding.submit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'super_admin.home': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.store_organization': { paramsTuple?: []; params?: {} }
    'super_admin.destroy_organization': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.store_user': { paramsTuple?: []; params?: {} }
    'super_admin.update_user_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.resend_user_onboarding': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
    'super_admin.pdf_exports': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'dashboardEmployeeProfile': { paramsTuple?: []; params?: {} }
    'employees.show_step_detail_candidat': { paramsTuple: [ParamValue]; params: {'stepId': ParamValue} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employee_syntheses.show_candidate': { paramsTuple?: []; params?: {} }
    'employee_syntheses.generate_shareable_pdf_candidate': { paramsTuple?: []; params?: {} }
    'exercise_results.save_draft_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.store_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'dashboard.candidat_onboarding': { paramsTuple?: []; params?: {} }
    'candidat_onboarding.complete': { paramsTuple?: []; params?: {} }
    'auth.update_profile_candidat': { paramsTuple?: []; params?: {} }
    'educations.store': { paramsTuple?: []; params?: {} }
    'educations.update': { paramsTuple?: []; params?: {} }
    'educations.delete': { paramsTuple?: []; params?: {} }
    'experiences.store': { paramsTuple?: []; params?: {} }
    'experiences.update': { paramsTuple?: []; params?: {} }
    'experiences.delete': { paramsTuple?: []; params?: {} }
    'auth.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'pdf_exports.index': { paramsTuple?: []; params?: {} }
    'notes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notes.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_dashboard_conseiller_exercise_self': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.store_from_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update_from_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_profile_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.download_dossier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.resend_onboarding_link': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.show_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.update_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.share': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.unshare': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.generate_shareable_pdf_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_step_detail': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'support_plan_steps.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'support_plan_steps.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'support_plan_steps.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'support_plan_steps.unlock': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'support_plan_steps.lock': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'notes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'pdf_export_downloads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_as_read': { paramsTuple?: []; params?: {} }
    'contact_requests.store': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'super_admin.home': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
    'super_admin.pdf_exports': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'dashboardEmployeeProfile': { paramsTuple?: []; params?: {} }
    'employees.show_step_detail_candidat': { paramsTuple: [ParamValue]; params: {'stepId': ParamValue} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employee_syntheses.show_candidate': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_onboarding': { paramsTuple?: []; params?: {} }
    'pdf_exports.index': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_conseiller_exercise_self': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_profile_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.download_dossier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.show_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_step_detail': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'exercise_results.exercise_list_conseiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_exercise_result_conseiller': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'pdf_export_downloads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'super_admin.home': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
    'super_admin.pdf_exports': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'dashboardEmployeeProfile': { paramsTuple?: []; params?: {} }
    'employees.show_step_detail_candidat': { paramsTuple: [ParamValue]; params: {'stepId': ParamValue} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employee_syntheses.show_candidate': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_onboarding': { paramsTuple?: []; params?: {} }
    'pdf_exports.index': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_conseiller_exercise_self': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_profile_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.download_dossier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.show_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_step_detail': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'exercise_results.exercise_list_conseiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_exercise_result_conseiller': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'pdf_export_downloads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.impersonate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'onboarding.submit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'super_admin.store_organization': { paramsTuple?: []; params?: {} }
    'super_admin.store_user': { paramsTuple?: []; params?: {} }
    'super_admin.update_user_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.resend_user_onboarding': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.generate_shareable_pdf_candidate': { paramsTuple?: []; params?: {} }
    'exercise_results.save_draft_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.store_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'educations.store': { paramsTuple?: []; params?: {} }
    'experiences.store': { paramsTuple?: []; params?: {} }
    'employees.store_from_dashboard': { paramsTuple?: []; params?: {} }
    'employees.resend_onboarding_link': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.share': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.unshare': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.generate_shareable_pdf_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'support_plan_steps.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'support_plan_steps.unlock': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'support_plan_steps.lock': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'notes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'contact_requests.store': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'super_admin.destroy_organization': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'educations.delete': { paramsTuple?: []; params?: {} }
    'experiences.delete': { paramsTuple?: []; params?: {} }
    'notes.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'support_plan_steps.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
  }
  PUT: {
    'candidat_onboarding.complete': { paramsTuple?: []; params?: {} }
    'auth.update_profile_candidat': { paramsTuple?: []; params?: {} }
    'educations.update': { paramsTuple?: []; params?: {} }
    'experiences.update': { paramsTuple?: []; params?: {} }
    'auth.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'notes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update_from_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.update_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'support_plan_steps.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'organizations.update_from_dashboard': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'notifications.mark_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_as_read': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}