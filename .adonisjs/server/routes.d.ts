import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.impersonate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'onboarding.submit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'employees.store_from_dashboard': { paramsTuple?: []; params?: {} }
    'employees.update_from_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'organizations.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'organizations.store_advisor_from_dashboard': { paramsTuple?: []; params?: {} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.store_organization': { paramsTuple?: []; params?: {} }
    'super_admin.destroy_organization': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.update_user_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
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
  }
  GET: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.current': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.index_advisors': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.current': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.index_advisors': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.impersonate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'onboarding.submit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
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
    'employees.store': { paramsTuple?: []; params?: {} }
    'exercise_results.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.save_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.fetch_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.store_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'employees.update_from_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'organizations.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'employees.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'super_admin.destroy_organization': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}