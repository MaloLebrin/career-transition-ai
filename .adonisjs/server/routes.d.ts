import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'webhooks.stripe': { paramsTuple?: []; params?: {} }
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
    'super_admin.expert_requests.index': { paramsTuple?: []; params?: {} }
    'super_admin.expert_requests.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.expert_requests.decline': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.team.index': { paramsTuple?: []; params?: {} }
    'super_admin.team.invite': { paramsTuple?: []; params?: {} }
    'super_admin.b2c.index': { paramsTuple?: []; params?: {} }
    'super_admin.b2c.grant': { paramsTuple: [ParamValue]; params: {'employeeId': ParamValue} }
    'super_admin.payments.index': { paramsTuple?: []; params?: {} }
    'super_admin.payments.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'educations.store': { paramsTuple?: []; params?: {} }
    'educations.update': { paramsTuple?: []; params?: {} }
    'educations.delete': { paramsTuple?: []; params?: {} }
    'experiences.store': { paramsTuple?: []; params?: {} }
    'experiences.update': { paramsTuple?: []; params?: {} }
    'experiences.delete': { paramsTuple?: []; params?: {} }
    'candidat.expertRequests.index': { paramsTuple?: []; params?: {} }
    'candidat.expertRequests.store': { paramsTuple?: []; params?: {} }
    'dashboard.advisor_home': { paramsTuple?: []; params?: {} }
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
    'conseiller.employees.documents.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'conseiller.employees.documents.download': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'mediaId': ParamValue} }
    'conseiller.employees.documents.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'mediaId': ParamValue} }
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
    'organization_logos.store': { paramsTuple?: []; params?: {} }
    'organization_logos.destroy': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'pdf_export_downloads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_as_read': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.register_candidate': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.impersonate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'passwords.send_reset_link': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'passwords.show_forgot': { paramsTuple?: []; params?: {} }
    'passwords.send_forgot': { paramsTuple?: []; params?: {} }
    'passwords.show_reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'passwords.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'passwords.update': { paramsTuple?: []; params?: {} }
    'email_verification.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'ai_assist.extract_cv': { paramsTuple?: []; params?: {} }
    'ai_assist.extract_skill_mapping': { paramsTuple?: []; params?: {} }
    'ai_assist.suggest_targets': { paramsTuple?: []; params?: {} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'dashboardEmployeeProfile': { paramsTuple?: []; params?: {} }
    'employees.show_step_detail_candidat': { paramsTuple: [ParamValue]; params: {'stepId': ParamValue} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employee_syntheses.show_candidate': { paramsTuple?: []; params?: {} }
    'employee_syntheses.generate_shareable_pdf_candidate': { paramsTuple?: []; params?: {} }
    'candidat.documents.store': { paramsTuple?: []; params?: {} }
    'candidat.documents.download': { paramsTuple: [ParamValue]; params: {'mediaId': ParamValue} }
    'candidat.documents.destroy': { paramsTuple: [ParamValue]; params: {'mediaId': ParamValue} }
    'exercise_results.save_draft_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.store_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'dashboard.candidat_onboarding': { paramsTuple?: []; params?: {} }
    'candidat_onboarding.complete': { paramsTuple?: []; params?: {} }
    'auth.update_profile_candidat': { paramsTuple?: []; params?: {} }
    'candidat.data.export': { paramsTuple?: []; params?: {} }
    'candidat.data.erasureRequest': { paramsTuple?: []; params?: {} }
    'candidat.emailVerification.resend': { paramsTuple?: []; params?: {} }
    'candidat.billing.offer': { paramsTuple?: []; params?: {} }
    'candidat.billing.checkout': { paramsTuple?: []; params?: {} }
    'candidat.billing.success': { paramsTuple?: []; params?: {} }
    'candidat.billing.cancel': { paramsTuple?: []; params?: {} }
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'onboarding.submit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'contact_requests.store': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'webhooks.stripe': { paramsTuple?: []; params?: {} }
    'super_admin.store_organization': { paramsTuple?: []; params?: {} }
    'super_admin.store_user': { paramsTuple?: []; params?: {} }
    'super_admin.update_user_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.resend_user_onboarding': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.expert_requests.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.expert_requests.decline': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super_admin.team.invite': { paramsTuple?: []; params?: {} }
    'super_admin.b2c.grant': { paramsTuple: [ParamValue]; params: {'employeeId': ParamValue} }
    'super_admin.payments.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'educations.store': { paramsTuple?: []; params?: {} }
    'experiences.store': { paramsTuple?: []; params?: {} }
    'candidat.expertRequests.store': { paramsTuple?: []; params?: {} }
    'employees.store_from_dashboard': { paramsTuple?: []; params?: {} }
    'employees.resend_onboarding_link': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.share': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.unshare': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.generate_shareable_pdf_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'support_plan_steps.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'support_plan_steps.unlock': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'support_plan_steps.lock': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'conseiller.employees.documents.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'organization_logos.store': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.register_candidate': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.impersonate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'passwords.send_reset_link': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'passwords.send_forgot': { paramsTuple?: []; params?: {} }
    'passwords.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'ai_assist.extract_cv': { paramsTuple?: []; params?: {} }
    'ai_assist.extract_skill_mapping': { paramsTuple?: []; params?: {} }
    'ai_assist.suggest_targets': { paramsTuple?: []; params?: {} }
    'employee_syntheses.generate_shareable_pdf_candidate': { paramsTuple?: []; params?: {} }
    'candidat.documents.store': { paramsTuple?: []; params?: {} }
    'exercise_results.save_draft_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'exercise_results.store_from_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'candidat.data.erasureRequest': { paramsTuple?: []; params?: {} }
    'candidat.emailVerification.resend': { paramsTuple?: []; params?: {} }
    'candidat.billing.checkout': { paramsTuple?: []; params?: {} }
    'onboarding.submit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'contact_requests.store': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'super_admin.home': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
    'super_admin.pdf_exports': { paramsTuple?: []; params?: {} }
    'super_admin.expert_requests.index': { paramsTuple?: []; params?: {} }
    'super_admin.team.index': { paramsTuple?: []; params?: {} }
    'super_admin.b2c.index': { paramsTuple?: []; params?: {} }
    'super_admin.payments.index': { paramsTuple?: []; params?: {} }
    'candidat.expertRequests.index': { paramsTuple?: []; params?: {} }
    'dashboard.advisor_home': { paramsTuple?: []; params?: {} }
    'pdf_exports.index': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_conseiller_exercise_self': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_profile_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.download_dossier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.show_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_step_detail': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'conseiller.employees.documents.download': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'mediaId': ParamValue} }
    'exercise_results.exercise_list_conseiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_exercise_result_conseiller': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'pdf_export_downloads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'passwords.show_forgot': { paramsTuple?: []; params?: {} }
    'passwords.show_reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'email_verification.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'dashboardEmployeeProfile': { paramsTuple?: []; params?: {} }
    'employees.show_step_detail_candidat': { paramsTuple: [ParamValue]; params: {'stepId': ParamValue} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employee_syntheses.show_candidate': { paramsTuple?: []; params?: {} }
    'candidat.documents.download': { paramsTuple: [ParamValue]; params: {'mediaId': ParamValue} }
    'dashboard.candidat_onboarding': { paramsTuple?: []; params?: {} }
    'candidat.data.export': { paramsTuple?: []; params?: {} }
    'candidat.billing.offer': { paramsTuple?: []; params?: {} }
    'candidat.billing.success': { paramsTuple?: []; params?: {} }
    'candidat.billing.cancel': { paramsTuple?: []; params?: {} }
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'health_checks': { paramsTuple?: []; params?: {} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'super_admin.home': { paramsTuple?: []; params?: {} }
    'super_admin.organizations': { paramsTuple?: []; params?: {} }
    'super_admin.users': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage': { paramsTuple?: []; params?: {} }
    'super_admin.exercise_usage_export': { paramsTuple?: []; params?: {} }
    'super_admin.pdf_exports': { paramsTuple?: []; params?: {} }
    'super_admin.expert_requests.index': { paramsTuple?: []; params?: {} }
    'super_admin.team.index': { paramsTuple?: []; params?: {} }
    'super_admin.b2c.index': { paramsTuple?: []; params?: {} }
    'super_admin.payments.index': { paramsTuple?: []; params?: {} }
    'candidat.expertRequests.index': { paramsTuple?: []; params?: {} }
    'dashboard.advisor_home': { paramsTuple?: []; params?: {} }
    'pdf_exports.index': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_conseiller_exercise_self': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employees.index_dashboard': { paramsTuple?: []; params?: {} }
    'employees.show_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_profile_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.download_dossier': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.show_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.show_step_detail': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'conseiller.employees.documents.download': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'mediaId': ParamValue} }
    'exercise_results.exercise_list_conseiller': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.show_exercise_result_conseiller': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'exercise_results.show_dashboard': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'type': ParamValue} }
    'organizations.settings_dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'pdf_export_downloads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'passwords.show_forgot': { paramsTuple?: []; params?: {} }
    'passwords.show_reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'email_verification.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'dashboard.candidat_home': { paramsTuple?: []; params?: {} }
    'dashboardEmployeeProfile': { paramsTuple?: []; params?: {} }
    'employees.show_step_detail_candidat': { paramsTuple: [ParamValue]; params: {'stepId': ParamValue} }
    'exercise_results.exercise_list_candidat': { paramsTuple?: []; params?: {} }
    'exercise_results.show_dashboard_candidat': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'employee_syntheses.show_candidate': { paramsTuple?: []; params?: {} }
    'candidat.documents.download': { paramsTuple: [ParamValue]; params: {'mediaId': ParamValue} }
    'dashboard.candidat_onboarding': { paramsTuple?: []; params?: {} }
    'candidat.data.export': { paramsTuple?: []; params?: {} }
    'candidat.billing.offer': { paramsTuple?: []; params?: {} }
    'candidat.billing.success': { paramsTuple?: []; params?: {} }
    'candidat.billing.cancel': { paramsTuple?: []; params?: {} }
    'onboarding.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'health_checks': { paramsTuple?: []; params?: {} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'super_admin.destroy_organization': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'educations.delete': { paramsTuple?: []; params?: {} }
    'experiences.delete': { paramsTuple?: []; params?: {} }
    'notes.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'support_plan_steps.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'conseiller.employees.documents.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'mediaId': ParamValue} }
    'organization_logos.destroy': { paramsTuple?: []; params?: {} }
    'candidat.documents.destroy': { paramsTuple: [ParamValue]; params: {'mediaId': ParamValue} }
  }
  PUT: {
    'educations.update': { paramsTuple?: []; params?: {} }
    'experiences.update': { paramsTuple?: []; params?: {} }
    'auth.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'notes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update_from_dashboard': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_syntheses.update_advisor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'support_plan_steps.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'stepId': ParamValue} }
    'organizations.update_from_dashboard': { paramsTuple?: []; params?: {} }
    'passwords.update': { paramsTuple?: []; params?: {} }
    'candidat_onboarding.complete': { paramsTuple?: []; params?: {} }
    'auth.update_profile_candidat': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'notifications.mark_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_as_read': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}